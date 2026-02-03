
## What’s actually broken (root cause)
Your tier change *is* hitting the database, but the UI always shows “No Record” and then the “Create Subscription” action fails.

From the network log, the request is:
- `POST /rest/v1/user_subscriptions` → **409 duplicate key**
- Message: `duplicate key value violates unique constraint "user_subscriptions_user_id_key"`

That means: **the subscription row already exists** for that user, but the UI thinks it doesn’t.

Why the UI thinks it doesn’t:
- `SubscriptionManagement.tsx` loads all subscriptions with:
  - `supabase.from('user_subscriptions').select('*')`
- Your RLS policies currently allow:
  - users to `SELECT` their own subscription
  - admins to `INSERT/UPDATE`
- But you do **not** have an **admin SELECT policy** on `user_subscriptions`.

So for admins:
- `SELECT * FROM user_subscriptions` returns **0 rows** (blocked by RLS)
- UI marks everyone as `No Record`
- Then it tries an `INSERT`
- DB rejects it because the row already exists → 409
- Because the subscription insert fails, the follow-up `user_ai_limits.upsert(...)` never runs either

## Fix strategy (make everything work reliably)
We’ll fix this in two layers:

### A) Database (RLS): allow admins to read subscriptions
Add a **SELECT policy** for admins on `public.user_subscriptions`, using the existing `has_role(auth.uid(), 'admin'::app_role)` function.

SQL migration content:
```sql
CREATE POLICY "Admins can select all user subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

Optional but recommended for completeness:
- Add an admin SELECT policy to `user_ai_limits` as well (useful for any admin screens that may need to read limits):
```sql
CREATE POLICY "Admins can select all user_ai_limits"
ON public.user_ai_limits
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```
(Your `user_ai_limits` table already has other admin policies, but adding explicit admin SELECT avoids future “admin can’t see data” surprises.)

### B) Frontend: stop failing on duplicates (make “Set Tier” robust)
Even after adding admin SELECT, race conditions can still happen (or the UI state can be stale). So we’ll also make the “create subscription” path safe:

In `handleSetOrOverrideTier`:
1. Replace the `insert(...)` branch with an **upsert** on `user_id` (or handle 409 by falling back to update).
2. Ensure the upsert payload **does not include** `stripe_customer_id` / `stripe_subscription_id` so we never accidentally overwrite Stripe-linked users.
   - Payload should be only: `{ user_id, subscription_tier, status }`
3. After success:
   - call `fetchSubscriptions()` (already done)
   - close dialog (already done)
   - show a more accurate toast (“Saved” rather than “Created”) if it was an upsert

This makes tier setting work even if the UI thought the record didn’t exist.

## How we’ll verify it’s fixed (end-to-end)
1. Open the admin subscription screen.
2. Click “Refresh”.
   - You should now see users with existing subscription records showing their tier badge (not “No Record”).
3. Pick a user that previously showed “No Record” but actually has a subscription (like the one causing 409).
4. Set tier to Pro and save.
   - Expected:
     - no 409
     - tier badge updates after refresh
     - `user_ai_limits` is updated/upserted accordingly
5. Confirm in Network tab:
   - `GET /user_subscriptions` returns rows (previously it was effectively empty for admin due to RLS)
   - `POST/PATCH /user_subscriptions` succeeds (200/201/204)
   - `POST /user_ai_limits?on_conflict=user_id` succeeds

## Notes / risks
- This change intentionally allows admins to view all subscription rows. That’s required for the admin dashboard to work.
- We keep non-admin users restricted to “own row only” via the existing policy.
- Frontend robustness ensures you don’t get stuck again if the subscription record already exists.

## Implementation checklist (what I will do after you approve)
1. Add the new RLS SELECT policy(ies) via a Supabase migration.
2. Update `src/components/admin/SubscriptionManagement.tsx` to use upsert (or fallback update) instead of plain insert for “no record” users.
3. Validate in the preview using network logs and UI refresh to confirm tiers render and persist correctly.
