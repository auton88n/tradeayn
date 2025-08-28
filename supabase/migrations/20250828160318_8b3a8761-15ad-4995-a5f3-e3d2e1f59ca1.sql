-- Fix critical database relationship issue
-- The usage_logs table needs proper policies to avoid conflicts

-- Remove conflicting usage logs policy
DROP POLICY IF EXISTS "System functions can insert usage logs" ON public.usage_logs;

-- Keep only the user-specific policy for usage logs
-- This ensures users can only insert their own usage logs

-- Fix system reports to be more restrictive
DROP POLICY IF EXISTS "System can insert reports" ON public.system_reports;

-- Create a more restrictive policy for system reports
CREATE POLICY "Only admin can insert system reports" 
ON public.system_reports 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);