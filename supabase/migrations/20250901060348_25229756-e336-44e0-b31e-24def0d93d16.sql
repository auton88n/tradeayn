-- First, let's ensure that anonymous users cannot access profiles at all
-- and tighten up the existing policies

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create more secure policies that explicitly check authentication
-- Policy for users to view only their own profile (authenticated users only)
CREATE POLICY "Users can view own profile - authenticated only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Policy for admins to view all profiles (authenticated admins only)
CREATE POLICY "Admins can view all profiles - authenticated only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Policy for users to insert their own profile (authenticated users only)
CREATE POLICY "Users can insert own profile - authenticated only" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Policy for users to update their own profile (authenticated users only)
CREATE POLICY "Users can update own profile - authenticated only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Ensure no DELETE operations are allowed (profiles should never be deleted)
-- No policy = no access for DELETE operations

-- Add additional security: revoke all public access to profiles table
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Grant specific permissions only to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Ensure RLS is enabled (double-check)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (extra security)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;