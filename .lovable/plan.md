

## Fix: New Users Should Be Active Immediately

### Problem
Currently, new users who sign up get `is_active = false` in their `access_grants` record, which means they appear as "Pending" and cannot use the platform until an admin manually activates them. You want all new sign-ups to start using Ayn's free subscription right away.

### Solution
Update the `handle_new_user` database trigger to set `is_active = true` instead of `false`, and also activate any currently inactive users who were created with the old default.

### Technical Details

**1. Update the trigger function (SQL migration)**

Change `is_active` from `false` to `true` in the `handle_new_user` function:

```sql
INSERT INTO public.access_grants (user_id, is_active, monthly_limit, requires_approval)
VALUES (NEW.id, true, 5, false)
ON CONFLICT (user_id) DO NOTHING;
```

**2. Activate existing inactive users**

Set all currently inactive users to active so they can start using Ayn immediately:

```sql
UPDATE public.access_grants
SET is_active = true, granted_at = now()
WHERE is_active = false;
```

### Result
- All future sign-ups will be **active immediately** with the free tier (5 monthly limit)
- All existing users who were stuck as "Pending" will be activated
- No admin intervention needed for new users to start using Ayn

