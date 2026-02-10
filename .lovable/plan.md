

# Fix Email Sending via Resend

## What's Wrong

The email command already uses Resend with `info@aynn.io` -- that part is correct. The problem is:

1. **Hidden errors**: When Resend fails, line 465 just says "Email failed to send" without showing WHY. We need to read the error response body.
2. **"AYN Team" signature**: Line 455 hardcodes `— AYN Team` in every email.

## Changes

### File: `supabase/functions/ayn-telegram-webhook/commands.ts`

**1. Show actual Resend error (line 465)**

Replace the silent failure with the actual error from Resend so you can see what went wrong:

```typescript
if (!res.ok) {
  const errBody = await res.text();
  console.error('[cmdEmail] Resend error:', errBody);
  return `Email failed: ${errBody}`;
}
return `Email sent to ${to}`;
```

**2. Fix the hardcoded "AYN Team" signature (line 455)**

Replace the hardcoded `— AYN Team` with a personal signature:

```typescript
// Pick a random personal signature
const names = ['Sarah', 'Mark', 'Lina', 'James', 'Noor'];
const roles = ['Sales @ AYN', 'Growth Lead @ AYN', 'Partnerships @ AYN'];
const name = names[Math.floor(Math.random() * names.length)];
const role = roles[Math.floor(Math.random() * roles.length)];

html: `<p>${body.replace(/\n/g, '<br>')}</p><p>${name}<br>${role}</p>`,
```

**3. Update the `from` field to use `mail.aynn.io` subdomain (line 452)**

Your Resend domain is verified as `mail.aynn.io` (that's what the auth emails use: `noreply@mail.aynn.io`). Update the from address to match:

```typescript
from: 'AYN <info@mail.aynn.io>',
```

This is likely the actual fix -- Resend requires sending from a verified domain, and `mail.aynn.io` is the one that's verified, not bare `aynn.io`.

## Summary

| Issue | Fix |
|-------|-----|
| Email fails silently | Show Resend's actual error message |
| Wrong sender domain | Change `info@aynn.io` to `info@mail.aynn.io` (verified domain) |
| "AYN Team" signature | Replace with personal name + role |

