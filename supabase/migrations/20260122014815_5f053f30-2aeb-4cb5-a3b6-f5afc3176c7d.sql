-- Drop overly permissive policies on internal system tables
DROP POLICY IF EXISTS "System can insert failures" ON public.llm_failures;
DROP POLICY IF EXISTS "System can insert usage" ON public.llm_usage_logs;

-- Create strict service_role only policies for llm_failures
CREATE POLICY "Only service role can insert failures" ON public.llm_failures
  FOR INSERT TO service_role WITH CHECK (true);

-- Create strict service_role only policies for llm_usage_logs  
CREATE POLICY "Only service role can insert usage" ON public.llm_usage_logs
  FOR INSERT TO service_role WITH CHECK (true);