-- SECURITY FIX: Consolidate and Fix Profiles RLS Policies
-- Issue: Multiple RESTRICTIVE SELECT policies creating confusion and potential access issues
-- Solution: Replace with clear PERMISSIVE policies following principle of least privilege

-- Drop all existing profiles RLS policies
DROP POLICY IF EXISTS "Profiles restricted to own data only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- CREATE CLEAR, SECURE PERMISSIVE POLICIES

-- SELECT: Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- SELECT: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);

-- INSERT: Users can only create their own profile
CREATE POLICY "Users can create own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins can update any profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);

-- DELETE: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- DELETE: Admins can delete any profile
CREATE POLICY "Admins can delete all profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);

-- Add security audit log
INSERT INTO public.security_logs (
  action,
  details,
  severity
) VALUES (
  'profiles_rls_policies_consolidated',
  jsonb_build_object(
    'fix', 'Replaced multiple restrictive policies with clear permissive policies',
    'changes', ARRAY[
      'Removed redundant SELECT policies',
      'Created separate user and admin policies',
      'All policies now use PERMISSIVE mode (default)',
      'Proper isolation: users can only see their own profile data'
    ],
    'timestamp', now()
  ),
  'high'
);

-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.profiles IS 'User business profiles with RLS enforcing strict data isolation. Users can only access their own profile; admins can access all.';