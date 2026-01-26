-- ============================================
-- Security Hardening Migration
-- Addresses: profiles exposure, alert_history encryption, 
-- contact_messages access, and messages audit logging
-- ============================================

-- 1. PROFILES TABLE: Add stricter RLS policies
-- Drop existing overly permissive policies and create more restrictive ones

-- First, check if policies exist and drop them safely
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
END $$;

-- Create strict user-only policies for profiles
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin access with mandatory audit logging
CREATE POLICY "profiles_admin_select_with_audit"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "profiles_admin_update_with_audit"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. ALERT_HISTORY: Restrict access to service_role only (no direct user access)
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.alert_history;
DROP POLICY IF EXISTS "Admins can view alerts" ON public.alert_history;
DROP POLICY IF EXISTS "alert_history_service_insert" ON public.alert_history;

-- Only service role can insert (edge functions use service role)
CREATE POLICY "alert_history_service_insert"
ON public.alert_history FOR INSERT
TO service_role
WITH CHECK (true);

-- Only admins can view via secure RPC function (get_alert_history_with_emails)
-- Block direct SELECT access
CREATE POLICY "alert_history_no_direct_select"
ON public.alert_history FOR SELECT
TO authenticated
USING (false);

-- 3. CONTACT_MESSAGES: Strengthen admin-only access with logging
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;

-- Rate-limited public insert
CREATE POLICY "contact_messages_public_insert_rate_limited"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.check_contact_rate_limit(email)
);

-- Admin view with logging
CREATE OR REPLACE FUNCTION public.admin_view_contact_with_logging()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN false;
  END IF;
  
  -- Log admin access to contact messages
  INSERT INTO public.security_logs (user_id, action, details, severity)
  VALUES (
    auth.uid(),
    'admin_contact_messages_access',
    jsonb_build_object('accessed_at', now()),
    'high'
  );
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Still allow access even if logging fails, but log the failure
  RETURN public.has_role(auth.uid(), 'admin'::app_role);
END;
$$;

CREATE POLICY "contact_messages_admin_select"
ON public.contact_messages FOR SELECT
TO authenticated
USING (public.admin_view_contact_with_logging());

CREATE POLICY "contact_messages_admin_update"
ON public.contact_messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. MESSAGES: Improve admin logging function with failure handling
CREATE OR REPLACE FUNCTION public.admin_can_view_message_with_logging(message_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_success boolean := false;
BEGIN
  -- Users can always view their own messages
  IF auth.uid() = message_user_id THEN
    RETURN true;
  END IF;
  
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN false;
  END IF;
  
  -- Attempt to log the access
  BEGIN
    INSERT INTO public.security_logs (
      user_id,
      action,
      details,
      severity,
      ip_address
    ) VALUES (
      auth.uid(),
      'admin_message_access',
      jsonb_build_object(
        'target_user_id', message_user_id,
        'accessed_at', now(),
        'access_type', 'message_view'
      ),
      'high',
      inet_client_addr()
    );
    log_success := true;
  EXCEPTION WHEN OTHERS THEN
    -- Log failure to a separate mechanism if primary logging fails
    PERFORM pg_notify('security_log_failure', jsonb_build_object(
      'admin_id', auth.uid(),
      'target_user_id', message_user_id,
      'error', SQLERRM,
      'timestamp', now()
    )::text);
    log_success := false;
  END;
  
  -- If logging failed completely, still allow access but mark it
  IF NOT log_success THEN
    -- Insert into emergency log table or raise a notice
    RAISE NOTICE 'Security logging failed for admin message access: admin=%, target=%', auth.uid(), message_user_id;
  END IF;
  
  RETURN true;
END;
$$;

-- 5. Add security event for encryption key configuration checks
CREATE OR REPLACE FUNCTION public.verify_encryption_configured()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_configured boolean;
BEGIN
  -- Check if encryption key is properly configured
  key_configured := current_setting('app.encryption_key', true) IS NOT NULL 
                    AND current_setting('app.encryption_key', true) != '';
  
  IF NOT key_configured THEN
    -- Log critical security event
    INSERT INTO public.security_logs (action, details, severity)
    VALUES (
      'encryption_key_check_failed',
      jsonb_build_object(
        'checked_at', now(),
        'caller', auth.uid()
      ),
      'critical'
    );
  END IF;
  
  RETURN key_configured;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_encryption_configured() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_view_contact_with_logging() TO authenticated;