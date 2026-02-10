

# Fix: Unlimited Users Being Blocked from Chat

## Root Cause

When you toggle a user to "unlimited" in the admin panel, their `user_ai_limits` row gets `is_unlimited = true` and `monthly_messages = -1`. The problem is a race condition and a negative-limit bug:

1. **Negative limit bug**: If the client-side state hasn't picked up `is_unlimited = true` yet (stale cache, page wasn't refreshed), the code falls through to check `monthly_messages`, which is `-1`. Since ANY usage count (0, 1, 7, etc.) is >= -1, the system thinks credits are exhausted and disables the chat input.

2. **Real-time gap**: The `useUsageTracking` hook only listens for `UPDATE` events on `user_ai_limits`. If the row was created via `upsert` (which can be an `INSERT`), the listener misses it entirely.

## The Fix

### 1. Fix negative limit handling in `useUsageTracking.ts`
When `is_unlimited` is false but `monthly_messages` is `-1` (or negative), treat it as unlimited instead of as a valid limit. This prevents the edge case where stale state + negative limit = blocked.

```
// Before (line 57-61):
const limit = data.is_unlimited ? null : isDaily ? (data.daily_messages || 5) : (data.monthly_messages || 50);

// After:
const rawLimit = isDaily ? (data.daily_messages || 5) : (data.monthly_messages || 50);
const limit = (data.is_unlimited || rawLimit < 0) ? null : rawLimit;
const isUnlimited = data.is_unlimited || rawLimit < 0;
```

### 2. Fix negative limit in `CenterStageLayout.tsx` creditsExhausted check
Add a guard: if `limit` is negative, treat as unlimited.

```
// Before (line 169-174):
const creditsExhausted = useMemo(() => {
    if (isUnlimited) return false;
    if (limit === null || limit === undefined) return false;
    const totalLimit = limit + bonusCredits;
    return (currentUsage ?? 0) >= totalLimit;
}, ...);

// After: add negative limit guard
const creditsExhausted = useMemo(() => {
    if (isUnlimited) return false;
    if (limit === null || limit === undefined || limit < 0) return false;
    const totalLimit = limit + bonusCredits;
    if (totalLimit <= 0) return false;
    return (currentUsage ?? 0) >= totalLimit;
}, ...);
```

### 3. Fix real-time listener to catch INSERT events too
In `useUsageTracking.ts`, change the real-time subscription from `event: 'UPDATE'` to `event: '*'` so it catches both inserts and updates.

### 4. Fix the DB function default for unlimited tiers
In `check_user_ai_limit`, when setting `monthly_messages = -1` for unlimited users, the function already handles `is_unlimited = true` correctly. No DB change needed.

## Files to Change

| File | Change |
|------|--------|
| `src/hooks/useUsageTracking.ts` | Fix negative limit handling, listen for all events |
| `src/components/dashboard/CenterStageLayout.tsx` | Guard against negative limits in creditsExhausted |

## Result

- Mouad, Ali, and any future unlimited users will never be blocked by negative limit values
- Real-time updates will work for both new and existing `user_ai_limits` rows
- No more need to tell users to refresh after toggling unlimited

