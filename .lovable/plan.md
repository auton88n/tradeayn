

# Fix: Use Correct Resend API Endpoint for Received Emails

## Problem

The webhook correctly receives the `email_id` from Resend, but the code fetches the email body from the wrong endpoint:

- Current (wrong): `https://api.resend.com/emails/${email_id}`
- Correct: `https://api.resend.com/emails/receiving/${email_id}`

The `/emails/:id` endpoint is for retrieving **sent** emails. For **inbound/received** emails, Resend uses `/emails/receiving/:id`. This is why the body comes back empty.

## Fix

### File: `supabase/functions/resend-inbound-webhook/index.ts`

Change line 37 from:
```
const emailRes = await fetch(`https://api.resend.com/emails/${email_id}`, {
```
to:
```
const emailRes = await fetch(`https://api.resend.com/emails/receiving/${email_id}`, {
```

One-line change. Everything else (parsing, storage, Telegram notification) stays the same.

## Files Changed
- `supabase/functions/resend-inbound-webhook/index.ts` -- Fix API endpoint path

