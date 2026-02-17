

## Fix: New Users Not Appearing in Admin Panel

### Problem
New users who sign up are invisible in the admin panel. The root cause is a gap between two systems:

1. The **`handle_new_user` database trigger** creates a `profiles` row and a `user_settings` row when someone signs up -- but does NOT create an `access_grants` row.
2. The **Admin Panel's User Management** fetches its user list exclusively from the `access_grants` table.

Result: any user without an `access_grants` record (like the newest user KorayG) simply doesn't appear.

### Solution

**Update the `handle_new_user` database trigger** to also insert a default `access_grants` row for every new user. This ensures all new sign-ups appear in the admin panel immediately.

### Technical Details

**1. Alter the `handle_new_user` function (SQL migration)**

Add an `INSERT INTO public.access_grants` statement to the existing trigger function:

```sql
INSERT INTO public.access_grants (user_id, is_active, monthly_limit, requires_approval)
VALUES (NEW.id, false, 5, false)
ON CONFLICT (user_id) DO NOTHING;
```

This gives new users:
- `is_active = false` (inactive/pending until admin activates)
- `monthly_limit = 5` (free tier default)
- No approval required

**2. Backfill the missing user (SQL)**

Insert an `access_grants` row for KorayG who already signed up without one:

```sql
INSERT INTO access_grants (user_id, is_active, monthly_limit, requires_approval)
SELECT p.user_id, false, 5, false
FROM profiles p
LEFT JOIN access_grants ag ON p.user_id = ag.user_id
WHERE ag.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
```

This catches any existing users who fell through the gap.

### Files Modified

| File / Location | Change |
|---|---|
| SQL migration (new) | Update `handle_new_user` function to insert `access_grants` row |
| SQL migration (new) | Backfill missing `access_grants` for existing users |

### Result
- All future sign-ups will automatically appear in the admin panel as "Pending/Inactive"
- The one existing user (KorayG) will also appear after the backfill
