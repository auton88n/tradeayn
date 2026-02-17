

## Fix: Subscriptions Should Work Automatically Without Admin Approval

### Problem
When a user upgrades their subscription through Stripe (e.g., from Free to Starter/Pro/Business), the payment goes through, but:

1. The `check-subscription` edge function only updates `user_subscriptions` and `user_ai_limits` tables
2. It does **not** update the `access_grants` table
3. The app checks `access_grants.is_active` and `access_grants.monthly_limit` to determine if a user can use the platform
4. Result: paid subscribers can still appear restricted or have wrong limits because `access_grants` is out of sync

### Solution
Update the `check-subscription` edge function to also sync the `access_grants` table whenever it detects a subscription change. This ensures paid users automatically get:
- `is_active = true`
- `monthly_limit` matching their tier
- No admin approval needed

### Technical Details

**1. Update `check-subscription` edge function**

After the existing `user_subscriptions` and `user_ai_limits` upserts, add an `access_grants` upsert:

```text
Tier mapping for access_grants.monthly_limit:
  free    -> 5
  starter -> 500
  pro     -> 1000
  business -> 3000
  enterprise/unlimited -> 999999 (effectively unlimited)
```

The function will upsert `access_grants` with:
- `is_active: true` (always active for any tier)
- `monthly_limit` matching the tier's credit allocation
- `requires_approval: false`

**2. No frontend changes needed**

The existing `useAuth` hook already reads from `access_grants` -- once the data is correct there, everything works automatically.

### Files Modified

| File | Change |
|---|---|
| `supabase/functions/check-subscription/index.ts` | Add `access_grants` upsert after subscription check, syncing `is_active` and `monthly_limit` with the detected tier |

### Result
- Upgrading via Stripe automatically activates the user and sets correct limits
- Downgrading or canceling also syncs correctly
- No admin intervention needed at any point
- Free users also get properly synced on every check
