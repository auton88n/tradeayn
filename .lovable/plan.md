
# Fix: Admin Subscription Management Not Working

## Problem Identified

The subscription tier updates are failing silently because the Row Level Security (RLS) policies are checking the **wrong table**:

**Current (Wrong) Approach:**
The policies check `access_grants.notes ILIKE '%admin%'` - but most admin users have `notes = null` in access_grants.

**Correct Approach:**
The project already has a `has_role()` function that properly checks the `user_roles` table for admin status. Other policies in the same `user_ai_limits` table already use this pattern correctly.

---

## Current Admin Users (from `user_roles` table)

| User | Company | Role |
|------|---------|------|
| ghazi | hoolet | admin |
| Test Admin | AYN Admin | admin |
| MIKE | HOOLET | admin |

---

## Solution

Replace the incorrectly configured RLS policies with ones that use the existing `has_role()` function:

### Database Changes

**1. Drop the broken policies:**
- `Admins can insert user subscriptions` (on user_subscriptions)
- `Admins can update all user subscriptions` (on user_subscriptions)  
- `Admins can insert user_ai_limits` (on user_ai_limits)
- `Admins can update all user_ai_limits` (on user_ai_limits)

**2. Create corrected policies using `has_role()` function:**

```text
┌─────────────────────────────┐
│    RLS Policy Check Flow    │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  has_role(auth.uid(),       │
│          'admin'::app_role) │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  Checks user_roles table    │
│  for role = 'admin'         │
└─────────────────────────────┘
        │
        ▼
   ✓ Returns true/false
```

### Policies to Create

**For `user_subscriptions` table:**
- INSERT policy: Allow admins to insert subscriptions for any user
- UPDATE policy: Allow admins to update subscriptions for any user

**For `user_ai_limits` table:**
- INSERT policy: Allow admins to insert AI limits for any user
- UPDATE policy: Allow admins to update AI limits for any user

---

## Technical Details

SQL migration to execute:

```sql
-- Drop broken policies that check access_grants.notes
DROP POLICY IF EXISTS "Admins can insert user subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can update all user subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can insert user_ai_limits" ON public.user_ai_limits;
DROP POLICY IF EXISTS "Admins can update all user_ai_limits" ON public.user_ai_limits;

-- Create correct INSERT policy for user_subscriptions
CREATE POLICY "Admins can insert user subscriptions"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create correct UPDATE policy for user_subscriptions
CREATE POLICY "Admins can update all user subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create correct INSERT policy for user_ai_limits
CREATE POLICY "Admins can insert user_ai_limits"
ON public.user_ai_limits
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create correct UPDATE policy for user_ai_limits
CREATE POLICY "Admins can update all user_ai_limits"
ON public.user_ai_limits
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

---

## After Implementation

1. Admin users (ghazi, MIKE, Test Admin) will be able to:
   - Set subscription tiers for users without subscription records
   - Override tiers for users with existing subscriptions
   - Automatically sync AI credit limits when tiers change

2. The "Set Tier" and "Edit" buttons will work as expected
