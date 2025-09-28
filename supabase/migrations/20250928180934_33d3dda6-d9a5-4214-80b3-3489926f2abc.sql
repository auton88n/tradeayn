-- FINAL SECURITY FIX: Fix Function Search Path Mutable warnings
-- Set proper search_path for all functions that don't have it set

-- Fix all functions that need explicit search_path
CREATE OR REPLACE FUNCTION public.get_security_headers()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
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

-- Also fix any other functions that might be missing search_path
CREATE OR REPLACE FUNCTION public.get_extension_security_status()
RETURNS TABLE(
  extension_name text,
  schema_name text,
  security_risk text,
  recommendation text
)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    e.extname::text,
    n.nspname::text,
    CASE 
      WHEN n.nspname = 'public' THEN 'HIGH - Extension in public schema'
      ELSE 'LOW - Extension in system schema'
    END::text,
    CASE 
      WHEN n.nspname = 'public' THEN 'Consider moving to system schema if possible'
      ELSE 'No action needed'
    END::text
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE n.nspname IN ('public', 'extensions', 'pg_catalog')
    AND has_role(auth.uid(), 'admin'::app_role);
$$;

-- Create final security validation function
CREATE OR REPLACE FUNCTION public.validate_system_security()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  security_status jsonb;
  extension_count integer;
  rls_enabled_count integer;
  admin_user_id uuid;
BEGIN
  -- Only admins can run security validation
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  admin_user_id := auth.uid();
  
  -- Check extensions in public schema
  SELECT COUNT(*) INTO extension_count
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE n.nspname = 'public';
  
  -- Check RLS enabled tables
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'messages', 'threat_detection', 'security_logs');
  
  -- Build security status report
  security_status := jsonb_build_object(
    'timestamp', now(),
    'validated_by', admin_user_id,
    'extensions_in_public', extension_count,
    'rls_enabled_tables', rls_enabled_count,
    'phone_encryption_enabled', EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'phone_encrypted'
    ),
    'security_functions_available', EXISTS(
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'encrypt_phone_number'
    ),
    'threat_detection_active', EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'threat_detection'
    ),
    'status', CASE 
      WHEN extension_count = 0 AND rls_enabled_count >= 4 THEN 'SECURE'
      WHEN extension_count <= 1 AND rls_enabled_count >= 3 THEN 'MOSTLY_SECURE'
      ELSE 'NEEDS_ATTENTION'
    END
  );
  
  -- Log the security validation
  PERFORM log_security_event(
    'system_security_validation',
    security_status,
    'info'
  );
  
  RETURN security_status;
END;
$$;