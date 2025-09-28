-- CRITICAL SECURITY FIX: Fix Profile Data Breach
-- Change RLS policy from 'true' to proper user ownership check
DROP POLICY IF EXISTS "Profiles phone access restricted" ON public.profiles;

CREATE POLICY "Profiles restricted to own data only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- SECURITY FIX: Restrict Performance Metrics to Admin Only  
DROP POLICY IF EXISTS "System can insert performance metrics" ON public.performance_metrics;

CREATE POLICY "Only admins can insert performance metrics" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- CLEANUP: Remove unused phone infrastructure
-- Drop phone columns since we don't use phone numbers
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_encrypted;

-- Remove phone-related functions
DROP FUNCTION IF EXISTS public.encrypt_phone_number(text);
DROP FUNCTION IF EXISTS public.decrypt_phone_number(text);
DROP FUNCTION IF EXISTS public.get_phone_number_secure(uuid);
DROP FUNCTION IF EXISTS public.update_phone_number_secure(uuid, text);
DROP FUNCTION IF EXISTS public.get_profile_phone_secure(uuid);

-- Remove phone-related triggers if any exist
DROP TRIGGER IF EXISTS validate_profile_security ON public.profiles;
DROP TRIGGER IF EXISTS enhanced_profile_security_validation ON public.profiles;