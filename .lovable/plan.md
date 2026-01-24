

# Complete Performance & Email System Optimization Plan

## Executive Summary

This plan addresses two major system improvements:
1. **Database Performance**: Add missing indexes to eliminate 877,000+ sequential scans
2. **Email System Migration**: Consolidate emails to Resend while keeping SMTP for two-way communication

---

## Part 1: Database Performance Optimization

### Problem Analysis

Your Supabase database is slow because critical tables are missing indexes. Every authentication check (which happens on every page load) performs a full table scan instead of an index lookup.

| Table | Sequential Scans | Rows | Impact |
|-------|-----------------|------|--------|
| `user_roles` | **877,968** | ~15 | Critical - checked on every page load |
| `usage_logs` | **4,476** | 2.7M+ | High - affects usage tracking |
| `user_settings` | **5,323** | Many | Medium - affects settings pages |

### Solution: Create Missing Indexes

**New Migration File**: `supabase/migrations/XXXXXXX_add_performance_indexes.sql`

```sql
-- Critical: user_roles lookups (will reduce 877K scans to near zero)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);

-- High: usage_logs lookups on large table
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id 
ON public.usage_logs(user_id);

-- Medium: usage_logs date filtering
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at 
ON public.usage_logs(created_at);

-- Medium: user_settings lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
ON public.user_settings(user_id);

-- Medium: user_ai_limits lookups
CREATE INDEX IF NOT EXISTS idx_user_ai_limits_user_id 
ON public.user_ai_limits(user_id);
```

### Expected Impact
- Auth check latency: **~82ms → <5ms** (16x faster)
- Page load improvement: **~0.5-1 second faster**

---

## Part 2: Email System Architecture

### Current State

Your email system currently uses two providers:

| Provider | Edge Functions | Purpose |
|----------|---------------|---------|
| **Resend** (fast) | `send-email` | Welcome, credit warnings, subscriptions, password reset notifications |
| **SMTP/Hostinger** (slow) | 6 functions | Contact forms, support tickets, application emails, admin notifications |

### Target State

Based on your requirements:
- **Keep SMTP** for emails where you need to receive replies (contact, support, tickets)
- **Migrate to Resend** for one-way notifications (faster delivery)

| Edge Function | Current | After | Reason |
|--------------|---------|-------|--------|
| `send-contact-email` | SMTP | **Keep SMTP** | Need to receive replies at info@aynn.io |
| `send-ticket-notification` | SMTP | **Keep SMTP** | Support ticket replies |
| `send-ticket-reply` | SMTP | **Keep SMTP** | Admin replies to users |
| `send-reply-email` | SMTP | **Keep SMTP** | Application replies |
| `send-usage-alert` | SMTP | **Migrate to Resend** | One-way notification |
| `send-application-email` | SMTP | **Migrate to Resend** | One-way confirmations |
| `admin-notifications` | SMTP | **Migrate to Resend** | One-way admin alerts |

---

## Part 3: Migrate Edge Functions to Resend

### 3.1 Migrate `send-usage-alert/index.ts`

**Current**: Uses `SMTPClient` from denomailer (slow TLS handshake)
**After**: Uses Resend HTTP API (fast)

**Changes**:
- Remove `SMTPClient` import and initialization
- Add `import { Resend } from "npm:resend@2.0.0";`
- Replace SMTP send with `resend.emails.send()`
- Send from `AYN <noreply@mail.aynn.io>`
- Keep existing branded HTML templates
- Keep alert_history deduplication logic

### 3.2 Migrate `send-application-email/index.ts`

**Current**: Sends two emails via SMTP:
1. Confirmation to applicant
2. Notification to team

**After**: Both emails via Resend

**Changes**:
- Remove `SMTPClient` import
- Add Resend import
- Confirmation email from `AYN <noreply@mail.aynn.io>` with `Reply-To: info@aynn.io`
- Team notification from `AYN <noreply@mail.aynn.io>` with `Reply-To: applicant's email` (so team can reply directly)
- Keep existing branded HTML templates

### 3.3 Migrate `admin-notifications/index.ts`

**Current**: Handles 5 notification types via SMTP:
- `access_request` - New user awaiting approval
- `security_alert` - Security events
- `daily_report` - Daily metrics email
- `maintenance_announcement` - Sent to all users
- `pin_change_approval` - PIN change requests

**After**: All via Resend

**Changes**:
- Remove `SMTPClient` import
- Add Resend import
- Keep all existing dark-mode email templates
- Keep approval token generation for access requests
- For maintenance announcements: use Resend batch sending (up to 100 per call)
- Send from `AYN Admin <noreply@mail.aynn.io>`
- Keep admin_notification_log database logging

---

## Part 4: Add Branded Password Change Email

### Current Flow (Settings → Change Password)

```text
User clicks "Change Password" in Settings
         │
         ▼
supabase.auth.resetPasswordForEmail()
         │
         ▼
Supabase sends default template email
(Plain, unbranded - but contains the actual reset link)
```

### New Flow (Matches AuthModal behavior)

```text
User clicks "Change Password" in Settings
         │
         ▼
supabase.auth.resetPasswordForEmail()
         │
    ┌────┴────┐
    ▼         ▼
Supabase   Resend branded email
(reset     (notification with AYN branding)
 link)
```

**File to Modify**: `src/components/settings/SessionManagement.tsx`

**Change in `handlePasswordChange` function**:
After the successful Supabase call, add:
```typescript
// Also send branded notification via Resend (parallel, non-blocking)
try {
  await supabase.functions.invoke('send-email', {
    body: {
      to: userEmail,
      emailType: 'password_reset',
      data: { userName: userEmail.split('@')[0] }
    }
  });
  console.log('[SessionManagement] Branded password reset email sent via Resend');
} catch (emailError) {
  console.warn('[SessionManagement] Resend email failed (Supabase email still sent):', emailError);
}
```

---

## Part 5: Signup & Password Reset Emails Explained

### Important: Supabase Auth Emails Cannot Be Replaced

Supabase Auth controls these emails because they contain secure tokens:

| Email Type | Sent By | Contains | Can Replace? |
|------------|---------|----------|--------------|
| Signup verification | Supabase Auth | Verification link + token | No |
| Password reset | Supabase Auth | Reset link + token | No |
| Magic link | Supabase Auth | Login link + token | No |

**What You Can Do**:
1. Send additional branded notifications via Resend (already implemented for forgot password in AuthModal)
2. Customize Supabase templates in Dashboard (Authentication → Email Templates)

### Current Implementation

| Flow | Supabase Email | Resend Email |
|------|---------------|--------------|
| **Signup** | Verification email (automatic) | Welcome email (via `send-email`) |
| **Forgot Password** (AuthModal) | Reset link email | Branded notification |
| **Change Password** (Settings) | Reset link email | **Not yet implemented** (this plan adds it) |

### Customizing Supabase Templates (Optional)

For full branding on the actual link emails:
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Edit each template (Confirm signup, Reset password, Magic link, Change email)
3. Add AYN logo and branding HTML

This ensures the emails with actual links also have your branding.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/[timestamp]_add_performance_indexes.sql` | **Create** | Add database indexes |
| `supabase/functions/send-usage-alert/index.ts` | **Modify** | Replace SMTP → Resend |
| `supabase/functions/send-application-email/index.ts` | **Modify** | Replace SMTP → Resend |
| `supabase/functions/admin-notifications/index.ts` | **Modify** | Replace SMTP → Resend |
| `src/components/settings/SessionManagement.tsx` | **Modify** | Add branded email call |

---

## Technical Details

### Resend Code Pattern

```typescript
// BEFORE (SMTP - slow, ~500-1000ms)
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
const client = new SMTPClient({
  connection: {
    hostname: smtpHost,
    port: 465,
    tls: true,
    auth: { username: smtpUser, password: smtpPass },
  },
});
await client.send({ from, to, subject, html });
await client.close();

// AFTER (Resend - fast, ~50-100ms)
import { Resend } from "npm:resend@2.0.0";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
await resend.emails.send({
  from: "AYN <noreply@mail.aynn.io>",
  to: userEmail,
  subject: subject,
  html: emailHtml,
});
```

### Sender Addresses

| Email Type | From Address | Reply-To |
|------------|--------------|----------|
| Usage alerts | `AYN <noreply@mail.aynn.io>` | None |
| Application (to applicant) | `AYN <noreply@mail.aynn.io>` | `info@aynn.io` |
| Application (to team) | `AYN <noreply@mail.aynn.io>` | Applicant's email |
| Admin notifications | `AYN Admin <noreply@mail.aynn.io>` | None |
| Contact form (SMTP) | `info@aynn.io` | Sender's email |
| Support tickets (SMTP) | `info@aynn.io` | User's email |

---

## Verification Checklist

### After Database Migration:
- [ ] Run query: `SELECT relname, seq_scan, idx_scan FROM pg_stat_user_tables WHERE relname = 'user_roles'`
- [ ] Verify `idx_scan` is increasing (indexes being used)
- [ ] Check auth response times in logs (should be <5ms)
- [ ] Page load noticeably faster

### After Email Migration:
- [ ] Test usage alert at 75%/90%/100% triggers
- [ ] Test service application form submission
- [ ] Test admin access request notification
- [ ] Test maintenance announcement (batch send)
- [ ] Verify all emails have AYN branding
- [ ] Verify contact form replies still arrive at info@aynn.io
- [ ] Verify support ticket replies work correctly
- [ ] Test password change from Settings (should receive 2 emails)

---

## Performance Improvements Summary

| Area | Before | After | Improvement |
|------|--------|-------|-------------|
| `user_roles` query | ~82ms (seq scan) | <5ms (index) | **16x faster** |
| Page load | Slow | ~1s faster | Better UX |
| Usage alert email | ~500-1000ms (SMTP) | ~50-100ms (Resend) | **10x faster** |
| Application email | ~500-1000ms (SMTP) | ~50-100ms (Resend) | **10x faster** |
| Admin notifications | ~500-1000ms (SMTP) | ~50-100ms (Resend) | **10x faster** |

