
# Fix: Credits Not Updating After Feedback Submission

## Problem

The Sidebar's `CreditUpgradeCard` uses its own separate `useUsageTracking` hook instance (line 144 of `Sidebar.tsx`). When feedback is submitted, the `onCreditsUpdated` callback only refreshes the DashboardContainer's usage hook -- not the Sidebar's. So the Sidebar shows stale credit data until a page refresh.

The real-time Supabase subscription in `useUsageTracking` listens for `UPDATE` events on `user_ai_limits`, which should catch it, but there may be a timing issue or the channel might not be reliably delivering the update.

## Solution

Remove the duplicate `useUsageTracking` hook from `Sidebar.tsx` and instead pass the usage data down as props from `DashboardContainer`, which already has the hook and refreshes it after feedback submission.

### File: `src/components/dashboard/DashboardContainer.tsx`

Pass the usage tracking data to the Sidebar component so it uses the same data source that gets refreshed after feedback:

- Add props: `currentUsage`, `dailyLimit`, `bonusCredits`, `isUnlimited`, `resetDate`, `isDaily` from the existing `usageTracking` hook
- Wire these into the Sidebar component call

### File: `src/components/dashboard/Sidebar.tsx`

- Remove the internal `useUsageTracking` hook call (line 144)
- Use the props passed from DashboardContainer instead of hook-fetched values for the `CreditUpgradeCard`
- This ensures when `refreshUsage` is called after feedback submission, the Sidebar immediately reflects the updated credits

This is a single-source-of-truth fix: one hook instance, one refresh call, all UI in sync.
