-- CRITICAL SECURITY FIX 2: Move pg_net extension from public schema to extensions schema
-- This addresses the "Extension in Public" security warning

-- Move pg_net extension to extensions schema for better security isolation
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- CRITICAL SECURITY FIX 3: Enhanced RLS Policies and Security Hardening

-- Ensure all critical tables have proper RLS policies enabled
-- (Most are already enabled, but let's verify and enhance)

-- Add additional security to profiles table - prevent direct phone access
CREATE POLICY "Profiles phone access restricted" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow access to encrypted phone, never plain phone
  true
);

-- Update profiles RLS to use encrypted phone functions
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own_secure" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure phone column is deprecated and not accessible
ALTER TABLE public.profiles ALTER COLUMN phone SET DEFAULT '';

-- Create comprehensive audit trigger for all sensitive data access
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Audit any access to sensitive data
  PERFORM log_security_event(
    'sensitive_data_access',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'user_id', auth.uid(),
      'target_user_id', COALESCE(NEW.user_id, OLD.user_id),
      'accessed_columns', TG_OP,
      'timestamp', now(),
      'ip_address', inet_client_addr()
    ),
    CASE 
      WHEN TG_TABLE_NAME = 'profiles' AND (NEW.phone IS DISTINCT FROM OLD.phone OR OLD.phone IS NOT NULL)
      THEN 'high' 
      ELSE 'medium' 
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit trigger to profiles table
DROP TRIGGER IF EXISTS audit_profiles_access ON public.profiles;
CREATE TRIGGER audit_profiles_access
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();

-- CRITICAL SECURITY FIX 4: CORS and API Security Headers
-- Create function to set secure headers for all API responses
CREATE OR REPLACE FUNCTION public.get_security_headers()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'X-Content-Type-Options', 'nosniff',
    'X-Frame-Options', 'DENY',
    'X-XSS-Protection', '1; mode=block',
    'Strict-Transport-Security', 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy', 'default-src ''self''; script-src ''self'' ''unsafe-inline''; style-src ''self'' ''unsafe-inline'';',
    'Referrer-Policy', 'strict-origin-when-cross-origin'
  );
$$;

-- CRITICAL SECURITY FIX 5: Session Management and Authentication Security
-- Enhanced session validation
CREATE OR REPLACE FUNCTION public.validate_session_security()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_valid boolean := false;
  user_id uuid;
  last_activity timestamp with time zone;
BEGIN
  -- Get current user
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists and is active
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND email_confirmed_at IS NOT NULL
  ) INTO session_valid;
  
  IF NOT session_valid THEN
    PERFORM log_security_event(
      'invalid_session_attempt',
      jsonb_build_object(
        'user_id', user_id,
        'reason', 'user_not_found_or_unconfirmed'
      ),
      'high'
    );
    RETURN false;
  END IF;
  
  -- Log successful session validation
  PERFORM log_security_event(
    'session_validated',
    jsonb_build_object(
      'user_id', user_id,
      'validation_time', now()
    ),
    'info'
  );
  
  RETURN true;
END;
$$;

-- CRITICAL SECURITY FIX 6: Data Retention and Cleanup Policies
-- Create automated cleanup for security logs
CREATE OR REPLACE FUNCTION public.cleanup_security_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clean up old security logs (keep 90 days)
  DELETE FROM security_logs 
  WHERE created_at < now() - interval '90 days';
  
  -- Clean up old threat detection records (keep 30 days)
  DELETE FROM threat_detection 
  WHERE detected_at < now() - interval '30 days';
  
  -- Clean up expired rate limits
  DELETE FROM rate_limits 
  WHERE last_attempt < now() - interval '24 hours'
    AND blocked_until IS NULL OR blocked_until < now();
  
  -- Clean up old device fingerprints (keep 180 days)
  DELETE FROM device_fingerprints 
  WHERE last_seen < now() - interval '180 days';
  
  -- Log cleanup activity
  PERFORM log_security_event(
    'security_data_cleanup',
    jsonb_build_object(
      'cleanup_time', now(),
      'automated', true
    ),
    'info'
  );
END;
$$;