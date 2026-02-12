
-- Enable pg_cron and pg_net if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- QA Watchdog - every 15 min (offset :3)
SELECT cron.schedule(
  'ayn-qa-watchdog-loop',
  '3,18,33,48 * * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-qa-watchdog',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Security Guard - every 30 min (offset :7)
SELECT cron.schedule(
  'ayn-security-guard-loop',
  '7,37 * * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-security-guard',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Chief of Staff - every 2 hours (offset :12)
SELECT cron.schedule(
  'ayn-chief-of-staff-loop',
  '12 */2 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-chief-of-staff',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Sales Outreach - every 6 hours (offset :5)
SELECT cron.schedule(
  'ayn-sales-outreach-loop',
  '5 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-sales-outreach',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Follow-Up Agent - every 6 hours (offset :15)
SELECT cron.schedule(
  'ayn-follow-up-agent-loop',
  '15 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-follow-up-agent',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Marketing Proactive Loop - every 6 hours (offset :25)
SELECT cron.schedule(
  'ayn-marketing-loop',
  '25 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-marketing-proactive-loop',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Advisor - every 8 hours (offset :20)
SELECT cron.schedule(
  'ayn-advisor-loop',
  '20 */8 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-advisor',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Customer Success - every 6 hours (offset :35)
SELECT cron.schedule(
  'ayn-customer-success-loop',
  '35 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-customer-success',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Investigator - every 6 hours (offset :40)
SELECT cron.schedule(
  'ayn-investigator-loop',
  '40 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-investigator',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Lawyer - every 24 hours at 6:00 AM
SELECT cron.schedule(
  'ayn-lawyer-loop',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-lawyer',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Outcome Evaluator - every 6 hours (offset :50)
SELECT cron.schedule(
  'ayn-outcome-evaluator-loop',
  '50 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-outcome-evaluator',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);
