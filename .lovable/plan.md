

# Fix AI Workforce: Make Employees Actually Produce Results

## The Real Problem

The employees are running on schedule (crons are firing), but they either crash silently or return "nothing to do" because of 3 code bugs and missing data connections.

## Fixes (4 files)

### Fix 1: Sales Cron Handler (Critical)

**File:** `supabase/functions/ayn-sales-outreach/index.ts`

The cron sends `{"source": "cron"}` but the switch statement only handles `mode` values like `prospect`, `pipeline_status`, etc. When `mode` is undefined, it returns error 400.

**Change:** Add a cron/default handler that runs `pipeline_status` automatically and attempts autonomous prospecting if the pipeline is empty.

```text
switch (mode) {
  case 'prospect': ...
  case 'draft_email': ...
  ...
  default:
    // Cron mode: run pipeline check, log status
    if (source === 'cron' || !mode) {
      return await handleCronCycle(supabase);
    }
    return jsonResponse({ error: `Unknown mode: ${mode}` }, 400);
}
```

The `handleCronCycle` function will:
- Check the current pipeline via `handlePipelineStatus`
- Log the result to `ayn_activity_log`
- If pipeline is empty, log a reflection saying "no leads to work"

### Fix 2: Investigator Stuck Tasks

**File:** `supabase/functions/ayn-investigator/index.ts`

3 tasks from Feb 11-12 are stuck as `pending`. The investigator tries to process them every 6 hours but likely fails because `lead_id` values (`all`, `lead_rsp_dubai`, `9c1315ff`) don't match any real data, causing silent failures.

**Change:** Add error handling that marks failed tasks as `failed` instead of leaving them as `pending` forever, which creates an infinite retry loop.

```text
for (const task of pendingTasks || []) {
  try {
    const res = await investigateLead(...);
    const data = await res.json();
    results.push({ task_id: task.id, success: data.success });
  } catch (e) {
    // Mark as failed so it doesn't retry forever
    await supabase.from('employee_tasks').update({
      status: 'failed',
      output_data: { error: e.message }
    }).eq('id', task.id);
    results.push({ task_id: task.id, error: e.message });
  }
}
```

### Fix 3: Advisor Activation Gap

**File:** `supabase/functions/ayn-advisor/index.ts`

The Advisor requires 3+ entries with `type = 'employee_report'` in `ayn_mind`. But no other employee writes entries with that type -- they use types like `marketing_ayn`, `telegram_ayn`, etc. So the Advisor's filter never finds data and early-returns with "Not enough reports."

**Change:** Broaden the query to look at recent activity from all employees instead of only `employee_report` type:

```text
// Instead of looking for type='employee_report' only:
const { data: reports } = await supabase
  .from('ayn_activity_log')
  .select('action_type, summary, triggered_by, created_at')
  .gte('created_at', ago24h)
  .not('triggered_by', 'eq', 'advisor')
  .order('created_at', { ascending: false })
  .limit(30);

if (!reports?.length || reports.length < 5) {
  return ... 'Not enough activity to synthesize yet.';
}
```

### Fix 4: Mark Stuck Tasks as Failed (Data cleanup)

Run SQL to unstick the 3 permanently-pending tasks:

```sql
UPDATE employee_tasks
SET status = 'failed',
    output_data = '{"error": "lead_id not found in system"}'::jsonb
WHERE status = 'pending'
  AND created_at < now() - interval '24 hours';
```

## Files Changed

| File | What Changes |
|------|-------------|
| `supabase/functions/ayn-sales-outreach/index.ts` | Add cron/default handler that runs pipeline check autonomously |
| `supabase/functions/ayn-investigator/index.ts` | Mark failed tasks as `failed` instead of leaving them `pending` |
| `supabase/functions/ayn-advisor/index.ts` | Broaden data source from `employee_report` type to `ayn_activity_log` |
| Database (SQL) | Clean up 3 stuck `pending` tasks |

## What Does NOT Change
- No new edge functions
- No schema changes
- No new dependencies
- Telegram and Admin Panel workflows stay the same

## Expected Result After Fix
- **Sales** will log pipeline status every 6 hours autonomously
- **Investigator** won't get stuck on bad tasks anymore
- **Advisor** will synthesize actual employee activity into strategic memos
- All results visible in both Admin Panel (AYN Activity Log) and Telegram (if configured)

## Answer: Telegram vs Admin Panel
- **Telegram** = best for giving commands and chatting with AYN (it already works well)
- **Admin Panel** = best for monitoring the workforce dashboard, activity logs, and war room
- Use both -- they serve different purposes
