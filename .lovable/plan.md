

# Switch Sales Outreach Emails from Resend to SMTP

## What Changes

Replace the Resend API integration in `ayn-sales-outreach` with direct SMTP sending using `denomailer` -- the same library and pattern already used across 4 other edge functions in the project. This sends emails directly from `info@aynn.io` via your own SMTP server, keeping full AYN branding.

## Why

- SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) are already configured
- 4 other functions already use this exact pattern successfully
- Emails come directly from your mail server -- no third-party sender involved
- Full control over branding and delivery

## File Changed

**`supabase/functions/ayn-sales-outreach/index.ts`**

1. Add `denomailer` import at the top (matching existing functions):
   ```
   import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
   ```

2. Replace the Resend section in `handleSendEmail` (lines 290-318) with SMTP:
   - Remove the `RESEND_API_KEY` check
   - Read `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` from env
   - Create an `SMTPClient` with TLS connection (same as ticket notification functions)
   - Send the email with `from: "AYN <info@aynn.io>"` for branding
   - Close the SMTP connection after sending
   - Keep all the existing pipeline update and logging logic unchanged

## Technical Details

The SMTP sending block will look like:

```text
1. Read SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS from env
2. Create SMTPClient with TLS on port 465 (matching existing pattern)
3. Send email:
   - from: SMTP_USER (info@aynn.io)
   - to: lead.contact_email
   - subject: draft.subject
   - html content: draft.html_body
   - replyTo: info@aynn.io
4. Close SMTP connection
5. Continue with pipeline update + activity logging (unchanged)
```

No other files need changes. No database changes needed.
