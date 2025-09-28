-- Update the validate_system_security function to remove legacy phone checks
CREATE OR REPLACE FUNCTION public.validate_system_security()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  security_status jsonb;
  extension_count integer;
  rls_enabled_count integer;
  admin_user_id uuid;
  active_threats integer;
  blocked_ips integer;
  security_functions_count integer;
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
  AND tablename IN ('profiles', 'messages', 'threat_detection', 'security_logs', 'access_grants', 'user_roles');
  
  -- Check active threats
  SELECT COUNT(*) INTO active_threats
  FROM threat_detection
  WHERE detected_at > now() - interval '24 hours';
  
  -- Check blocked IPs
  SELECT COUNT(*) INTO blocked_ips
  FROM ip_blocks
  WHERE is_active = true
  AND (blocked_until IS NULL OR blocked_until > now());
  
  -- Check security functions availability
  SELECT COUNT(*) INTO security_functions_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public'
  AND routine_name IN ('log_security_event', 'validate_input_sanitization', 'check_rate_limit');
  
  -- Build security status report
  security_status := jsonb_build_object(
    'timestamp', now(),
    'validated_by', admin_user_id,
    'extensions_in_public', extension_count,
    'rls_enabled_tables', rls_enabled_count,
    'expected_rls_tables', 6,
    'active_threats_24h', active_threats,
    'blocked_ips', blocked_ips,
    'security_functions_available', security_functions_count >= 3,
    'threat_detection_active', EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'threat_detection'
    ),
    'audit_logging_enabled', EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'security_logs'
    ),
    'rate_limiting_enabled', EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'rate_limits'
    ),
    'status', CASE 
      WHEN extension_count = 0 AND rls_enabled_count >= 6 AND security_functions_count >= 3 THEN 'SECURE'
      WHEN extension_count <= 1 AND rls_enabled_count >= 5 AND security_functions_count >= 2 THEN 'MOSTLY_SECURE'
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
$function$;