-- SECURITY FIX 1: Remove plaintext email column from alert_history
-- This eliminates the critical email exposure vulnerability
ALTER TABLE public.alert_history DROP COLUMN IF EXISTS recipient_email;

-- Add comment to document the security fix
COMMENT ON TABLE public.alert_history IS 'Alert history with encrypted email storage only. Use get_alert_history_with_emails() function to access decrypted emails (admin only).';

-- SECURITY FIX 2: Update create_system_alert function to only use encrypted email
CREATE OR REPLACE FUNCTION public.create_system_alert(
  p_alert_type text, 
  p_recipient_email text, 
  p_subject text, 
  p_content text, 
  p_user_id uuid DEFAULT NULL::uuid, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  alert_id uuid;
  encryption_key text;
BEGIN
  -- Get encryption key from environment or use default
  encryption_key := current_setting('app.email_encryption_key', true);
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'CHANGE_THIS_IN_PRODUCTION_USE_SECRET';
  END IF;

  -- Insert with encrypted email only (removed plaintext column)
  INSERT INTO public.alert_history (
    alert_type,
    recipient_email_encrypted,
    subject,
    content,
    user_id,
    metadata,
    status
  ) VALUES (
    p_alert_type,
    public.encrypt_email(p_recipient_email, encryption_key),
    p_subject,
    p_content,
    p_user_id,
    p_metadata,
    'sent'
  ) RETURNING id INTO alert_id;
  
  -- Log alert creation without exposing email
  PERFORM public.log_security_event(
    'system_alert_created',
    jsonb_build_object(
      'alert_id', alert_id,
      'alert_type', p_alert_type,
      'created_via', 'system_function'
    ),
    'info'
  );
  
  RETURN alert_id;
END;
$function$;

-- SECURITY FIX 3: Remove phone validation from profile triggers
-- Drop ALL existing profile triggers and functions
DROP TRIGGER IF EXISTS profile_security_trigger ON public.profiles;
DROP TRIGGER IF EXISTS profile_enhanced_security_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.validate_profile_security() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_data_validation() CASCADE;

-- Create enhanced validation function without phone field references
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
      WHEN 'INSERT' THEN ARRAY['company_name', 'contact_person', 'business_type', 'business_context']
      WHEN 'UPDATE' THEN ARRAY(
        SELECT unnest(ARRAY['company_name', 'contact_person', 'business_type', 'business_context'])
        WHERE (OLD.company_name IS DISTINCT FROM NEW.company_name) OR
              (OLD.contact_person IS DISTINCT FROM NEW.contact_person) OR
              (OLD.business_type IS DISTINCT FROM NEW.business_type) OR
              (OLD.business_context IS DISTINCT FROM NEW.business_context)
      )
      ELSE NULL
    END,
    jsonb_build_object(
      'authenticated_user', auth.uid(),
      'is_admin', has_role(auth.uid(), 'admin'::app_role),
      'is_own_profile', auth.uid() = COALESCE(NEW.user_id, OLD.user_id)
    )
  );

  -- Enhanced validation for company name and contact person
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Validate company name
    IF NEW.company_name IS NOT NULL THEN
      IF length(NEW.company_name) > 200 THEN
        RAISE EXCEPTION 'Company name exceeds maximum length (200 characters)';
      END IF;
      
      -- Check for malicious patterns
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

    -- Validate business context for length and content
    IF NEW.business_context IS NOT NULL THEN
      IF length(NEW.business_context) > 2000 THEN
        RAISE EXCEPTION 'Business context exceeds maximum length (2000 characters)';
      END IF;
      
      IF NOT public.validate_input_sanitization(NEW.business_context) THEN
        PERFORM public.log_security_event(
          'malicious_input_blocked',
          jsonb_build_object(
            'field', 'business_context',
            'user_id', NEW.user_id
          ),
          'high'
        );
        RAISE EXCEPTION 'Invalid characters detected in business context';
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for enhanced profile validation
CREATE TRIGGER profile_enhanced_security_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_profile_security_validation();

-- Add security event logging for the migration
INSERT INTO public.security_logs (
  action,
  details,
  severity
) VALUES (
  'security_migration_applied',
  jsonb_build_object(
    'fixes', ARRAY['removed_plaintext_email', 'fixed_phone_validation', 'updated_alert_function'],
    'timestamp', now(),
    'migration_version', '20250130_security_fixes'
  ),
  'info'
);