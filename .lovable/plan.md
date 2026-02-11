

# Fix Marketing Bot: Image Generation Not Triggering

## The Problem

The bot checks `cleanReply.startsWith('[GENERATE_IMAGE]')` but the AI writes text before the tag (e.g., "To stop the scroll, we need a punchy visual... [GENERATE_IMAGE] ..."). Since `startsWith` fails, the tag is printed as raw text instead of triggering image generation.

## The Fix

### File: `supabase/functions/ayn-marketing-webhook/index.ts`

**1. Fix the text message handler (line 267)**

Replace `startsWith` with `includes` check. Extract the `[GENERATE_IMAGE]` block from anywhere in the reply, split the reply into the text message part and the image prompt part, then trigger image generation.

```text
Before:  if (cleanReply.startsWith('[GENERATE_IMAGE]'))
After:   if (cleanReply.includes('[GENERATE_IMAGE]'))
         -> Split at the tag
         -> Everything before = text message to send first
         -> Everything after = image prompt to generate
         -> Send the text message, then generate and send the image
```

**2. Fix the voice handler (line 515)**

Same fix: replace `startsWith` with `includes` so voice-triggered image requests also work.

**3. Tighten the system prompt (lines 59-70)**

The current prompt format example has `[GENERATE_IMAGE]` on its own line with instructions around it that the AI copies literally. Simplify to make the AI put `[GENERATE_IMAGE]` at the START or clearly separated:

```text
Before: Multi-line example with surrounding text
After:  "When generating an image, put [GENERATE_IMAGE] on its own line followed by the prompt on the next line. Put your conversational message AFTER a blank line. Never put text before [GENERATE_IMAGE]."
```

**4. Strip the tag from the sent message**

Ensure the `[GENERATE_IMAGE]` tag and prompt lines are cleaned out of any text that gets sent to Telegram, so the user never sees raw tags.

### Deployment

Redeploy `ayn-marketing-webhook` edge function.

