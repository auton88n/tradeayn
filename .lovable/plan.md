

# Make AYN Talk to You: Autonomous Updates + Auto-Draft Emails for Approval

## The Problem

Right now AYN works silently. He has a 5-hour cooldown before messaging you, only talks when something is "urgent" or "worth sharing", and when he finds leads he just logs them without drafting emails or telling you about them. You have to go check the dashboard to see what he did.

## What Will Change

After this update, AYN will:

1. **Always message you after each proactive cycle** with a short status update -- what he checked, what he found, what he did
2. **Auto-draft outreach emails** for every new lead he finds, then send you the draft on Telegram for approval
3. **Wait for your "yes"** before sending any email -- the existing confirmation flow handles this

## Technical Changes

### 1. Remove the 5-hour cooldown gate (keep it only for non-urgent, boring cycles)

**File:** `supabase/functions/ayn-proactive-loop/index.ts`

- Change the logic so AYN ALWAYS sends a Telegram message after each cycle, even if nothing urgent happened
- The AI will generate a casual "here's what I just did" message every time
- Only skip messaging if the AI explicitly says `[SKIP]` AND nothing happened at all (no actions taken, no leads found, no tickets handled)
- Remove the `worthSharing` gate -- if AYN ran, AYN talks

### 2. Auto-draft emails after finding leads

**File:** `supabase/functions/ayn-proactive-loop/index.ts`

After the lead search succeeds (around line 233), for each newly prospected lead that has a contact email:

1. Call `ayn-sales-outreach` with `mode: 'draft_email'` and the `lead_id`
2. Send a separate Telegram message per lead with the draft preview:

```
New Lead + Draft Ready

Company: Example Corp
Email: contact@example.com
Pain points: No online booking, outdated website

Subject: "quick question about your site"
---
Hey [name], I checked out your site and noticed...
---

Reply "yes" to approve sending.
```

3. Store a `pending_action` in `ayn_mind` with the lead ID so your "yes" reply triggers the send
4. Set `admin_approved = true` on the lead (since you're seeing the draft, the approval gate is your reply)

### 3. Rate limit the drafts

- Max 2 email drafts per cycle to avoid API overload
- Skip leads without contact emails
- If draft generation fails, still notify you about the lead (just without a draft)

### 4. Update the AI prompt for status messages

Change the system prompt so AYN always reports what he did, even if it was routine:
- "Ran my checks, everything looks good, health at 95%"
- "Found 2 leads, drafted emails, waiting for your go"
- "Auto-replied to 1 stale ticket, no new leads this round"

The `[SKIP]` response will only be honored if literally zero actions were taken and zero leads were found.

## Flow After Changes

```text
Every 6 hours (cron triggers proactive loop):
  1. AYN checks system health, tickets, apps
  2. AYN searches for leads in a random industry
  3. For each lead found with email:
     - Drafts personalized outreach email
     - Sends preview to Telegram
     - Stores pending_action for confirmation
  4. AYN sends you a summary message:
     "Hey, just did my rounds. Health 92%, replied to 2 stale tickets,
      found 1 new lead (Example Corp) and drafted an email for you.
      Check Telegram for the preview."
  5. You reply "yes" -> email goes out
```

## Files Changed
- `supabase/functions/ayn-proactive-loop/index.ts` -- Remove cooldown gate, add auto-draft after lead search, always send status update to Telegram
