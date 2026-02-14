

## Remove Cron Jobs, Switch to Event-Driven Agent Activation

### What Changes

Instead of 14 scheduled jobs that run on timers (and mostly do nothing), agents will wake up only when something actually happens in the database. This means faster reactions, zero wasted calls, and agents that feel alive.

### Current Problem

Right now, agents run on fixed schedules (every 15 min to 24 hours). Most of the time they check, find nothing, and go back to sleep. Meanwhile, when something important happens (a lead replies, an error spikes), the agent won't notice until its next scheduled run -- which could be hours later.

### New Event-Driven Model

Each agent gets activated by a specific database event (a row inserted or updated in a relevant table):

| Agent | Trigger Event | What Activates It |
|-------|--------------|-------------------|
| **QA Watchdog** | New row in `error_logs` | An error is logged -- watchdog checks immediately |
| **Security Guard** | New high/critical `security_logs` entry | A security event fires -- guard investigates |
| **Follow-Up Agent** | New row in `inbound_email_replies` OR pipeline status change to `contacted` | A lead replies or gets contacted -- follow-up kicks in |
| **Sales Outreach** | New lead added to `ayn_sales_pipeline` | A new lead appears -- sales prepares |
| **Investigator** | Pipeline lead status changes to `new` or `needs_investigation` | A lead needs research -- investigator digs in |
| **Customer Success** | New `contact_messages` or support ticket | A customer reaches out -- success agent responds |
| **Marketing** | New `twitter_posts` performance data or pipeline changes | Content performs well/poorly -- marketing adjusts |
| **Outcome Evaluator** | New `employee_reflections` entry | An agent reflects -- evaluator checks if prediction matched reality |
| **Chief of Staff** | New `ayn_mind` entries (employee reports) | An agent reports something -- chief reviews |
| **Advisor** | On-demand only (Command Center) | You ask for advice -- advisor responds |
| **Lawyer** | On-demand only (Command Center) | You ask for legal review -- lawyer responds |

### What Stays the Same

- **Command Center**: You can still directly command any agent anytime
- **Telegram**: Still works for notifications and direct interaction
- **Agent functions**: The edge functions themselves don't change -- only HOW they get called changes

### What Gets Removed

All 14 `pg_cron` scheduled jobs will be unscheduled (removed from the cron system).

### Technical Details

**Step 1: SQL Migration** -- Create database trigger functions that use `net.http_post()` to call the relevant edge function when a matching event occurs. Each trigger includes a debounce check (only fires if no similar call was made in the last 2 minutes) to prevent spam.

Example trigger pattern:
```text
INSERT into error_logs
  --> trigger fires
    --> checks: was qa-watchdog called in last 2 min?
      --> NO: calls net.http_post to ayn-qa-watchdog
      --> YES: skips (already watching)
```

**Step 2: SQL Migration** -- Remove all existing cron jobs:
```text
SELECT cron.unschedule('ayn-qa-watchdog-loop');
SELECT cron.unschedule('ayn-security-guard-loop');
... (all 14 jobs)
```

**Step 3: Add a debounce tracking table** -- `agent_event_debounce` with columns: `agent_name`, `last_triggered_at`, used to prevent duplicate triggers within short windows.

**Step 4: Update edge functions** -- Add `{"source": "event_trigger"}` handling alongside existing `{"source": "cron"}` so agents know they were event-triggered and can include the triggering record in their context.

**Files affected:**
- New SQL migration (database triggers + unschedule crons)
- Minor updates to edge functions that need to handle the event payload

