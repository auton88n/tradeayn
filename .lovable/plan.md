

# Complete Auth Email Migration to Resend (Auth Hooks)

## Summary

This plan creates a new Supabase Edge Function that intercepts ALL authentication emails (signup, password reset, magic link, email change) and sends them through Resend instead of Supabase's slow default email service. This will reduce email delivery time from 5-30+ seconds to under 5 seconds.

---

## What Gets Fixed

| Email Type | Current | After |
|------------|---------|-------|
| Signup verification | Slow (5-30s) | Fast (~3s) |
| Password reset | Slow (5-30s) | Fast (~3s) |
| Magic link | Slow (5-30s) | Fast (~3s) |
| Email change | Slow (5-30s) | Fast (~3s) |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/auth-send-email/index.ts` | **Create** | New Auth Hook edge function |
| `supabase/config.toml` | **Modify** | Add config for new function |
| `src/components/auth/AuthModal.tsx` | **Modify** | Remove duplicate branded email call (lines 132-144) |
| `src/components/settings/SessionManagement.tsx` | **Modify** | Remove duplicate branded email call |

---

## Part 1: Create Auth Email Hook Edge Function

**File**: `supabase/functions/auth-send-email/index.ts`

This function will:
1. Receive webhook from Supabase Auth containing email data and tokens
2. Verify webhook signature using `standardwebhooks` library (security)
3. Build the confirmation URL with the token
4. Render branded AYN email template (bilingual: English + Arabic)
5. Send via Resend API

### Email Types Handled

| Type | Triggered By | Template |
|------|-------------|----------|
| `signup` | User creates account | "Confirm your AYN account" + verification link |
| `recovery` | Password reset request | "Reset your AYN password" + reset link |
| `magiclink` | Magic link login | "Your AYN login link" + one-click login |
| `email_change` | User changes email | "Confirm your new email" + confirmation link |

### Confirmation URL Format

```text
https://dfkoxuokfkttjhfjcecx.supabase.co/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}
```

### Key Code Structure

```typescript
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

Deno.serve(async (req) => {
  // 1. Verify webhook signature
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);
  const { user, email_data } = wh.verify(payload, headers);
  
  // 2. Build confirmation URL
  const confirmationUrl = `https://dfkoxuokfkttjhfjcecx.supabase.co/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;
  
  // 3. Render branded template based on email_data.email_action_type
  const { subject, html } = getTemplate(email_data.email_action_type, user, confirmationUrl);
  
  // 4. Send via Resend
  await resend.emails.send({
    from: "AYN <noreply@mail.aynn.io>",
    to: user.email,
    subject,
    html
  });
  
  return new Response(JSON.stringify({}), { status: 200 });
});
```

---

## Part 2: Branded Email Templates

All templates will include:
- AYN logo header (same as existing `send-email` templates)
- Bilingual content (English + Arabic)
- Clear call-to-action button with the confirmation link
- Security tips section
- Consistent styling with your brand

### Signup Confirmation Template
- Subject: "🔐 Confirm your AYN account | تأكيد حسابك في AYN"
- Big "Verify Email" button with link
- Welcome message
- What to expect after verification

### Password Reset Template
- Subject: "🔐 Reset your AYN password | إعادة تعيين كلمة المرور"
- Big "Reset Password" button with link
- Security tips (don't share link, expires in 1 hour)
- "Didn't request this?" notice

### Magic Link Template
- Subject: "🔐 Your AYN login link | رابط تسجيل الدخول"
- Big "Log In" button with link
- Link expires notice
- Security warning

### Email Change Template
- Subject: "📧 Confirm your new email | تأكيد بريدك الإلكتروني الجديد"
- Big "Confirm Email" button
- Shows old and new email addresses
- Security notice

---

## Part 3: Update Config

**File**: `supabase/config.toml`

Add:
```toml
[functions.auth-send-email]
verify_jwt = false
```

The function doesn't use JWT because it's called by Supabase Auth via webhook, not by users.

---

## Part 4: Remove Duplicate Email Calls

### In `AuthModal.tsx` (handleForgotPassword)

**Remove lines 132-144**:
```typescript
// Also send branded email via Resend (parallel, don't block)
try {
  await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      emailType: 'password_reset',
      data: { userName: email.split('@')[0] }
    }
  });
  console.log('[AuthModal] Branded password reset email sent via Resend');
} catch (emailError) {
  console.warn('[AuthModal] Resend email failed (Supabase email still sent):', emailError);
}
```

**Reason**: The Auth Hook now sends the branded email directly - no need for duplicate.

### In `SessionManagement.tsx` (handlePasswordChange)

**Remove the parallel Resend call** that was added previously.

**Reason**: Same as above - Auth Hook handles it.

---

## Part 5: Manual Configuration Steps (After Deployment)

You'll need to configure the Auth Hook in Supabase Dashboard:

1. **Go to**: Supabase Dashboard → Authentication → Hooks
2. **Enable**: "Send Email" hook
3. **Select**: HTTPS (not Postgres)
4. **Set URL**: `https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/auth-send-email`
5. **Set HTTP Headers**: None required (signature is in standard webhook headers)
6. **Add Secrets**: Add `SEND_EMAIL_HOOK_SECRET` to Edge Function secrets

The secret format should be: `v1,whsec_YOUR_SECRET_HERE` (you already have this ready)

---

## Technical Details

### Webhook Payload Structure

When Supabase Auth triggers the hook, it sends:

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "user_metadata": { "full_name": "John" }
  },
  "email_data": {
    "email_action_type": "signup|recovery|magiclink|email_change",
    "token_hash": "abc123...",
    "token": "123456",
    "redirect_to": "https://ayn-insight-forge.lovable.app/",
    "site_url": "https://ayn-insight-forge.lovable.app"
  }
}
```

### Security

1. **Webhook Signature**: Uses `standardwebhooks` library to verify the request came from Supabase
2. **No JWT**: The function is called by Supabase's internal system, not by users
3. **HTTPS Only**: All communication is encrypted

### Error Handling

- If Resend fails, return error to Supabase (will retry)
- Log all email attempts for debugging
- Graceful fallback messages

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Signup email delivery | 5-30 seconds | < 5 seconds |
| Password reset email | 5-30 seconds | < 5 seconds |
| Full AYN branding | Only in parallel email | In the actual link email |
| Duplicate emails | Yes (2 emails for password reset) | No (1 branded email) |

---

## Verification Checklist

After implementation:
- [ ] Test signup - receive branded email with verification link within seconds
- [ ] Test password reset - receive branded email with reset link within seconds
- [ ] Click links - they should work and redirect correctly
- [ ] Check no duplicate emails are received
- [ ] Verify bilingual content renders correctly

