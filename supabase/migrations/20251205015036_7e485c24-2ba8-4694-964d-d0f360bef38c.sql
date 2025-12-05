-- Drop the broken restrictive policy that blocks ALL users from accessing profiles
-- This policy had "Using Expression: false" which blocked everyone including authenticated users
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;