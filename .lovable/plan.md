

## Fix Incorrect Free Tier User Limits

### Problem
5 out of 6 free tier users have inflated limits (`daily_messages: 10`, `daily_engineering: 3`) instead of the correct free tier values (`daily_messages: 5`, `daily_engineering: 1`). One user also has `monthly_limit: 10000` in `access_grants`.

### Fix (2 data updates, no schema changes)

**Step 1: Fix `user_ai_limits` for all free tier users**

Set `daily_messages = 5` and `daily_engineering = 1` for all users whose subscription tier is `free` or NULL (no subscription).

**Step 2: Fix `access_grants` for all free tier users**

Set `monthly_limit = 5` for any free tier user with an incorrect or NULL monthly_limit.

### Affected Users

| User | Current daily_messages | Current daily_engineering | Current monthly_limit | After Fix |
|---|---|---|---|---|
| bf4db4d1 (Koray) | 10 | 3 | 5 | 5 / 1 / 5 |
| 74d6614d | 10 | 3 | 5 | 5 / 1 / 5 |
| cf5f4735 | 10 | 3 | NULL | 5 / 1 / 5 |
| 3451ae77 | 10 | 3 | 10000 | 5 / 1 / 5 |
| d2ceaad6 | 10 | 3 | 5 | 5 / 1 / 5 |
| 1eb04a90 | 5 | 1 | NULL | 5 / 1 / 5 |

### Prevention

The `check-subscription` edge function already syncs these values correctly now (from the previous fix). These incorrect values are legacy data from before that fix was deployed. No code changes needed -- just data correction.

