-- Remove cost tracking and resource monitoring tables and functions

-- Drop tables
DROP TABLE IF EXISTS public.ai_cost_tracking;
DROP TABLE IF EXISTS public.cost_thresholds;
DROP TABLE IF EXISTS public.resource_usage;

-- Drop related functions
DROP FUNCTION IF EXISTS public.track_user_cost(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.get_database_size_mb();
DROP FUNCTION IF EXISTS public.get_active_connections();

-- Remove any cron jobs for resource monitoring (if they exist)
SELECT cron.unschedule('resource-monitor-job') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'resource-monitor-job'
);