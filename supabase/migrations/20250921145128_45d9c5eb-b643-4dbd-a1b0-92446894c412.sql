-- CRITICAL SECURITY FIX: Clean up duplicate and conflicting RLS policies on profiles table

-- First, drop all existing policies on profiles table
DROP POLICY IF EXISTS "Admins can delete all profiles - strict auth required" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles - strict auth required" ON public.profiles;
DROP POLICY IF EXISTS "Strict admin access for profiles DELETE" ON public.profiles;
DROP POLICY IF EXISTS "Strict admin access for profiles SELECT" ON public.profiles;
DROP POLICY IF EXISTS "Strict user isolation for profiles DELETE" ON public.profiles;
DROP POLICY IF EXISTS "Strict user isolation for profiles INSERT" ON public.profiles;
DROP POLICY IF EXISTS "Strict user isolation for profiles SELECT" ON public.profiles;
DROP POLICY IF EXISTS "Strict user isolation for profiles UPDATE" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile - strict auth required" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile - strict auth required" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile - strict auth required" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile - strict auth required" ON public.profiles;

-- Create clean, non-conflicting RLS policies
-- Policy 1: Users can only view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can only insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can only update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can only delete their own profile
CREATE POLICY "profiles_delete_own" ON public.profiles
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy 5: Admins can view all profiles
CREATE POLICY "profiles_admin_select_all" ON public.profiles
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy 6: Admins can manage all profiles
CREATE POLICY "profiles_admin_manage_all" ON public.profiles
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure RLS is enabled (should already be enabled but double-check)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;