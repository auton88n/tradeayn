

# Fix AYN's Memory + Make Conversations Flow Naturally

## What's Breaking (from your screenshot)

AYN drafts an email, asks "Should I go ahead?", you say "Confirm send it" — and AYN replies "I don't have a pending email." Two problems cause this:

1. AYN's replies are chopped to 500 characters when saved. The email draft is easily 1500+ chars, so by the time AYN reads its own history next turn, the draft and the "Should I go ahead?" question are gone.
2. The "pending action" flag just says "awaiting_confirmation" but doesn't store WHICH lead or WHAT action to run. So even if AYN knows it asked something, it can't act on it.

## Changes

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**1. Increase message storage from 500 to 2000 characters (line 292-293)**

Both admin messages and AYN replies get saved truncated. Bump to 2000 so email drafts survive in history.

**2. Store actionable data in pending_action (line 284-293)**

Instead of just `"awaiting_confirmation"`, extract the lead_id from executed actions and store:
```
{
  type: "awaiting_confirmation",
  action: "send_outreach",
  lead_id: "abc-123",
  summary: "Send outreach email to Crossmint"
}
```

This is done by parsing the executed actions array for draft_outreach or send_email results, and pulling the lead_id from the action parameters.

**3. Auto-execute confirmations (before AI call, around line 224)**

Add a check: if the user's message matches a confirmation pattern ("yes", "go ahead", "confirm", "send it", "do it") AND the most recent `ayn_mind` entry has a `pending_action` with a stored action and lead_id -- skip the AI call entirely and execute the pending action directly. Then respond with the result.

This is the real fix: instead of hoping the AI "remembers", we programmatically catch confirmations and run them.

**4. Enrich conversation history with pending context (line 441-446)**

When building history and a message has `pending_action` with details, append:
```
[PENDING: Waiting for confirmation to send outreach to CompanyName (lead_id: abc-123)]
```

So even if the AI path is used, the model can see exactly what's pending.

### File: `supabase/functions/ayn-sales-outreach/index.ts`

**5. Ban "AYN Team" signatures (line 231)**

Add explicit rule to the drafting prompt: "NEVER sign as 'AYN Team', 'The AYN Team', or 'Best, AYN Team'. Always use a personal name + role like 'Sarah, Sales @ AYN'."

## What stays the same

- The personality prompt, tone, and dynamic role system -- already good from last update
- Reply-to-message handling -- already working
- All sales pipeline logic, SMTP sending, follow-up rules -- unchanged

## Technical Summary

| Fix | Where | What |
|-----|-------|------|
| Storage 500 to 2000 chars | webhook line 292-293 | Drafts survive in history |
| Actionable pending_action | webhook line 284-293 | Stores lead_id + action type |
| Auto-execute confirmations | webhook ~line 224 | Catches "yes"/"confirm" and runs pending action |
| Richer history context | webhook line 441-446 | AI sees what's pending |
| Ban "AYN Team" signature | sales-outreach line 231 | Personal sign-offs only |

