
# Fix "Earn 5 Credits" and Admin Unlimited Assignment

## Problem 1: Earn 5 Credits -- Credits Not Reflected

The bonus credits are correctly saved to the database, but the user doesn't see them reflected immediately because of a timing issue. After the `add_bonus_credits` RPC completes, `onCreditsUpdated` fires `refreshUsage()` instantly. However, the database transaction may not have fully committed yet, so the re-fetch reads stale data.

**Fix**: Add a small delay (500ms) before refreshing usage data after credit award, ensuring the DB transaction completes.

**File**: `src/components/dashboard/BetaFeedbackModal.tsx`
- After `add_bonus_credits` RPC succeeds, delay the `onCreditsUpdated` call by 500ms

## Problem 2: Admin Assigning "Unlimited" Tier -- User Gets Blocked

When an admin assigns the "Unlimited" or "Enterprise" tier, the `SubscriptionManagement` component updates `user_subscriptions.subscription_tier` to `'unlimited'` and sets `user_ai_limits.monthly_messages` to `-1`. However, it never sets `is_unlimited = true` in `user_ai_limits`.

The database function `check_user_ai_limit` only bypasses limits when `is_unlimited = true`. Since that flag is never set, the user's limit becomes `-1`, which means `current_val >= -1` is ALWAYS true, actually **blocking** the user entirely instead of giving them unlimited access.

**Fix**: When admin sets tier to `unlimited` or `enterprise`, also set `is_unlimited = true` in `user_ai_limits`. When setting any other tier, ensure `is_unlimited = false`.

**File**: `src/components/admin/SubscriptionManagement.tsx`
- In `handleSetOrOverrideTier`, add `is_unlimited` flag to the `user_ai_limits` upsert:
  - `is_unlimited: true` when tier is `'unlimited'` or `'enterprise'`
  - `is_unlimited: false` for all other tiers

## Technical Changes

### 1. SubscriptionManagement.tsx -- Fix unlimited flag

In the `handleSetOrOverrideTier` function (around line 234-244), update the `user_ai_limits` upsert to include `is_unlimited`:

```typescript
const isUnlimitedTier = newTier === 'unlimited' || newTier === 'enterprise';

const { error: limitsError } = await supabase
  .from('user_ai_limits')
  .upsert({
    user_id: editingUser.user_id,
    monthly_messages: effectiveLimit,
    monthly_engineering: tierData.limits.monthlyEngineering,
    is_unlimited: isUnlimitedTier,   // <-- NEW
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
```

### 2. BetaFeedbackModal.tsx -- Delayed credit refresh

In the `handleSubmit` function (around line 91-92), add a delay before calling `onCreditsUpdated`:

```typescript
// Trigger credit refresh after a short delay to ensure DB commit
setTimeout(() => {
  onCreditsUpdated?.();
}, 500);
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/SubscriptionManagement.tsx` | Add `is_unlimited` flag when upserting `user_ai_limits` based on tier |
| `src/components/dashboard/BetaFeedbackModal.tsx` | Add 500ms delay before refreshing credits after submission |

## Existing Data Fix

Any users already assigned "unlimited" or "enterprise" tier in the database currently have `is_unlimited = false` and are being blocked. A one-time SQL migration will fix existing records:

```sql
UPDATE user_ai_limits SET is_unlimited = true
WHERE user_id IN (
  SELECT user_id FROM user_subscriptions
  WHERE subscription_tier IN ('unlimited', 'enterprise')
);
```
