

# Fix Email Quality: Branding, Signature, and Formatting

## Problems Found

1. **Literal `\n` showing in email** -- The body text from AYN contains literal backslash-n (`\n`) characters as text, not real newlines. The current `.replace(/\n/g, '<br>')` only catches real newline characters, not the text `\n`.
2. **Double signature** -- AYN's AI writes "Best, AYN Team" inside the body text. Then our code appends a SECOND signature ("Noor, Sales @ AYN") below it. Result: two signatures stacked.
3. **No branding** -- Emails are bare text in plain `<p>` tags. No AYN header, no professional styling.
4. **Fake person names** -- The random names (Sarah, Noor, Mark) should be replaced with "AYN AI" as the sender identity.

## Changes

### File: `supabase/functions/ayn-telegram-webhook/commands.ts`

**1. Fix `\n` literal parsing (line 460)**

Replace both literal `\n` text AND real newlines with `<br>`:

```typescript
body.replace(/\\n/g, '\n').replace(/\n/g, '<br>')
```

**2. Strip "AYN Team" from body before wrapping (before line 456)**

Add a cleanup step to remove any AI-generated signature from the body text:

```typescript
let cleanBody = body
  .replace(/\\n/g, '\n')
  .replace(/\n/g, '<br>');
// Remove AI-generated generic signatures
cleanBody = cleanBody.replace(/<br>\s*(?:Best|Regards|Cheers|Thanks),?\s*(?:<br>)?\s*(?:The\s+)?AYN(?:\s+Team)?(?:<br>.*)?$/i, '');
```

**3. Replace fake names with "AYN AI" (lines 445-448)**

Remove the random name/role arrays. Use a fixed professional signature:

```typescript
const signature = `AYN AI<br><span style="color:#888;font-size:13px;">Intelligent Automation Solutions</span><br><a href="https://aynn.io" style="color:#0EA5E9;">aynn.io</a>`;
```

**4. Add branded HTML email template (line 460)**

Wrap the email in a professional, branded HTML template with the AYN header, styled body, and footer:

```typescript
html: `
<div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
  <div style="background:#000;padding:24px;text-align:center;">
    <h1 style="color:#fff;font-size:32px;font-weight:900;letter-spacing:-1px;margin:0;">AYN</h1>
    <div style="width:30px;height:3px;background:#0EA5E9;margin:10px auto 0;"></div>
  </div>
  <div style="padding:32px 24px;color:#333;font-size:15px;line-height:1.7;">
    ${cleanBody}
  </div>
  <div style="padding:20px 24px;border-top:1px solid #eee;">
    <p style="margin:0;font-size:14px;font-weight:600;color:#000;">${signature}</p>
  </div>
  <div style="background:#f9f9f9;padding:16px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#999;">&copy; 2026 AYN AI. All rights reserved.</p>
  </div>
</div>`,
```

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**5. Update the system prompt to stop AYN from writing signatures in email bodies**

In the system prompt (around line 94), add a rule:

```
- When composing emails via [ACTION:send_email], NEVER include a signature or sign-off in the body. 
  No "Best, AYN Team", no "Regards", no closing. The email system adds the signature automatically.
```

## Summary

| Problem | Fix |
|---------|-----|
| Literal `\n` showing | Parse `\n` text into real newlines before converting to `<br>` |
| "AYN Team" in body | Strip AI-generated signatures from body text |
| Random fake names | Replace with "AYN AI / Intelligent Automation Solutions / aynn.io" |
| No branding | Professional HTML template with black header, AYN logo, blue accent |
| AI keeps adding signatures | Update system prompt to forbid signatures in email body |

## Files Changed
- `supabase/functions/ayn-telegram-webhook/commands.ts` -- Email formatting, branding, signature
- `supabase/functions/ayn-telegram-webhook/index.ts` -- System prompt update
