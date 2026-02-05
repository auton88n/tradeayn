
# Fix "Unlimited" Tier Backend Support

## Problem

The database has a check constraint that blocks the "unlimited" and "enterprise" tiers from being saved:

```sql
CHECK ((subscription_tier = ANY (ARRAY['free', 'starter', 'pro', 'business'])))
```

When you try to set a user to "Unlimited", the database rejects it with error code `23514`.

---

## Solution

### 1. Update Database Constraint

Run this SQL to allow the new tiers:

```sql
-- Drop old constraint
ALTER TABLE user_subscriptions 
DROP CONSTRAINT user_subscriptions_subscription_tier_check;

-- Add new constraint with all tiers
ALTER TABLE user_subscriptions 
ADD CONSTRAINT user_subscriptions_subscription_tier_check 
CHECK (subscription_tier = ANY (ARRAY['free', 'starter', 'pro', 'business', 'enterprise', 'unlimited']));
```

### 2. Update Edge Function

**File: `supabase/functions/check-subscription/index.ts`**

Add `enterprise` and `unlimited` to `TIER_LIMITS`:

```typescript
const TIER_LIMITS = {
  free: { dailyCredits: 5, dailyEngineering: 1, isDaily: true },
  starter: { monthlyCredits: 500, monthlyEngineering: 10 },
  pro: { monthlyCredits: 1000, monthlyEngineering: 50 },
  business: { monthlyCredits: 3000, monthlyEngineering: 100 },
  enterprise: { monthlyCredits: -1, monthlyEngineering: -1 },  // Custom
  unlimited: { monthlyCredits: -1, monthlyEngineering: -1 },   // No limits
};
```

Also update the logic to preserve admin-assigned tiers (enterprise/unlimited) when checking Stripe:

- If user already has `unlimited` or `enterprise` tier in DB, don't downgrade them based on Stripe status
- These tiers are admin-only overrides that bypass Stripe billing

---

## Changes Summary

| Component | Change |
|-----------|--------|
| Database | Add `enterprise`, `unlimited` to tier constraint |
| Edge Function | Add tier definitions, preserve admin overrides |

## Result

After implementation:
- Admins can assign "Unlimited" tier from the Subscriptions tab
- Users with admin-assigned tiers won't be overwritten by Stripe sync
- The `-1` credit value correctly represents "unlimited"
