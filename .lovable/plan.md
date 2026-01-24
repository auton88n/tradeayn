
# Add Stripe Webhook Handling & Subscription Email Notifications

## Overview
Implement real-time subscription updates via Stripe webhooks and automated email notifications for subscription lifecycle events (new subscription, renewal, cancellation, upgrade/downgrade).

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STRIPE WEBHOOK FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Stripe Events                      Edge Function                           │
│  ┌──────────────────┐              ┌──────────────────────────────────┐     │
│  │ customer.        │──────────────│                                  │     │
│  │ subscription.    │   POST       │  stripe-webhook                  │     │
│  │ created          │──────────────│  (verify signature)              │     │
│  │ updated          │              │                                  │     │
│  │ deleted          │              │  1. Validate webhook signature   │     │
│  │ invoice.paid     │              │  2. Parse event type             │     │
│  │ invoice.failed   │              │  3. Update user_subscriptions    │     │
│  └──────────────────┘              │  4. Update user_ai_limits        │     │
│                                    │  5. Send email notification      │     │
│                                    └──────────────────────────────────┘     │
│                                                 │                           │
│                                                 ▼                           │
│                                    ┌──────────────────────────────────┐     │
│                                    │  send-email function             │     │
│                                    │  (subscription_created,         │     │
│                                    │   subscription_renewed,          │     │
│                                    │   subscription_canceled,         │     │
│                                    │   subscription_updated)          │     │
│                                    └──────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Create Stripe Webhook Edge Function

**New File: `supabase/functions/stripe-webhook/index.ts`**

| Feature | Description |
|---------|-------------|
| Signature Verification | Verify Stripe webhook signature using `STRIPE_WEBHOOK_SECRET` |
| Event Handling | Handle `customer.subscription.*` and `invoice.*` events |
| Database Sync | Real-time update of `user_subscriptions` and `user_ai_limits` |
| Email Triggering | Call send-email function for each subscription event |
| Logging | Comprehensive logging for debugging |

**Handled Events:**
- `customer.subscription.created` → New subscription email
- `customer.subscription.updated` → Upgrade/downgrade email (if tier changed)
- `customer.subscription.deleted` → Cancellation email
- `invoice.paid` → Renewal confirmation email
- `invoice.payment_failed` → Payment failed notification

---

### Phase 2: Add Subscription Email Templates

**Update: `supabase/functions/send-email/index.ts`**

Add 4 new email templates:

| Template | Subject | Trigger |
|----------|---------|---------|
| `subscription_created` | "🎉 Welcome to AYN [Plan]!" | New subscription |
| `subscription_renewed` | "✅ AYN Subscription Renewed" | Monthly renewal |
| `subscription_canceled` | "😢 Your AYN Subscription Has Ended" | Cancellation |
| `subscription_updated` | "📊 AYN Plan Updated" | Upgrade/downgrade |

Each template will be bilingual (English/Arabic) following the existing AYN brand style.

---

### Phase 3: Update Email Types

**Update: `src/lib/email-templates.ts`**

Add new email types:
```typescript
export type EmailType = 
  | 'welcome' 
  | 'credit_warning' 
  | 'auto_delete_warning' 
  | 'payment_receipt' 
  | 'password_reset'
  | 'subscription_created'
  | 'subscription_renewed'
  | 'subscription_canceled'
  | 'subscription_updated';
```

---

### Phase 4: Update Supabase Config

**Update: `supabase/config.toml`**

Add webhook function configuration:
```toml
[functions.stripe-webhook]
verify_jwt = false
```

---

### Phase 5: Add useEmail Hook Methods

**Update: `src/hooks/useEmail.ts`**

Add convenience methods for subscription emails (primarily for admin manual triggers if needed).

---

## Technical Details

### Stripe Webhook Function Structure

```typescript
// Key logic flow
1. Verify webhook signature (STRIPE_WEBHOOK_SECRET)
2. Parse event.type
3. Extract customer email from event data
4. Look up user by email in Supabase
5. Determine tier from product ID (using existing PRODUCT_TO_TIER mapping)
6. Update user_subscriptions table
7. Update user_ai_limits table
8. Send appropriate email notification
9. Return 200 OK (important for Stripe retry logic)
```

### Email Template Data Requirements

| Email Type | Required Data |
|------------|---------------|
| `subscription_created` | userName, planName, credits, nextBillingDate |
| `subscription_renewed` | userName, planName, amount, nextBillingDate |
| `subscription_canceled` | userName, planName, endDate |
| `subscription_updated` | userName, oldPlan, newPlan, effectiveDate |

---

## Configuration Required

### New Secret Needed

| Secret | Purpose |
|--------|---------|
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signatures |

**User Action Required:** 
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/stripe-webhook`
3. Select events: `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`
4. Copy the webhook signing secret
5. Add as `STRIPE_WEBHOOK_SECRET` in Supabase secrets

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/stripe-webhook/index.ts` | **Create** | New webhook handler |
| `supabase/functions/send-email/index.ts` | **Modify** | Add 4 subscription email templates |
| `src/lib/email-templates.ts` | **Modify** | Add new EmailType variants |
| `src/hooks/useEmail.ts` | **Modify** | Add subscription email methods |
| `supabase/config.toml` | **Modify** | Add stripe-webhook config |

---

## Security Considerations

1. **Signature Verification** - All webhook requests verified using Stripe signing secret
2. **No JWT Required** - Webhooks come from Stripe, not authenticated users
3. **Idempotency** - Handle duplicate events gracefully using event ID tracking
4. **Error Handling** - Return 200 OK even on partial failures to prevent infinite retries

---

## Summary

This implementation provides:

- **Real-time sync** - Subscription changes in Stripe portal immediately reflected in AYN
- **User notifications** - Automated emails for all subscription lifecycle events
- **Reliable updates** - Webhook-based updates don't depend on user logging in
- **Branded experience** - All emails follow AYN's bilingual design system
- **Audit trail** - Email logs track all subscription communications
