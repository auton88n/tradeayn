

# Fix Email Subject Leak and Body Quality

## Problems

1. **Subject leaks into body** -- The email shows "your automation:Hey," as the first line. The AI writes the subject with a colon (e.g., `your automation:Hey`), and the parser splits it wrong, so part of the subject ends up in the body.
2. **Banned words still used** -- "bespoke" and "streamline" appear in the body. The AI is ignoring the rules.
3. **Fallback subject "Hey from AYN"** -- Unprofessional. Should be something like "Quick question".

## Root Cause

The action format `[ACTION:send_email:to:subject:body]` uses colons as delimiters. The AI writes subjects containing colons, and the parser splits on the wrong colon. The body then starts with leftover subject text like "Hey,".

## Changes

### File: `supabase/functions/ayn-telegram-webhook/commands.ts`

**1. Strip leaked subject text from body start**

After parsing, clean the body to remove any leftover "Hey," or greeting that got concatenated:

```typescript
// Remove subject text that leaked into body start (e.g., "your automation:Hey,")
let cleanBody = body
  .replace(/^[^,.:!?]*:\s*/i, '')  // Remove "something:" prefix if present
  .replace(/\\n/g, '\n')
  .replace(/\n/g, '<br>');
```

**2. Change fallback subject**

Replace "Hey from AYN" with "Quick question":

```typescript
if (!cleanSubject) cleanSubject = 'Quick question';
```

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**3. Strengthen the prompt rules to prevent banned words and colons**

Update the EMAIL RULES and action format to be more forceful:

```
EMAIL RULES:
- ABSOLUTELY ZERO colons (:) in subject lines. This breaks the email system.
- NEVER use: "bespoke", "leverage", "synergy", "streamline", "delighted", "thrilled", "excited to", "I'd love to", "off-the-shelf", "heavy lifting".
- No em-dashes. No hyphens between phrases. Use periods or commas.
- Write exactly like a founder sending a quick 3-sentence email from their phone. Casual. Direct. No fluff.
- Subject: 2-5 words, no punctuation, no brand. Examples: "quick question", "saw your project", "idea for you"
- Body: 2-4 short sentences max. No corporate speak. Say what you do in plain words.
- NO signature, NO sign-off, NO "Best", NO "Cheers". System handles that.
```

**4. Also add body cleanup in `commands.ts` to programmatically strip banned words**

As a safety net, replace any remaining banned words in the body:

```typescript
// Programmatically replace banned words the AI might still use
cleanBody = cleanBody
  .replace(/\bbespoke\b/gi, 'custom')
  .replace(/\bstreamline\b/gi, 'simplify')
  .replace(/\bleverage\b/gi, 'use')
  .replace(/\bsynergy\b/gi, 'teamwork')
  .replace(/\boff.the.shelf\b/gi, 'generic')
  .replace(/\bheavy lifting\b/gi, 'hard work');
```

## Summary

| Issue | Fix |
|-------|-----|
| Subject leaks into body ("your automation:Hey,") | Strip "prefix:" patterns from body start |
| Fallback subject "Hey from AYN" | Change to "Quick question" |
| Banned words still used (bespoke, streamline) | Stronger prompt rules + programmatic replacement |
| AI ignores subject format rules | More forceful prompt wording about no colons |

## Files Changed
- `supabase/functions/ayn-telegram-webhook/commands.ts` -- Body cleanup, banned word replacement, fallback subject
- `supabase/functions/ayn-telegram-webhook/index.ts` -- Stronger email prompt rules

