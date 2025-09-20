-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests 
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule resource monitor to run every hour
SELECT cron.schedule(
  'resource-monitor-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/resource-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
        body:=concat('{"scheduled": true, "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create helper functions for resource monitoring
CREATE OR REPLACE FUNCTION public.get_database_size_mb()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(pg_database_size(current_database()) / (1024 * 1024), 0);
$$;

CREATE OR REPLACE FUNCTION public.get_active_connections()
RETURNS integer  
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*), 0)::integer 
  FROM pg_stat_activity 
  WHERE state = 'active' AND pid != pg_backend_pid();
$$;