-- Enhanced security measures for profiles table containing sensitive PII data

-- Create function to log sensitive data access with detailed metadata
CREATE OR REPLACE FUNCTION public.log_profiles_sensitive_access(
  _operation TEXT,
  _user_id UUID,
  _accessed_fields TEXT[] DEFAULT NULL,
  _additional_context JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
BEGIN
  -- Log detailed access to sensitive profile data
  INSERT INTO public.security_logs (
    user_id,
    action,
    details,
    severity,
    ip_address
  ) VALUES (
    auth.uid(),
    'sensitive_profile_access',
    jsonb_build_object(
      'operation', _operation,
      'target_user_id', _user_id,
      'accessed_fields', _accessed_fields,
      'timestamp', now(),
      'context', _additional_context
    ),
    CASE 
      WHEN _operation IN ('SELECT', 'UPDATE') AND auth.uid() != _user_id THEN 'high'
      ELSE 'medium'
    END,
    inet_client_addr()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enhanced profile security validation trigger
CREATE OR REPLACE FUNCTION public.enhanced_profile_security_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all profile operations for security monitoring
  PERFORM public.log_profiles_sensitive_access(
    TG_OP,
    COALESCE(NEW.user_id, OLD.user_id),
    CASE TG_OP
      WHEN 'INSERT' THEN ARRAY['company_name', 'contact_person', 'phone', 'business_type', 'business_context']
      WHEN 'UPDATE' THEN ARRAY(
        SELECT unnest(ARRAY['company_name', 'contact_person', 'phone', 'business_type', 'business_context'])
        WHERE (OLD.company_name IS DISTINCT FROM NEW.company_name) OR
              (OLD.contact_person IS DISTINCT FROM NEW.contact_person) OR
              (OLD.phone IS DISTINCT FROM NEW.phone) OR
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

  -- Enhanced phone number validation with international format support
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    -- Comprehensive phone validation for international numbers
    IF NOT (regexp_replace(NEW.phone, '[^0-9+\-\s\(\)]', '', 'g') ~ '^\+?[0-9\-\s\(\)]{7,20}$') THEN
      RAISE EXCEPTION 'Invalid phone number format. Use international format (e.g., +1-555-123-4567)';
    END IF;
    
    -- Check for suspicious phone patterns
    IF NEW.phone ~ '(\d)\1{6,}' THEN -- Repeated digits
      RAISE EXCEPTION 'Invalid phone number pattern detected';
    END IF;
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for enhanced profile security
DROP TRIGGER IF EXISTS enhanced_profile_security_trigger ON public.profiles;
CREATE TRIGGER enhanced_profile_security_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_profile_security_validation();

-- Function to safely retrieve profile data with access logging
CREATE OR REPLACE FUNCTION public.get_user_profile_secure(_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  company_name TEXT,
  contact_person TEXT,
  phone TEXT,
  business_type TEXT,
  business_context TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verify access rights
  IF auth.uid() != _user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM public.log_security_event(
      'unauthorized_profile_access_attempt',
      jsonb_build_object(
        'requested_user_id', _user_id,
        'requesting_user_id', auth.uid()
      ),
      'critical'
    );
    RAISE EXCEPTION 'Access denied: insufficient permissions to view this profile';
  END IF;

  -- Log the access
  PERFORM public.log_profiles_sensitive_access(
    'SECURE_SELECT',
    _user_id,
    ARRAY['company_name', 'contact_person', 'phone', 'business_type', 'business_context']
  );

  -- Return the data
  RETURN QUERY
  SELECT p.id, p.user_id, p.company_name, p.contact_person, p.phone, 
         p.business_type, p.business_context, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.user_id = _user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create index for better performance on security-sensitive queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_security 
ON public.profiles(user_id) 
WHERE phone IS NOT NULL OR company_name IS NOT NULL;

-- Add comment to document the enhanced security measures
COMMENT ON TABLE public.profiles IS 'User profiles table with enhanced security measures for PII protection. Contains triggers for input validation, access logging, and malicious content detection.';
COMMENT ON COLUMN public.profiles.phone IS 'Phone number with enhanced validation and access logging for PII protection';
COMMENT ON COLUMN public.profiles.company_name IS 'Company name with input sanitization and access monitoring';
COMMENT ON COLUMN public.profiles.contact_person IS 'Contact person with enhanced validation and security logging';