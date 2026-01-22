-- =====================================================
-- SECURITY FIX: Fix remaining RLS policy vulnerabilities
-- =====================================================

-- 1. Fix device_fingerprints - ensure no anonymous access and proper user isolation
DROP POLICY IF EXISTS "Block anonymous device_fingerprints access" ON public.device_fingerprints;
DROP POLICY IF EXISTS "Users can view own fingerprints" ON public.device_fingerprints;
DROP POLICY IF EXISTS "Users can insert own fingerprints" ON public.device_fingerprints;
DROP POLICY IF EXISTS "Users can update own fingerprints" ON public.device_fingerprints;

-- Only authenticated users can view their own device fingerprints
CREATE POLICY "Users can view own fingerprints" 
ON public.device_fingerprints 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only authenticated users can insert their own device fingerprints
CREATE POLICY "Users can insert own fingerprints" 
ON public.device_fingerprints 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can update their own device fingerprints
CREATE POLICY "Users can update own fingerprints" 
ON public.device_fingerprints 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can view all for security monitoring
CREATE POLICY "Admins can view all fingerprints" 
ON public.device_fingerprints 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix contact_messages - add explicit SELECT restriction to admins only
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Block public reads on contact_messages" ON public.contact_messages;

-- Only admins can view contact messages (protects email addresses)
CREATE POLICY "Only admins can view contact messages" 
ON public.contact_messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update contact messages (for status changes)
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages" 
ON public.contact_messages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));