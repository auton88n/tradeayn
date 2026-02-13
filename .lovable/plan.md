

# Command Center: Memory, Directives, and Direct Command Execution

## The Core Problems

1. **No memory** -- The War Room starts fresh every time. Employees never remember past discussions or your instructions.
2. **No founder directives** -- When you say "stay in Canada," it's not stored anywhere. The `founder_model.rejected_patterns` and `approved_patterns` arrays are empty. Employees repeat Dubai/Singapore because nothing tells them not to.
3. **One-way only** -- You can start discussions, but can't issue direct commands like "Sales, prospect these 5 companies" or "Investigator, research this lead."
4. **No event-triggered execution** -- Employees only run on cron schedules, not when you command them.

## Solution Overview

Transform the War Room into a **Command Center** that:
- Stores and enforces **Founder Directives** (like "Canada only, no Dubai")
- Lets you **command employees directly** (not just discuss)
- Gives employees **memory of past discussions** so they don't repeat themselves
- Injects directives into every employee's system prompt automatically

```text
BEFORE:                          AFTER:
War Room                         Command Center
  |                                |
  +-- Discussion only              +-- Discussions (with memory)
  +-- No memory                    +-- Direct Commands (@sales prospect X)
  +-- No directives                +-- Founder Directives (Canada only!)
  +-- Agents forget everything     +-- Past context injected into prompts
```

## Technical Plan

### 1. New Database Table: `founder_directives`

Stores your standing orders that ALL employees must follow.

```sql
CREATE TABLE public.founder_directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directive text NOT NULL,          -- "Focus only on Canada"
  category text DEFAULT 'general',  -- 'geo', 'strategy', 'budget', 'general'
  priority integer DEFAULT 1,       -- 1=highest
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz            -- optional expiry
);
```

When you say "stay in Canada," the system saves it as a directive. Every employee prompt will include active directives.

### 2. Upgrade Edge Function: `admin-war-room` becomes `admin-command-center`

New capabilities:

- **`mode: 'discuss'`** (existing behavior, enhanced) -- Agents discuss a topic, but now with memory of past discussions and directives injected.
- **`mode: 'command'`** (new) -- Direct command to a specific employee. E.g., `@sales prospect these 10 Canadian companies`. Calls that employee's edge function directly and returns the result.
- **`mode: 'directive'`** (new) -- Save a founder directive. E.g., "Only target Canadian companies. No Dubai, no Singapore." Gets stored in `founder_directives` and immediately injected into all future prompts.
- **`mode: 'follow_up'`** (new) -- Continue a previous discussion by loading its context.

**Memory injection for discussions:**
- Load last 3 discussions from `employee_discussions` as context
- Load all active founder directives
- Include both in each agent's system prompt

**Command routing:**
- Parse `@agent_name command` syntax
- Call the appropriate edge function (e.g., `ayn-sales-outreach` with `mode: 'prospect'`)
- Return the result in the command center UI

### 3. Inject Directives Into ALL Employee Prompts

Update `_shared/employeeState.ts` `buildEmployeeContext()` to load and include founder directives:

```text
// Added to every employee's context:
"FOUNDER DIRECTIVES (MUST FOLLOW):
- [P1] Focus only on Canada. No Dubai, no Singapore.
- [P1] Target mid-size and small companies.
- [P2] Offer free trials first, then convert."
```

This means when Sales runs on cron, when Investigator processes tasks, when Advisor synthesizes -- they ALL see these directives. No more Dubai suggestions.

### 4. Upgrade Frontend: `WarRoomPanel.tsx` becomes `CommandCenterPanel.tsx`

Changes:
- Rename "War Room" to "Command Center" in sidebar
- Add a **Directives panel** (top section) showing active standing orders with add/remove
- Add **mode tabs**: Discussion | Command | Directives
- Support `@agent command` syntax in the input box
- Show discussion history sidebar (past topics)
- Allow continuing/following up on past discussions
- Parse command responses differently from discussions

### 5. Seed Initial Directives From Your Existing Instructions

Based on what you've already said in Telegram (found in `ayn_mind`), auto-create these directives:

```sql
INSERT INTO founder_directives (directive, category, priority) VALUES
  ('Focus ONLY on Canadian companies. Do NOT suggest Dubai, Singapore, or any non-Canadian targets.', 'geo', 1),
  ('Target mid-size and small companies in Canada, especially Nova Scotia.', 'strategy', 1),
  ('Offer free trials of AYN engineering tools first. Get feedback before pushing paid services.', 'strategy', 1),
  ('Maximum 2 emails per lead to avoid spam.', 'outreach', 2);
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/admin-command-center/index.ts` | New edge function (replaces `admin-war-room`) |
| `supabase/functions/_shared/employeeState.ts` | Add `loadFounderDirectives()` and inject into `buildEmployeeContext()` |
| `src/components/admin/workforce/CommandCenterPanel.tsx` | New UI replacing `WarRoomPanel.tsx` |
| `src/components/AdminPanel.tsx` | Update import from WarRoomPanel to CommandCenterPanel |
| `src/components/admin/AdminSidebar.tsx` | Rename "War Room" to "Command Center" |
| Database migration | Create `founder_directives` table + seed data |
| `supabase/config.toml` | Add `admin-command-center` with `verify_jwt = false` |

## What This Fixes

| Problem | Fix |
|---------|-----|
| Employees keep suggesting Dubai/Singapore | Founder directives injected into every prompt |
| War Room has no memory | Past discussions loaded as context |
| Can't command employees directly | `@sales prospect X` syntax triggers real actions |
| Employees only run on cron | Direct command execution from Command Center |
| Instructions get forgotten | Persistent `founder_directives` table |

