

# Reduce Subscription Polling and Add Realtime Listener

## Problem

The `SubscriptionContext` polls `check-subscription` every 60 seconds via `setInterval`, which is excessive and generates unnecessary Stripe API calls. The sessionStorage cache (5-min TTL) already mitigates most of this, but the interval itself is wasteful.

## Solution

1. **Remove the 60-second polling `useEffect`** (lines 175-178) entirely -- no more `setInterval`.
2. **Add a Supabase Realtime listener** on the `user_subscriptions` table filtered to the current user's row. When the row changes (e.g., after a webhook updates their tier), invalidate the sessionStorage cache and call `checkSubscription()`.
3. **Keep the sessionStorage cache** with its existing 5-minute TTL -- no changes there.
4. The `onAuthStateChange` listener (lines 166-173) stays as-is for login/logout triggers.

## Technical Details

### File: `src/contexts/SubscriptionContext.tsx`

**Remove** the auto-refresh `useEffect` (lines 175-178):
```typescript
// DELETE THIS BLOCK
useEffect(() => {
  const interval = setInterval(checkSubscription, 60000);
  return () => clearInterval(interval);
}, [checkSubscription]);
```

**Replace with** a Realtime subscription `useEffect`:
```typescript
useEffect(() => {
  let channel: ReturnType<typeof supabase.channel> | null = null;

  const setupRealtime = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    channel = supabase
      .channel(`sub-${session.user.id.slice(0, 8)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          // Invalidate cache and re-check
          sessionStorage.removeItem('subscription_cache');
          checkSubscription();
        }
      )
      .subscribe();
  };

  setupRealtime();

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}, [checkSubscription]);
```

### What changes

| Aspect | Before | After |
|--------|--------|-------|
| Polling | Every 60s via `setInterval` | None |
| Realtime | None | Listens to `user_subscriptions` row changes |
| Cache | 5-min sessionStorage TTL | Unchanged (but invalidated on realtime event) |
| Auth change trigger | `onAuthStateChange` calls `checkSubscription` | Unchanged |

### Files affected
- `src/contexts/SubscriptionContext.tsx` -- remove polling useEffect, add Realtime useEffect

