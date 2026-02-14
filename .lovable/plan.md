
# Fix All AI Employee Issues

## 1. Fix `ayn_mind` Type Constraint (Root Cause of Silent Failures)

The `ayn_mind_type_check` constraint only allows 16 types but agents are trying to insert `employee_report`, `innovation_proposal`, `employee_discussion`, and others. Every insert silently fails.

**Fix:** Drop and recreate the constraint with all needed types:

```sql
ALTER TABLE ayn_mind DROP CONSTRAINT ayn_mind_type_check;
ALTER TABLE ayn_mind ADD CONSTRAINT ayn_mind_type_check CHECK (type = ANY (ARRAY[
  'thought', 'observation', 'idea', 'task', 'mood', 'trend',
  'telegram_admin', 'telegram_ayn', 'sales_lead', 'sales_draft',
  'vision_analysis', 'proactive_research', 'telegram_summary',
  'marketing_chat', 'marketing_ayn', 'marketing_summary',
  'employee_report', 'innovation_proposal', 'employee_discussion',
  'strategic_advisory', 'security_alert', 'proactive_alert'
]));
```

This unblocks QA Watchdog, Security Guard, Innovation, Advisor, and all other agents from saving their reports.

## 2. Fix Health Check False Positives

**File:** `supabase/functions/ayn-qa-watchdog/index.ts`

Change the health check threshold from `>= 500` to `>= 400`. Currently `support-bot` and `ayn-unified` return 400 errors during pings but get marked as "healthy." This gives false 100% uptime.

```
// Before
if (statusCode >= 500) { isHealthy = false; }

// After  
if (statusCode >= 400) { isHealthy = false; }
```

## 3. Unstick Investigator's Pending Tasks

3 tasks have been stuck as `pending` since Feb 11-12. Two have invalid `lead_id` values (`all`, `lead_rsp_dubai`) that will never resolve. Mark them as `failed` with an explanation so the Investigator stops retrying them:

```sql
UPDATE employee_tasks 
SET status = 'failed', 
    output_data = '{"error": "Invalid lead_id, marked failed during cleanup"}'
WHERE status = 'pending' 
  AND to_employee = 'investigator';
```

## Summary

Three changes total:
1. **Database migration** -- Expand `ayn_mind_type_check` constraint (unblocks all agent reporting)
2. **Edge function edit** -- Fix QA Watchdog health threshold from 500 to 400 (accurate health data)
3. **Data update** -- Mark 3 stuck Investigator tasks as failed (clears the queue)
