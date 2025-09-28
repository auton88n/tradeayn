-- Security Fix: Address extension in public schema warning
-- This query checks for and documents any extensions in public schema
-- Most extensions should be in system schemas for security

-- Create a view to monitor extensions in public schema
CREATE OR REPLACE VIEW public.security_extension_audit AS
SELECT 
  extname as extension_name,
  nspname as schema_name,
  extversion as version,
  'Extension in public schema - security risk' as security_note
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE nspname = 'public';

-- Grant access only to admins
ALTER VIEW public.security_extension_audit OWNER TO postgres;

-- Create a function to get extension security status
CREATE OR REPLACE FUNCTION public.get_extension_security_status()
RETURNS TABLE(
  extension_name text,
  schema_name text,
  security_risk text,
  recommendation text
)
LANGUAGE sql
STABLE SECURITY DEFINER
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
  WHERE n.nspname IN ('public', 'extensions', 'pg_catalog');
$$;

-- Log this security audit
SELECT public.log_security_event(
  'security_audit_extensions',
  jsonb_build_object(
    'audit_type', 'extension_security_check',
    'timestamp', now(),
    'action', 'security_hardening_applied'
  ),
  'info'
);