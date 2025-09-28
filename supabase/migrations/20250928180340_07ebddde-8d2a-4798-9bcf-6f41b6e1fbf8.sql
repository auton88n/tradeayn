-- Fix security definer view issue by converting to function
DROP VIEW IF EXISTS public.security_extension_audit;

-- Replace the view with a security definer function that admins can call
CREATE OR REPLACE FUNCTION public.get_security_extension_audit()
RETURNS TABLE(
  extension_name text,
  schema_name text,
  version text,
  security_note text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    e.extname::text,
    n.nspname::text,
    e.extversion::text,
    'Extension in public schema - security risk'::text
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE n.nspname = 'public'
    AND has_role(auth.uid(), 'admin'::app_role);
$$;