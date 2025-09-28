-- Remove unused api_rate_limits table with security vulnerability
-- This table had an overly permissive RLS policy allowing unrestricted access

DROP POLICY IF EXISTS "System can manage API rate limits" ON public.api_rate_limits;
DROP TABLE IF EXISTS public.api_rate_limits;