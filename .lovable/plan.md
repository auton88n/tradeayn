# Get Your AI Workforce Actually Running

## The Core Problem

All 13 agents exist as code but none of them run. There's only 1 cron job (`ayn-proactive-loop` every 6 hours) and even that shows no logs -- meaning it either fails silently or has never been triggered by the cron scheduler. The individual agent functions (QA Watchdog, Security Guard, Chief of Staff, etc.) have zero cron jobs of their own.

## The Fix: Wire Up the Autonomous Loops

### Step 1: Fix the existing cron job

The `ayn-proactive-loop` cron (job #3) uses the **anon key** for authorization. Edge functions that use `SUPABASE_SERVICE_ROLE_KEY` internally won't accept anon-key requests unless they skip JWT verification. We need to verify the `config.toml` settings and ensure the cron calls use the correct authorization.

### Step 2: Add missing cron jobs for each agent

Create `pg_cron` schedules matching the V2 architecture:

```text
Every 15 min  -- ayn-qa-watchdog (health checks)
Every 30 min  -- ayn-security-guard (threat scans)
Every 2 hours -- ayn-chief-of-staff (alignment + decay cycle)
Every 6 hours -- ayn-proactive-loop (already exists, fix auth)
Every 6 hours -- ayn-sales-outreach (pipeline sweep)
Every 6 hours -- ayn-follow-up-agent (follow-up checks)
Every 6 hours -- ayn-marketing-proactive-loop (content strategy)
Every 8 hours -- ayn-advisor (strategic synthesis)
Every 12 hours -- ayn-innovation (experiment proposals)
Every 12 hours -- ayn-hr-manager (performance review)
Every 24 hours -- ayn-lawyer (compliance scan)
Every 6 hours -- ayn-outcome-evaluator (failure memory)
```

### Step 3: Fix the War Room to show all 13 agents with concise replies

While the cron jobs are the real fix for autonomous work, the War Room also needs the previously approved changes:

- Add all 13 agents (currently missing `investigator`, `follow_up`, `hr_manager`)
- Use stripped-down one-line role descriptions instead of the 200-word personality dump
- Use system/user message split for better instruction following
- Set `max_tokens: 60` to physically prevent paragraphs
- Executive + Strategic layers always participate; Operational agents selected by relevance + random fill

### Step 4: Verify edge function deployment

Check that all 13 agent edge functions are actually deployed and accessible. If any fail to deploy, they'll silently do nothing when cron triggers them.

## Technical Changes

### Database Migration (SQL)

Add 11 new `pg_cron` jobs using `cron.schedule()` with `net.http_post()` calls to each agent's edge function endpoint, using the service role key for authorization.

### File: `supabase/functions/admin-war-room/index.ts`

- Replace `FULL_ROSTER` (10 agents) with 3-layer roster (all 13)
- Add `WAR_ROOM_ROLES` map with one-line descriptions
- Remove `getEmployeePersonality` import
- Use system + user message split
- Set `max_tokens: 60`
- Executive + Strategic always join; fill Operational by relevance up to 8-10 total

### File: `supabase/config.toml`

- Verify all agent functions have `verify_jwt = false` so cron calls work

### No new files needed

All agent edge functions already exist. We're just wiring them up to run automatically.

## Expected Outcome

After this:

- QA Watchdog pings health every 15 minutes -- you'll see `system_health_checks` filling up
- Security Guard scans for threats every 30 minutes
- Chief of Staff runs alignment every 2 hours, decaying stale trust scores
- Sales hunts leads every 6 hours, drafts emails, queues follow-ups
- The `employee_states` table will start showing real confidence changes, action counts, and peer trust shifts
- `employee_reflections` will fill with post-action reasoning
- The Activity Log in your admin panel will light up with real autonomous actions
- The War Room will show all 13 agents debating concisely when you ask them to  
  
⚠️ Things to double-check / potential pitfalls
  1. **Cron timing collisions**
    - Several 6-hour jobs may run simultaneously (e.g., sales, follow-up, marketing, outcome evaluator).
    - Supabase edge functions are generally stateless and parallelizable, but consider staggering by a few minutes to avoid burst load spikes.
  2. **Service role key safety**
    - Make sure the service role key is never exposed in client code.
    - If any function is publicly callable with anon key, cron-triggered updates might fail.
  3. **War Room max_tokens limit**
    - 60 tokens per agent is very tight.
    - It’s fine for concise debate, but make sure no critical reasoning is truncated.
    - You might need 80–100 tokens for strategic layers if doctrine/alignment context is included.
  4. **Logging / monitoring**
    - Ensure each cron call logs success/failure.
    - Without logs, a silent failure will look “active” in cron schedule but never populate reflections.
  5. **Edge function deployment**
    - Confirm all 13 agents are actually deployed; missing deployments = silent no-op.
    - Use `supabase functions list` and manual test ping endpoints.
  6. **Failure recovery**
    - If QA Watchdog or Outcome Evaluator fails, other agents may operate on stale data.
    - Consider adding a simple retry/backoff or alerting for critical cron failures.
  ---
  ## ⚡ Optional Enhancements
  - **Randomize Operational agent selection** in War Room slightly each cycle to simulate emergent behavior.
  - **Stagger cron jobs** for high-frequency agents (QA, Security) to reduce server pressure.
  - **Quick debug endpoint**: temporarily expose `/status` on each agent to confirm cron-triggered execution.