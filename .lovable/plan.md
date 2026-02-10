
# Fix Email Subject Parsing and AI Tone

## Problem 1: Subject Gets Mangled

The email action format is `[ACTION:send_email:to:subject:body]` and the parser splits on `:` (colon). If the AI writes a colon anywhere in the subject or body, it breaks the parsing -- the subject gets mixed with the body, producing garbage like "your automation / AYN:Hey,".

**Fix in `index.ts` (action parser, lines 699-704):**
- Change the parser to only split on the FIRST 3 colons, so everything after the third colon becomes the body (even if it contains more colons).
- Also clean the subject: strip any leftover slashes, "AYN:" prefixes, or junk that the AI sometimes prepends.

**Fix in `index.ts` (system prompt, line 122):**
- Update the action format documentation to explicitly tell the AI: "The subject must be a clean, short, human-sounding email subject line. No colons, no slashes, no brand prefixes."

## Problem 2: AI Writes Like a Robot

Em-dashes, words like "bespoke", overly polished corporate language -- it screams AI. The email body needs to sound like a real person typed it quickly.

**Fix in `index.ts` (EMAIL RULES, lines 103-106):**
Add specific writing style rules:
- Never use em-dashes. Use commas or periods instead.
- Never use words like "bespoke", "leverage", "synergy", "streamline", "delighted".
- Write like a real person sending a quick business email -- casual but professional.
- Keep sentences short and direct. No filler phrases.
- The subject line should be casual and short (3-6 words), like a human would write. Examples: "Quick question", "Saw your work", "Hey from AYN". Never include brand names or slashes in subjects.

## Problem 3: Subject Cleanup in Code

**Fix in `commands.ts` (line 438):**
Add a cleanup step for the subject after parsing:
- Strip any "AYN:" or "AYN /" prefixes
- Remove em-dashes
- Trim extra whitespace
- Cap subject length to prevent overly long subjects

## Technical Details

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

1. **Action parser fix (lines 699-703):** Change from `params.split(':')` with destructuring to a smarter split that only takes the first 2 colons as delimiters:

```typescript
case 'send_email': {
  const firstColon = params.indexOf(':');
  if (firstColon === -1) return null;
  const to = params.slice(0, firstColon);
  const rest = params.slice(firstColon + 1);
  const secondColon = rest.indexOf(':');
  if (secondColon === -1) return null;
  const subject = rest.slice(0, secondColon);
  const body = rest.slice(secondColon + 1);
  return await cmdEmail(`/email ${to} ${subject} | ${body}`, supabase);
}
```

2. **System prompt update (lines 103-106):** Expand EMAIL RULES:

```
EMAIL RULES:
- NEVER use em-dashes (--). Use commas or periods.
- NEVER use words: "bespoke", "leverage", "synergy", "streamline", "delighted", "thrilled".
- Write like a real human typing a quick email. Short sentences. No filler.
- Subject lines: casual, 3-6 words, lowercase feel. Examples: "quick question", "saw your work", "idea for you". No colons, slashes, or brand names in subjects.
- No signature or sign-off in the body. The system adds it automatically.
- Body content only. Professional but conversational.
```

3. **Action format docs (line 122):** Add a note about subject formatting:

```
- [ACTION:send_email:to:subject:body] -- Send email (subject must be short, no colons)
```

### File: `supabase/functions/ayn-telegram-webhook/commands.ts`

4. **Subject cleanup (after line 438):** Add sanitization:

```typescript
// Clean up AI-generated subject
let cleanSubject = subject
  .replace(/^(?:AYN|ayn)\s*[:/\-]\s*/i, '')  // Remove "AYN:" or "AYN /" prefix
  .replace(/—/g, '-')                          // Replace em-dashes
  .replace(/\s+/g, ' ')                        // Collapse whitespace
  .trim();
if (!cleanSubject) cleanSubject = 'Hey from AYN';
```

## Files Changed
- `supabase/functions/ayn-telegram-webhook/index.ts` -- Parser fix + prompt update
- `supabase/functions/ayn-telegram-webhook/commands.ts` -- Subject sanitization
