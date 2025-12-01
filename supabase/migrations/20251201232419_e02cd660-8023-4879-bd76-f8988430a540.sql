-- Fix RLS policies for rate_limits, security_logs, and webhook_rate_limits tables
-- Drop ALL existing policies first, then create secure ones

-- ===== 1. Fix rate_limits table =====
DROP POLICY IF EXISTS "Users can manage their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can view own rate limits" ON public.rate_limits;

-- Create restricted policies (SELECT and INSERT only - no DELETE/UPDATE)
CREATE POLICY "Users can view own rate limits"
  ON public.rate_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert rate limit records"
  ON public.rate_limits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all rate limits (for edge functions)
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===== 2. Fix security_logs table =====
-- Remove user INSERT capability (only service_role should insert audit logs)
DROP POLICY IF EXISTS "Authenticated users can insert their own security logs" ON public.security_logs;
-- Keep the admin SELECT policy
-- DROP POLICY IF EXISTS "Only admins can view security logs" ON public.security_logs;

-- Service role can insert security logs (for edge functions and system)
CREATE POLICY "Service role can insert security logs"
  ON public.security_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ===== 3. Fix webhook_rate_limits table =====
DROP POLICY IF EXISTS "Users can manage their own webhook rate limits" ON public.webhook_rate_limits;

-- Create restricted policies (SELECT and INSERT only - no DELETE/UPDATE)
CREATE POLICY "Users can view webhook rate limits"
  ON public.webhook_rate_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert webhook rate limits"
  ON public.webhook_rate_limits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all webhook rate limits (for edge functions)
CREATE POLICY "Service role can manage webhook rate limits"
  ON public.webhook_rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);