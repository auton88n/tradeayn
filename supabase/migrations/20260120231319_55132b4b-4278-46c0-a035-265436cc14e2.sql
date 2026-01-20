-- Fix overly permissive RLS policies by replacing 'true' conditions with service role checks

-- 1. Fix admin_notification_log - service role only for inserts
DROP POLICY IF EXISTS "Service role can insert notification logs" ON public.admin_notification_log;
CREATE POLICY "Service role can insert notification logs" ON public.admin_notification_log
  FOR INSERT WITH CHECK (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- 2. Fix api_rate_limits - service role for management
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.api_rate_limits;
CREATE POLICY "Service role can manage rate limits" ON public.api_rate_limits
  FOR ALL USING (
    (SELECT auth.jwt()->>'role') = 'service_role'
  ) WITH CHECK (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- 3. Fix llm_failures - service role only for inserts
DROP POLICY IF EXISTS "Service role can insert failures" ON public.llm_failures;
CREATE POLICY "Service role can insert failures" ON public.llm_failures
  FOR INSERT WITH CHECK (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- 4. Fix llm_usage_logs - service role only for inserts
DROP POLICY IF EXISTS "Service role can insert usage logs" ON public.llm_usage_logs;
CREATE POLICY "Service role can insert usage logs" ON public.llm_usage_logs
  FOR INSERT WITH CHECK (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- 5. Fix rate_limits - service role for management
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
  FOR ALL USING (
    (SELECT auth.jwt()->>'role') = 'service_role'
  ) WITH CHECK (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- 6. Fix security_logs - service role only for inserts
DROP POLICY IF EXISTS "Service role can insert security logs" ON public.security_logs;
CREATE POLICY "Service role can insert security logs" ON public.security_logs
  FOR INSERT WITH CHECK (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- 7. Fix webhook_rate_limits - service role for management
DROP POLICY IF EXISTS "Service role can manage webhook rate limits" ON public.webhook_rate_limits;
CREATE POLICY "Service role can manage webhook rate limits" ON public.webhook_rate_limits
  FOR ALL USING (
    (SELECT auth.jwt()->>'role') = 'service_role'
  ) WITH CHECK (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );