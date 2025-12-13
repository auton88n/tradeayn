-- Fix the enhanced_profile_security_validation function by removing references to non-existent business_context column
CREATE OR REPLACE FUNCTION public.enhanced_profile_security_validation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log all profile operations for security monitoring
  PERFORM public.log_profiles_sensitive_access(
    TG_OP,
    COALESCE(NEW.user_id, OLD.user_id),
    CASE TG_OP
      WHEN 'INSERT' THEN ARRAY['company_name', 'contact_person', 'business_type']
      WHEN 'UPDATE' THEN ARRAY(
        SELECT unnest(ARRAY['company_name', 'contact_person', 'business_type'])
        WHERE (OLD.company_name IS DISTINCT FROM NEW.company_name) OR
              (OLD.contact_person IS DISTINCT FROM NEW.contact_person) OR
              (OLD.business_type IS DISTINCT FROM NEW.business_type)
      )
      ELSE NULL
    END,
    jsonb_build_object(
      'authenticated_user', auth.uid(),
      'is_admin', has_role(auth.uid(), 'admin'::app_role),
      'is_own_profile', auth.uid() = COALESCE(NEW.user_id, OLD.user_id)
    )
  );

  -- Enhanced validation for INSERT/UPDATE operations
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Validate company name
    IF NEW.company_name IS NOT NULL THEN
      IF length(NEW.company_name) > 200 THEN
        RAISE EXCEPTION 'Company name exceeds maximum length (200 characters)';
      END IF;
      
      IF NOT public.validate_input_sanitization(NEW.company_name) THEN
        PERFORM public.log_security_event(
          'malicious_input_blocked',
          jsonb_build_object(
            'field', 'company_name',
            'user_id', NEW.user_id,
            'blocked_content', left(NEW.company_name, 100)
          ),
          'high'
        );
        RAISE EXCEPTION 'Invalid characters detected in company name';
      END IF;
    END IF;

    -- Validate contact person
    IF NEW.contact_person IS NOT NULL THEN
      IF length(NEW.contact_person) > 100 THEN
        RAISE EXCEPTION 'Contact person name exceeds maximum length (100 characters)';
      END IF;
      
      IF NOT public.validate_input_sanitization(NEW.contact_person) THEN
        PERFORM public.log_security_event(
          'malicious_input_blocked',
          jsonb_build_object(
            'field', 'contact_person',
            'user_id', NEW.user_id,
            'blocked_content', left(NEW.contact_person, 100)
          ),
          'high'
        );
        RAISE EXCEPTION 'Invalid characters detected in contact person name';
      END IF;
    END IF;

    -- Note: business_context_encrypted is already encrypted, no text validation needed
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;