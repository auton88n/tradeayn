
# Fix AYN: Code-Level Action Enforcement (Stop Relying on Prompt Rules)

## The Real Problem

The current approach adds more and more text to AYN's system prompt hoping the AI will follow rules. But the prompt is already **226 lines long** and growing. The AI model (Gemini) loses focus in long prompts and sometimes:
- Says "I'm sending the email" without including the `[ACTION:send_email:...]` tag
- Fabricates data despite rules saying not to
- Ignores instructions buried in the middle of a massive prompt

**Adding more prompt rules won't fix this.** The fix is to add **code after the AI responds** that catches failures and forces correct behavior.

## Solution: Three Code-Level Safety Nets

### 1. Auto-Detect Missing Email Actions (Code Enforcement)

After the AI responds, scan the reply for phrases like "sending", "firing off", "I'll email" -- and if there's NO `[ACTION:send_email:...]` tag in the response, **re-prompt the AI** with a short, focused instruction:

```
"You said you'd send an email but didn't include an [ACTION:send_email:to:subject:body] tag. 
Include the exact ACTION tag now. Nothing else."
```

This is a 1-shot retry that forces the AI to emit the tag. If it still fails, tell the admin honestly.

### 2. Auto-Detect Missing Prospect Actions

Same pattern: if the user says "go find companies" or "work on outreach" and the AI responds with text but no `[ACTION:autonomous_prospect:...]`, force a retry.

### 3. Slim Down the Prompt

The current prompt has redundant and overlapping sections. Consolidate the critical rules into a compact block at the very top (where AI models pay most attention) and remove duplicate instructions. This alone will improve compliance significantly.

## File to Change

`supabase/functions/ayn-telegram-webhook/index.ts`

### Change A: Add action enforcement after AI response (lines ~401-423)

After getting the AI reply, before executing actions, add a check:

```typescript
// --- ACTION ENFORCEMENT ---
// If AI said it would send/email but forgot the ACTION tag, force a retry
const replyLower = reply.toLowerCase();
const mentionsSending = /\b(sending|sent|firing|emailing|i('ll| will) (send|email|fire))\b/.test(replyLower);
const hasEmailAction = /\[ACTION:send_email:/.test(reply) || /\[ACTION:send_outreach:/.test(reply);
const userWantsEmail = /\b(send|email|fire off|shoot)\b.*\b(email|message|outreach)\b/i.test(userText);

if ((mentionsSending || userWantsEmail) && !hasEmailAction && !replyLower.includes('draft') && !replyLower.includes('want me to')) {
  // AI forgot the action tag -- retry with a focused prompt
  const retryMessages = [
    ...messages,
    { role: 'assistant', content: reply },
    { role: 'user', content: 'You said you would send an email but you didn\'t include the ACTION tag. Include ONLY the [ACTION:send_email:to:subject:body] tag now. Extract the recipient, subject, and body from your previous message.' }
  ];
  
  const retryRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages: retryMessages }),
  });
  
  if (retryRes.ok) {
    const retryData = await retryRes.json();
    const retryReply = retryData.choices?.[0]?.message?.content || '';
    // Extract any ACTION tags from retry and append to original reply
    const retryActions = retryReply.match(/\[ACTION:[^\]]+\]/g);
    if (retryActions) {
      reply = reply + '\n' + retryActions.join('\n');
    }
  }
}

// Same pattern for prospect commands
const userWantsProspect = /\b(find|go find|work on|prospect|search for)\b.*\b(companies|leads|businesses|clients|outreach)\b/i.test(userText);
const hasProspectAction = /\[ACTION:(autonomous_prospect|search_leads|prospect_company):/.test(reply);

if (userWantsProspect && !hasProspectAction) {
  // Force autonomous_prospect with defaults extracted from message
  const industryMatch = userText.match(/\b(?:in|for)\s+(\w+(?:\s+\w+)?)\b/i);
  const industry = industryMatch?.[1] || 'technology';
  reply += `\n[ACTION:autonomous_prospect:${industry}:global:5]`;
}
```

### Change B: Consolidate and slim down the prompt

Move the 3 most critical rules to the **very top** of AYN_PERSONALITY (before identity/personality):

```
EXECUTION RULES (TOP PRIORITY -- OVERRIDE EVERYTHING ELSE):
1. EMAIL: If you mention sending an email, you MUST include [ACTION:send_email:to:subject:body]. No tag = no email sent.
2. DATA: Only cite user activity from "recently_active_users" in your context. No guessing.
3. ACTIONS: When asked to do something, DO IT with an ACTION tag. Don't describe doing it.
```

Remove the duplicated email/data rules from later sections (lines 214-226) since they're now at the top AND enforced by code.

### Change C: Add prospect auto-detection for confirmation flow

When the user confirms "yes" or "send it" and the AI still doesn't include the action, the existing confirmation handler (lines 316-362) already handles this -- but only for leads with `pending_action`. Extend it to also catch direct email commands where the AI included a draft in its text.

## Summary

| Change | What it does |
|--------|-------------|
| Action enforcement layer | Code catches when AI says "sending" without ACTION tag, forces a retry |
| Prospect auto-detection | Code catches "find companies" without ACTION tag, injects it automatically |
| Prompt consolidation | Moves critical rules to top, removes duplicates, shrinks prompt size |

This makes AYN reliable through **code**, not through hoping the AI reads the prompt correctly.
