

# Fix: Unlimited Users Blocked by Legacy Limit System

## What's Happening

Unlimited users see "limit exceeded" because of two old checks that don't know about the `is_unlimited` flag:

1. **Frontend pre-check** (line 235): Calls `increment_usage()` RPC which checks the old `access_grants` table -- no concept of unlimited
2. **Post-send warning** (lines 730-765): Reads from `access_grants` and shows "Monthly Limit Reached" toasts

The server-side `check_user_ai_limit()` in `ayn-unified` already handles unlimited users correctly. The old system is redundant and actively blocking users.

## Changes

### 1. `src/hooks/useMessages.ts` -- Add `isUnlimited` parameter, skip old checks

- Add `isUnlimited: boolean` as 8th parameter to the `useMessages` hook
- Wrap the `increment_usage` pre-check (lines 233-271) with `if (!isUnlimited)` so unlimited users skip it entirely
- Remove the post-send `access_grants` usage warning block (lines 730-765) -- the `SystemNotificationBanner` already handles this from the correct `user_ai_limits` data

### 2. `src/components/dashboard/DashboardContainer.tsx` -- Pass `isUnlimited` to hook

- Pass `usageTracking.isUnlimited` as the 8th argument to `useMessages()`

### 3. `supabase/functions/ayn-unified/index.ts` -- Bypass 100-message cap for unlimited

- Before the `MAX_MESSAGES_PER_CHAT` check (line 547), query `user_ai_limits.is_unlimited`
- If unlimited, skip the 100-message enforcement entirely

### 4. Update test file

- Update `src/hooks/__tests__/useMessages.test.ts` to pass the new `isUnlimited` parameter (as `false` for existing tests)

## What This Does NOT Change

- Regular (non-unlimited) users keep all existing limits intact
- The server-side `check_user_ai_limit()` system is untouched -- it already works correctly
- No database changes needed
