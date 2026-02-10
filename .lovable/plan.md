

# Strengthen User Deletion Protection for AYN on Telegram

## Current State

AYN already has these protections:
- The system prompt says "No user deletion" in BLOCKED ACTIONS
- There is **no** `delete_user` action handler in the code — AYN literally cannot execute user deletion
- Admin users are additionally protected by the `isAdminUser` guard

So AYN cannot currently delete users. But the prompt wording is vague — let's make it crystal clear.

## Changes

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

Update the BLOCKED ACTIONS section (line 110-116) to be more explicit:

**Before:**
```
BLOCKED ACTIONS (never execute):
- No subscription/billing actions
- No user deletion
- No auth/password changes
```

**After:**
```
BLOCKED ACTIONS (never execute):
- No subscription/billing actions
- No removing users from the system — never delete user accounts, auth records, or profiles
- No auth/password changes
```

Also update the `WHAT YOU DON'T TOUCH` section (line 47-50) to explicitly mention user removal:

**Before:**
```
WHAT YOU DON'T TOUCH:
- ADMIN USERS ARE UNTOUCHABLE...
- Subscriptions, payments, billing...
- User passwords or auth tokens
```

**After:**
```
WHAT YOU DON'T TOUCH:
- ADMIN USERS ARE UNTOUCHABLE...
- NEVER remove or delete any user from the system — no account deletion, no auth record removal, no profile wiping
- Subscriptions, payments, billing...
- User passwords or auth tokens
```

This makes it clear across two sections of the prompt that AYN cannot remove anyone from the system — not just admins, but all users.

No code handler changes needed since no `delete_user` action exists.

