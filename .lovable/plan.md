
# Enhanced "Forgot Password" Flow with Email Confirmation

## Goal
Add a prominent "Forgot Password" quick-action button in the login modal that:
1. Pre-fills and displays the user's email for confirmation
2. Sends password reset emails via Resend for faster delivery
3. Shows clear confirmation with the email address used

## Current State Analysis

**Authentication Modal** (`src/components/auth/AuthModal.tsx`):
- Has a small "Forgot password?" text button between label and password field
- Uses `supabase.auth.resetPasswordForEmail()` which sends via Supabase's built-in email service
- Shows a toast notification on success but doesn't confirm which email was used

**Email System**:
- Resend is already configured (`RESEND_API_KEY` secret exists)
- `send-email` edge function handles custom branded emails
- Currently supports: `welcome`, `credit_warning`, `auto_delete_warning`, `payment_receipt`
- Does NOT have a `password_reset` email type yet

**Supabase Password Reset**:
- Supabase's `resetPasswordForEmail()` uses Supabase's built-in email templates
- We can supplement with a branded Resend notification email

---

## Implementation Approach

### Part A: Enhanced AuthModal UI

**File: `src/components/auth/AuthModal.tsx`**

1. Add a new state for showing a "reset sent" confirmation view:
   - `resetEmailSent: boolean` - tracks if we should show confirmation
   - `resetSentToEmail: string` - stores the email address used

2. Add a prominent "Forgot Password" button below the sign-in form:
   - Styled as a secondary/outline button with a key/lock icon
   - More visible than the current small text link

3. Create a "Reset Sent" confirmation panel:
   - Shows a success icon and message
   - Displays the email address the reset was sent to (masked for security)
   - "Send Again" button if they didn't receive it
   - "Back to Sign In" link

4. Update `handleForgotPassword()`:
   - Call Resend edge function in parallel with Supabase's built-in reset
   - Set `resetEmailSent = true` and `resetSentToEmail = email` on success
   - This gives users both the official Supabase link AND a branded notification

### Part B: Add Password Reset Email Template (Resend)

**File: `supabase/functions/send-email/index.ts`**

Add a new email type `password_reset`:
```typescript
interface EmailRequest {
  to: string;
  emailType: 'welcome' | 'credit_warning' | 'auto_delete_warning' | 
             'payment_receipt' | 'password_reset';  // Add this
  data: Record<string, unknown>;
  userId?: string;
}
```

Create `passwordResetTemplate(userName: string, resetLink?: string)`:
- Branded AYN header/footer
- Bilingual (EN/AR) content
- Explains that a reset link was sent
- Provides security tips
- Note: The actual reset link comes from Supabase's email; this is a branded notification

**File: `src/lib/email-templates.ts`**
- Add `password_reset` to `EmailType` union
- Add interface for password reset email data

### Part C: Add Translation Keys

**File: `src/contexts/LanguageContext.tsx`**

Add new translation keys for all three languages (EN, AR, FR):
- `auth.resetEmailSentTo` - "Reset link sent to {email}"
- `auth.checkSpam` - "Don't see it? Check your spam folder."
- `auth.sendAgain` - "Send Again"
- `auth.backToSignIn` - "Back to Sign In"
- `auth.forgotPasswordTitle` - "Reset Password"
- `auth.forgotPasswordDesc` - "Enter your email to receive a reset link"

---

## Technical Details

### Email Masking Function
To display the email in confirmation without revealing the full address:
```typescript
const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  const masked = local.length > 2 
    ? local[0] + '***' + local.slice(-1)
    : local[0] + '***';
  return `${masked}@${domain}`;
};
// "john.doe@gmail.com" → "j***e@gmail.com"
```

### Dual Email Sending
When user clicks "Send Reset Link":
1. Call `supabase.auth.resetPasswordForEmail()` (required - contains the actual reset token link)
2. In parallel, call `send-email` edge function with `emailType: 'password_reset'` (optional branded notification)

This ensures:
- Users get the official reset link from Supabase
- They also get a branded email explaining what happened
- If Resend fails, the Supabase email still works

### UI Flow
```text
[Sign In Tab]
  ├── Email input
  ├── Password input (with small "Forgot?" link)
  ├── [Sign In] button
  └── [🔑 Forgot Password?] button (NEW - prominent)
         │
         ▼ (on click, if email entered)
  [Confirmation View]
  ├── ✓ Success icon
  ├── "Reset link sent to j***e@gmail.com"
  ├── "Check your inbox and spam folder"
  ├── [Send Again] button (with cooldown)
  └── [← Back to Sign In] link
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/auth/AuthModal.tsx` | Add reset confirmation UI, prominent forgot password button, dual email sending |
| `supabase/functions/send-email/index.ts` | Add `password_reset` email template |
| `src/lib/email-templates.ts` | Add `password_reset` type |
| `src/contexts/LanguageContext.tsx` | Add new translation keys (EN, AR, FR) |

---

## UX Improvements

1. **More visible button**: Users won't miss the forgot password option
2. **Email confirmation**: Users know exactly where the reset was sent
3. **Faster delivery**: Resend typically delivers in seconds vs. Supabase's variable timing
4. **Branded experience**: Password reset email matches AYN's visual identity
5. **Security**: Email is masked in confirmation to protect in screen-sharing scenarios

