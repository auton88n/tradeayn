

# Fix: Resend Inbound Webhook Payload Parsing

## Problem

Resend sends inbound email webhooks in this format:

```text
{
  "created_at": "...",
  "type": "email.received",
  "data": {
    "from": "crossmint7@gmail.com",
    "to": ["info@mail.aynn.io"],
    "subject": "Re: quick question",
    "text": "...",
    "html": "...",
    "headers": [...]
  }
}
```

The current code destructures directly from the top-level payload, but the actual email fields are nested inside `payload.data`. This causes `from` to be `undefined`, returning a 400 "No from email" error.

## Fix

### File: `supabase/functions/resend-inbound-webhook/index.ts`

Extract email fields from `payload.data` instead of the top-level payload:

```typescript
const payload = await req.json();
const emailData = payload.data || payload; // fallback for safety

const {
  from: fromRaw,
  to: toRaw,
  subject,
  text: bodyText,
  html: bodyHtml,
  headers: emailHeaders,
} = emailData;
```

This single change fixes the entire issue. The rest of the function (lead matching, Telegram notification, activity logging) will work as-is once the fields are correctly extracted.

## Files Changed
- `supabase/functions/resend-inbound-webhook/index.ts` -- Extract from `payload.data` instead of top-level
