-- Drop existing policies to recreate them with stronger security
DROP POLICY IF EXISTS "Admins can delete all profiles - authenticated only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles - authenticated only" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile - authenticated only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile - authenticated only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile - authenticated only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile - authenticated only" ON public.profiles;

-- Create comprehensive RLS policies with explicit authentication checks
-- Policy for users to view their own profile
CREATE POLICY "Users can view own profile - strict auth required" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles - strict auth required" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert own profile - strict auth required" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile - strict auth required" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Policy for users to delete their own profile
CREATE POLICY "Users can delete own profile - strict auth required" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Policy for admins to delete any profile
CREATE POLICY "Admins can delete all profiles - strict auth required" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure no anonymous access at all
CREATE POLICY "Block all anonymous access to profiles" 
ON public.profiles 
FOR ALL 
TO anon 
USING (false);

-- Log this security fix
SELECT log_security_event(
  'security_policy_update',
  jsonb_build_object(
    'table', 'profiles',
    'action', 'strengthened_rls_policies',
    'description', 'Enhanced authentication requirements and blocked anonymous access'
  ),
  'high'
);