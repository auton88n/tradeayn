-- Add DELETE policy for profiles table to complete RLS security coverage
-- This allows users to delete their own profiles and admins to delete any profile

CREATE POLICY "Users can delete own profile - authenticated only" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()));

CREATE POLICY "Admins can delete all profiles - authenticated only" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role));