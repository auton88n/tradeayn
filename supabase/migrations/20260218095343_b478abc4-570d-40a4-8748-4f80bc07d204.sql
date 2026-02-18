
SELECT cron.schedule(
  'ayn-daily-snapshot',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-daily-snapshot',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
