

# Unify Usage Limits and Subscription Systems

## Summary

Your app currently has two competing systems:
1. **Subscription tiers** (Free/Starter/Pro/Business) that set credit allocations
2. **Usage tracking** that enforces limits but uses different columns

These systems are out of sync, causing:
- Messages appearing in history without AYN responses
- Confusing limit enforcement (daily vs monthly)
- "Unlimited" being an admin toggle rather than a subscription option

## What Needs to Change

### 1. Consolidate to Monthly-First Limits

The current system is checking `daily_messages` for free tier but subscriptions set `monthly_messages`. We need to:

- **Free tier**: 5 credits/day = use `daily_messages` column, enforce daily
- **Paid tiers**: Monthly limits = use `monthly_messages` column, enforce monthly
- The backend `check_user_ai_limit` function needs to check BOTH and use the appropriate one based on tier

### 2. Prevent Messages from Showing Before AYN Responds

Currently the user message is saved before calling AYN. If AYN returns 429 (limit exceeded), the message appears in history but has no response.

**Fix**: Check limits BEFORE saving the user message to the database. If limit exceeded, block immediately and don't save.

### 3. Add "Unlimited" as a Subscription Option

Currently `is_unlimited` is an admin-only toggle. We should:
- Keep admin override capability
- Add an "Unlimited" tier option for enterprise/special users
- Make the frontend show "Unlimited" status based on both database flag AND subscription tier

---

## Technical Implementation

### File Changes Overview

| File | Changes |
|------|---------|
| `supabase/migrations/new_migration.sql` | Update `check_user_ai_limit` to check tier-appropriate limits |
| `supabase/functions/check-subscription/index.ts` | Sync `daily_messages` for free tier users |
| `src/hooks/useUsageTracking.ts` | Fetch both daily and monthly limits, determine which to display |
| `src/components/dashboard/CenterStageLayout.tsx` | Update `creditsExhausted` logic to be tier-aware |
| `supabase/functions/ayn-unified/index.ts` | Move limit check BEFORE message save (or return clear status) |

---

### Step 1: Fix Backend Limit Checking

**New Migration: `check_user_ai_limit` function update**

```text
Logic changes:
1. First check if user is_unlimited - if yes, allow (current behavior, keep)
2. Get user's subscription tier from user_subscriptions table
3. If tier = 'free' OR tier IS NULL:
   - Check against daily_messages limit
   - Use current_daily_messages counter
4. If tier IN ('starter', 'pro', 'business'):
   - Check against monthly_messages limit
   - Use current_monthly_messages counter
5. Return appropriate limit info for frontend
```

### Step 2: Fix Subscription Sync

**Update `check-subscription/index.ts`**

When setting limits for free tier:
- Set `daily_messages = 5` (not monthly_messages)
- Keep `monthly_messages` for tracking purposes

For paid tiers:
- Set `monthly_messages` = tier allocation
- Set `daily_messages = NULL` (no daily limit)

### Step 3: Update Frontend Usage Display

**Update `useUsageTracking.ts`**

Fetch additional columns:
- `daily_messages`, `current_daily_messages`
- `monthly_messages`, `current_monthly_messages`
- Determine which to display based on tier

Return:
```typescript
{
  // For UI display
  currentUsage: tierIsDaily ? daily_usage : monthly_usage,
  limit: tierIsDaily ? daily_limit : monthly_limit,
  isDaily: boolean, // UI knows whether to show "daily" or "monthly"
  
  // Existing fields
  bonusCredits,
  isUnlimited,
  resetDate,
}
```

### Step 4: Fix Message Save Timing

**Option A (Recommended)**: In `ayn-unified`, the limit check happens early. When it fails, return a 429 with `limitExceeded: true`. The frontend hook (`useAYN` or `useMessages`) should:
1. Check this flag
2. NOT add the user message to the visible history
3. Show a toast/modal explaining the limit

**Option B**: Add a pre-flight check in the frontend before calling AYN. This adds latency but prevents the issue entirely.

---

## Data Flow After Fix

```text
User sends message
    |
    v
Frontend: Check local usage state
    |
    +-- If exhausted -> Block immediately, show upgrade prompt
    |
    +-- If OK -> Call AYN
            |
            v
        Backend: check_user_ai_limit()
            |
            +-- Check is_unlimited -> Allow
            |
            +-- Check tier-appropriate limit
            |       |
            |       +-- Free: daily_messages
            |       +-- Paid: monthly_messages
            |
            +-- If allowed -> Process request, increment counters
            +-- If blocked -> Return 429 BEFORE saving message
```

---

## Summary of Changes

| Component | Current Behavior | New Behavior |
|-----------|-----------------|--------------|
| Free tier limits | Checks monthly_messages (5) | Checks daily_messages (5/day) |
| Paid tier limits | May check daily incorrectly | Checks monthly_messages |
| is_unlimited | Admin toggle only | Admin toggle + possible tier flag |
| Message on 429 | Message shows, no response | Block before save, clear feedback |
| Frontend display | Shows monthly for all | Shows daily/monthly based on tier |

---

## Expected Result

- Free users get exactly 5 credits per day, reset daily
- Paid users get their monthly allocation (500/1000/3000)
- When limit is reached, AYN stops completely (no message saved)
- "Unlimited" works as admin override AND potential enterprise option
- UI clearly shows remaining credits with correct reset timing

