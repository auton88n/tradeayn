-- Fix the audit_sensitive_data_access function that references non-existent phone column
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'medium'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;