

## Redesign AI Workforce Dashboard Into a Live Team Feed

### The Problem

Right now the Workforce Dashboard shows dry numbers -- action counts, health badges, pending task counts. You can't see what your agents are actually doing, saying, or asking for. The real updates go to the Command Center (a separate tab) and Telegram, but the dashboard itself tells you almost nothing useful.

### What Changes

Replace the current abstract dashboard with a **live team feed** that shows you exactly what each agent is doing, thinking, and asking -- like a team Slack channel. Every agent's proactive messages, status updates, and approval requests will appear right here.

### New Layout

```text
+-------------------------------------------------------+
|  AI Workforce                        [All] [Filter v]  |
+-------------------------------------------------------+
|                                                         |
|  NEEDS YOUR ATTENTION (approval requests)               |
|  +---------------------------------------------------+  |
|  | 💼 Sales - 12:03                                   |  |
|  | "new lead: Halifax Construction. scored 7/10.      |  |
|  |  want me to draft an outreach?"                    |  |
|  |                          [Approve] [Dismiss]       |  |
|  +---------------------------------------------------+  |
|                                                         |
|  TEAM FEED (live updates from all agents)               |
|  +---------------------------------------------------+  |
|  | 🐕 QA Watchdog - 12:33                             |  |
|  | "2 systems down: ayn-unified, support-bot.         |  |
|  |  health is fine. keeping an eye on it."            |  |
|  +---------------------------------------------------+  |
|  | 🛡️ Security Guard - 12:37                          |  |
|  | "1 issue found. Target flagged for rate limiting.  |  |
|  |  Strike 1 — warning issued."                       |  |
|  +---------------------------------------------------+  |
|  | 🤝 Customer Success - 12:35                        |  |
|  | "checked the pulse — 1 new insight found."         |  |
|  +---------------------------------------------------+  |
|                                                         |
|  AGENT STATUS (compact row of cards)                    |
|  [🧠 AYN ✓] [📋 CoS ✓] [💼 Sales ✓] [🛡️ Sec ✓] ... |
|                                                         |
|  SYSTEM HEALTH              |  QUICK STATS             |
|  health ✓ 543ms             |  Actions (7d): 287       |
|  ayn-unified ✗ 199ms        |  Pending: 3              |
|  support-bot ✗ 243ms        |  Healthy: 1/3            |
+-------------------------------------------------------+
```

### Key Sections

1. **Needs Your Attention** -- Approval requests from agents, pulled from `admin_ai_conversations` where `context.needs_approval = true`. Shows the agent's natural language message with Approve/Dismiss buttons.

2. **Team Feed** -- A real-time scrolling feed combining:
   - Agent proactive alerts from `admin_ai_conversations` (their actual messages to you)
   - Activity summaries from `ayn_activity_log` (what they did)
   - Each entry shows the agent emoji, name, time, and their natural language message

3. **Agent Status Strip** -- Compact horizontal row showing all 13 agents with a health dot (green/red/grey). Click to filter the feed by that agent.

4. **System Health + Quick Stats** -- Kept from the current dashboard but moved to the bottom as a compact panel.

### Technical Details

**Files modified:**
- `src/components/admin/workforce/WorkforceDashboard.tsx` -- Complete redesign of layout to prioritize the team feed and approval queue
- `src/components/admin/workforce/ApprovalQueue.tsx` -- New component fetching from `admin_ai_conversations` where `context->needs_approval = true` and `role = 'assistant'`
- `src/components/admin/workforce/TeamFeedPanel.tsx` -- New component combining `admin_ai_conversations` (proactive agent messages) with `ayn_activity_log` into a unified timeline, with real-time Supabase subscriptions on both tables
- `src/components/admin/workforce/AgentStatusStrip.tsx` -- New compact horizontal agent selector replacing the large grid of employee cards

**Data sources:**
- `admin_ai_conversations` -- Agent proactive messages (the "talking like employees" data we just added)
- `ayn_activity_log` -- Agent action summaries (existing)
- `system_health_checks` -- Health status (existing)
- `employee_tasks` -- Pending task count (existing)

**Real-time subscriptions:**
- Subscribe to `admin_ai_conversations` INSERT events for live agent messages
- Keep existing `ayn_activity_log` subscription for activity updates

**Existing panels kept (moved to bottom):**
- `HealthStatusPanel` -- Compact system health
- `CollaborationGraph` and `TaskQueuePanel` -- Available but secondary

