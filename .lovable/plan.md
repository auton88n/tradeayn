

# Stop AYN From Faking Actions It Can't Do

## The Problem

AYN just "performed" a 6-step troubleshooting process for a user named "mouad" -- checking flags, setting unlimited access, finding 403 errors -- but none of it actually happened. It was pure narration. The final line even admitted it: "No access grant found for user starting with mouad_user_id".

AYN hallucinated the entire process because:
1. It has no way to look up users by name or email -- only by UUID prefix
2. It can't read or modify `user_subscriptions` (blocked by its own rules)
3. It doesn't have a "find user" action, so it faked a lookup narrative
4. Nothing in the prompt tells it "if you can't do it, say so"

## What Changes

### 1. Add a "lookup user by email" action

A new action `[ACTION:find_user:email_or_name]` that searches `profiles` by `contact_person` or looks up `auth.users` by email. This gives AYN the ability to actually find a user before trying to act on them.

**In `commands.ts`**: Add `cmdFindUser` function that:
- Accepts an email or partial name
- Searches `profiles.contact_person` (ilike) and auth users by email
- Returns the user_id, name, email, subscription tier, access grant status
- This gives AYN real data to work with instead of guessing

**In `index.ts`**: Wire up the new action in `executeAction` and add it to the prompt's action list.

### 2. Add anti-hallucination rules to the prompt

Add a new section to `AYN_PERSONALITY`:

```text
HONESTY ABOUT CAPABILITIES (NON-NEGOTIABLE):
- If you don't have an ACTION tag that can do something, SAY SO. Never narrate fake steps.
- NEVER pretend to "check a database", "look up a user", or "toggle a flag" unless you're using a real [ACTION:...] tag.
- If someone asks you to fix a user's account and you don't have their user_id, say "I need their email or user ID to look them up" and use [ACTION:find_user:email].
- If you can't do something, say "I can't do that from here -- you'll need to do it from the admin panel."
- ZERO fake narration. No "Let me check... Found him... Setting his flag..." unless each step uses a real ACTION.
```

### 3. Add subscription-related read access for admins

Currently AYN is blocked from even reading subscription data, but the admin legitimately needs AYN to check a user's tier. Add a read-only action:

`[ACTION:check_user_status:user_id]` -- reads the user's subscription tier, access grant, and recent activity in one shot. Read-only, no modifications.

**In `commands.ts`**: Add `cmdCheckUserStatus` that reads from `user_subscriptions`, `access_grants`, and `user_ai_limits` for a given user_id and returns a formatted status report.

## Technical Details

### File: `supabase/functions/ayn-telegram-webhook/commands.ts`

**Add `cmdFindUser` function:**
- Takes email or partial name string
- Searches `profiles` table using `ilike` on `contact_person` column
- Also searches auth users by email via `supabase.auth.admin.listUsers()`
- Returns: user_id, name, company, account status, subscription tier, access grant status
- If multiple matches, shows up to 5 with their IDs so admin can pick

**Add `cmdCheckUserStatus` function:**
- Takes user_id (or prefix)
- Reads from `profiles`, `user_subscriptions`, `access_grants`, `user_ai_limits`
- Returns a comprehensive status showing tier, limits, usage, grant status, last login
- Read-only -- no modifications

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**Update `AYN_PERSONALITY` prompt:**
- Add "HONESTY ABOUT CAPABILITIES" section (anti-hallucination rules)
- Add `find_user` and `check_user_status` to the available actions list
- Remove the blanket "NEVER read from user_subscriptions" rule (replace with "read-only access for admin user status checks")

**Update `executeAction` switch:**
- Add `find_user` case calling `cmdFindUser`
- Add `check_user_status` case calling `cmdCheckUserStatus`

**Update command imports:**
- Import `cmdFindUser` and `cmdCheckUserStatus` from commands.ts

### Deployment
- Redeploy `ayn-telegram-webhook`

## Result

When you say "check mouad's account", AYN will:
1. Use `[ACTION:find_user:mouad]` to actually search by name
2. Get back a real user_id and status
3. If something needs fixing, use `[ACTION:set_unlimited:actual_uuid]` with the real ID
4. If it can't fix something, honestly say "you'll need to do that from the admin panel"

No more fake narration.
