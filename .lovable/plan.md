

## Make Your AI Employees Talk to You Like Real Teammates

### What Changes

Right now, most agents work silently -- they log reports to internal tables (`ayn_mind`, `ayn_activity_log`) but never actually reach out to you. Only QA Watchdog and Security Guard send Telegram alerts (and only for critical issues). The `pushProactiveAlert` system exists for the Command Center but most agents don't use it.

This update makes every agent proactively message you via **both Telegram and the Command Center** when something important happens, needs your attention, or requires your approval.

### What You'll Experience

| Agent | What They'll Tell You |
|-------|----------------------|
| **QA Watchdog** | "hey, 3 functions are down right now. want me to keep monitoring or escalate?" |
| **Security Guard** | "blocked a user for rapid-fire abuse. 3rd strike in 24h. should I extend the ban?" |
| **Sales** | "new lead just came in -- Halifax company, looks like a 7/10 fit. want me to draft an outreach?" |
| **Sales** | "pipeline is empty. I need target industries or URLs to start prospecting." |
| **Investigator** | "finished researching that Halifax lead. they're a construction firm, ~50 employees, no existing website. strong fit for our web package." |
| **Follow-Up** | "3 leads haven't replied in 5 days. want me to send follow-ups or should we drop them?" |
| **Customer Success** | "new contact message from a potential client. want me to draft a reply?" |
| **Marketing** | "our last tweet got 2x the usual engagement. I'm drafting a follow-up post -- approve?" |
| **Outcome Evaluator** | "checked our predictions from last week. Sales was right about 4 of 6 leads. Advisor missed on the pricing call." |
| **Chief of Staff** | "morning update: 2 new leads, 1 security flag, pipeline value up 15% this week. all agents healthy." |
| **Advisor/Innovation/HR/Lawyer** | On-demand only (they respond when you ask through Command Center) |

### How It Works

Each event-triggered agent will, at the end of its work, do two things:

1. **Push a proactive alert** into the Command Center (already appears in real-time via the existing subscription)
2. **Send a Telegram message** so you get notified on your phone

Agents will use natural, casual language and explicitly ask for approval when they need it, like:

- "this lead scored 8/10 -- I can auto-send the outreach. your call."
- "found something sketchy in the logs. blocked the user for 30 min. want me to investigate deeper?"
- "pipeline's dry. give me an industry and region and I'll start hunting."

### Technical Details

**Files to modify (8 edge functions):**

1. **`ayn-sales-outreach/index.ts`** -- Add Telegram notification + proactive alert for new leads, empty pipeline requests, and follow-up due notices. Add approval-request pattern for high-value outreach.

2. **`ayn-investigator/index.ts`** -- After completing research on a lead, send findings summary via Telegram + Command Center with recommendation.

3. **`ayn-follow-up-agent/index.ts`** -- When follow-ups are due or a reply comes in, notify with context and ask whether to proceed.

4. **`ayn-customer-success/index.ts`** -- When a new contact message arrives, notify and offer to draft a reply.

5. **`ayn-outcome-evaluator/index.ts`** (via `ayn-unified`) -- After evaluating reflections, share accuracy report.

6. **`ayn-chief-of-staff/index.ts`** (via `ayn-unified`) -- After reviewing agent reports, send daily digest.

7. **`ayn-marketing-strategist/index.ts`** -- When performance data triggers action, notify with insights.

8. **`ayn-qa-watchdog/index.ts`** -- Already sends critical alerts. Add "all clear" periodic confirmation and approval requests for escalation.

**Shared helper update (`_shared/proactiveAlert.ts`):**
- Add a `notifyFounder` wrapper that does BOTH Telegram + Command Center in one call
- Accepts `needs_approval: boolean` flag to format messages with approval prompts
- Reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` from env

**Pattern each agent will follow:**
```text
// At the end of the agent's work:
await notifyFounder(supabase, {
  employee_id: 'sales',
  message: "new lead: Halifax Construction Co. scored 7/10. want me to draft an outreach?",
  priority: 'info',
  needs_approval: true,
  details: { lead_id: '...', score: 7 }
});
```

This sends the message to Telegram AND inserts it into `admin_ai_conversations` so it appears in the Command Center in real-time.

