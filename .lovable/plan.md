

# Fix AYN's Broken Conversation Flow + Human Personality

## Problems (from your screenshot)

1. **AYN forgets its own messages** -- You replied "Yes" to its email draft, and it said "I'm not sure what you're confirming." It literally forgot what it just sent you.
2. **Title is wrong** -- AYN signs as "Operations Manager" but should adapt its role based on context (Sales Executive when selling, etc.)
3. **Talks like a robot** -- Formal, stiff email tone. No human warmth or personality in Telegram conversation.
4. **No reply-to awareness** -- Telegram sends `reply_to_message` data when you swipe-reply, but AYN ignores it completely.

## Root Causes

1. **Conversation history is flat** -- `getConversationHistory()` fetches 40 entries from `ayn_mind` but they're just content strings. No message IDs, no threading. When AYN sends a long message with an email draft + "Should I go ahead?", then you reply "Yes", AYN can't connect the two.
2. **No Telegram reply-to handling** -- The webhook reads `message.text` but ignores `message.reply_to_message`, which Telegram provides when you swipe-reply to a specific message.
3. **Rigid role identity** -- The prompt hardcodes "lead operations manager" instead of letting AYN adapt its title based on what it's doing.

## Changes

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**1. Capture reply-to context from Telegram (main handler, around line 195)**

Before sending to AI, check if `message.reply_to_message` exists. If it does, prepend the quoted message to the user's input so the AI knows exactly what they're replying to:

```
if (message.reply_to_message?.text) {
  sanitizedInput = `[Replying to AYN's message: "${message.reply_to_message.text.slice(0, 500)}"]\n\n${sanitizedInput}`;
}
```

This way when you swipe-reply "Yes" to the email draft, AYN sees:
`[Replying to AYN's message: "I'm the lead operations manager... **Should I go ahead?**"] Yes`

**2. Rewrite the personality prompt (lines 21-149)**

Key changes:
- Remove "lead operations manager" -- replace with dynamic role: "You adapt your title based on context. When selling: Sales Executive. When managing ops: Operations Lead. When doing creative work: Creative Director."
- Remove formal/stiff language constraints
- Add explicit rule: "When someone replies 'yes', 'go ahead', 'do it' -- look at the LAST thing you said and execute that. You ASKED them to confirm something. Don't pretend you forgot."
- Add: "When you draft emails, sign them naturally -- not with a rigid corporate title. Match the vibe to the prospect."
- Make the tone more human: allow expressions like "yo", "honestly", "ngl", contractions, casual phrasing

**3. Improve conversation history (function `getConversationHistory`, line 412)**

Store and retrieve `context` alongside content so AYN can see what actions were pending:

```
.select('type, content, context, created_at')
```

And include context in the returned messages:

```
content: entry.context?.pending_action 
  ? `${entry.content}\n[Pending action: ${entry.context.pending_action}]` 
  : entry.content
```

**4. Tag outgoing messages with pending actions (line 272)**

When AYN asks for confirmation ("Should I go ahead?"), store what it's waiting for:

```
{ type: 'telegram_ayn', content: cleanReply.slice(0, 500), 
  context: { 
    source: 'telegram', 
    actions: executedActions,
    pending_action: cleanReply.includes('Should I go ahead') || cleanReply.includes('go ahead?') 
      ? 'awaiting_confirmation' : null
  }, 
  shared_with_admin: true }
```

**5. Update email signature in `ayn-sales-outreach`**

Change the email drafting prompt to use "Sales Executive" or context-appropriate title instead of "Operations Manager". Make the email tone more natural and less templated.

### File: `supabase/functions/ayn-sales-outreach/index.ts`

Update the email generation prompt to:
- Sign as "AYN, Sales Executive @ AYN" (or let AI pick based on context)
- Use a more conversational, human email tone
- Remove stiff corporate language patterns

## Summary

| Problem | Fix |
|---------|-----|
| "I'm not sure what you're confirming" | Capture Telegram reply-to-message context and prepend it |
| Forgets its own previous message | Tag pending actions in conversation history |
| Signs as "Operations Manager" always | Dynamic role based on context (Sales Exec, Creative Director, etc.) |
| Robotic tone in conversation | Loosen personality constraints, more natural language |
| Stiff email drafts | Update outreach prompt for conversational, human emails |

