-- Fix remaining security issues

-- Add proper SELECT policy for security_logs (only admins should read security logs)
CREATE POLICY "Only admins can view security logs" 
ON public.security_logs 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure profiles table has the most restrictive policies
-- Drop the potentially conflicting anonymous blocking policy and replace with more specific ones
DROP POLICY IF EXISTS "Block all anonymous access to profiles" ON public.profiles;

-- Add explicit blocking for anonymous users on each operation
CREATE POLICY "Block anonymous SELECT on profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);

CREATE POLICY "Block anonymous INSERT on profiles" 
ON public.profiles 
FOR INSERT 
TO anon 
WITH CHECK (false);

CREATE POLICY "Block anonymous UPDATE on profiles" 
ON public.profiles 
FOR UPDATE 
TO anon 
USING (false)
WITH CHECK (false);

CREATE POLICY "Block anonymous DELETE on profiles" 
ON public.profiles 
FOR DELETE 
TO anon 
USING (false);

-- Log the security improvements
SELECT log_security_event(
  'security_final_hardening',
  jsonb_build_object(
    'action', 'completed_security_hardening',
    'tables_secured', array['profiles', 'security_logs'],
    'description', 'Applied comprehensive RLS policies and blocked all anonymous access'
  ),
  'high'
);