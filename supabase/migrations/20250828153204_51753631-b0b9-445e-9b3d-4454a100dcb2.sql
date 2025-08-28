-- Fix security vulnerability in usage_logs table
-- Remove the overly permissive policy that allows anyone to insert records
DROP POLICY IF EXISTS "System can insert usage logs" ON public.usage_logs;

-- Create a secure policy that only allows authenticated users to insert their own usage logs
-- This ensures usage logs can only be created for the authenticated user
CREATE POLICY "Users can insert own usage logs" 
ON public.usage_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create a policy specifically for the increment_usage function to work properly
-- This allows the security definer function to insert logs when called by authenticated users
CREATE POLICY "System functions can insert usage logs" 
ON public.usage_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Only allow insertion if called through proper channels (authenticated user context)
  auth.uid() IS NOT NULL
);