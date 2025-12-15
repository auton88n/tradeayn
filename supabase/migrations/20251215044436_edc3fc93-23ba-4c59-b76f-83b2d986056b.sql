-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create daily report cron job at 8:00 AM UTC
SELECT cron.schedule(
  'ayn-daily-report',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/admin-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body := '{"type": "daily_report"}'::jsonb
  ) AS request_id;
  $$
);