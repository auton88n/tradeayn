-- Fix security warnings by setting proper search paths for functions

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.log_security_event(
  _action text,
  _details jsonb DEFAULT '{}',
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _severity text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (user_id, action, details, ip_address, user_agent, severity)
  VALUES (auth.uid(), _action, _details, _ip_address, _user_agent, _severity);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_input_sanitization(input_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Check for common XSS patterns
  IF input_text ~* '<script|javascript:|on\w+=' THEN
    RETURN false;
  END IF;
  
  -- Check for SQL injection patterns
  IF input_text ~* '(union|select|insert|update|delete|drop|create|alter)\s' THEN
    RETURN false;
  END IF;
  
  -- Check for common malicious patterns
  IF input_text ~* '(eval\(|document\.|window\.|alert\(|prompt\(|confirm\()' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_data_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate phone numbers (international format)
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^\+?[0-9\s\-\(\)]{7,20}$' THEN
    PERFORM log_security_event('validation_failed', 
      jsonb_build_object('field', 'phone', 'value', NEW.phone), NULL, NULL, 'medium');
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Validate company name (prevent malicious input)
  IF NEW.company_name IS NOT NULL THEN
    IF NOT validate_input_sanitization(NEW.company_name) THEN
      PERFORM log_security_event('malicious_input_detected', 
        jsonb_build_object('field', 'company_name', 'value', NEW.company_name), NULL, NULL, 'high');
      RAISE EXCEPTION 'Invalid characters in company name';
    END IF;
    
    -- Check length limits
    IF length(NEW.company_name) > 200 THEN
      RAISE EXCEPTION 'Company name too long (max 200 characters)';
    END IF;
  END IF;
  
  -- Validate contact person name
  IF NEW.contact_person IS NOT NULL THEN
    IF NOT validate_input_sanitization(NEW.contact_person) THEN
      PERFORM log_security_event('malicious_input_detected', 
        jsonb_build_object('field', 'contact_person', 'value', NEW.contact_person), NULL, NULL, 'high');
      RAISE EXCEPTION 'Invalid characters in contact person name';
    END IF;
    
    -- Check length limits
    IF length(NEW.contact_person) > 100 THEN
      RAISE EXCEPTION 'Contact person name too long (max 100 characters)';
    END IF;
  END IF;
  
  -- Log profile updates for security monitoring
  PERFORM log_security_event('profile_update', 
    jsonb_build_object('table', 'profiles', 'user_id', NEW.user_id), NULL, NULL, 'low');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _action_type text,
  _max_attempts integer DEFAULT 5,
  _window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_attempts integer;
  window_start timestamp with time zone;
BEGIN
  window_start := now() - (_window_minutes || ' minutes')::interval;
  
  -- Get current attempts in window
  SELECT COALESCE(attempt_count, 0) INTO current_attempts
  FROM public.rate_limits
  WHERE user_id = auth.uid() 
    AND action_type = _action_type 
    AND last_attempt > window_start;
  
  -- Check if blocked
  IF EXISTS (
    SELECT 1 FROM public.rate_limits
    WHERE user_id = auth.uid()
      AND action_type = _action_type
      AND blocked_until > now()
  ) THEN
    RETURN false;
  END IF;
  
  -- Update or insert rate limit record
  INSERT INTO public.rate_limits (user_id, action_type, attempt_count, last_attempt)
  VALUES (auth.uid(), _action_type, 1, now())
  ON CONFLICT (user_id, action_type) 
  DO UPDATE SET 
    attempt_count = CASE 
      WHEN rate_limits.last_attempt > window_start THEN rate_limits.attempt_count + 1
      ELSE 1
    END,
    last_attempt = now(),
    blocked_until = CASE 
      WHEN rate_limits.last_attempt > window_start AND rate_limits.attempt_count >= _max_attempts 
      THEN now() + interval '1 hour'
      ELSE NULL
    END;
  
  -- Check if we've exceeded the limit
  SELECT attempt_count INTO current_attempts
  FROM public.rate_limits
  WHERE user_id = auth.uid() AND action_type = _action_type;
  
  IF current_attempts > _max_attempts THEN
    PERFORM log_security_event('rate_limit_exceeded', 
      jsonb_build_object('action', _action_type, 'attempts', current_attempts), NULL, NULL, 'high');
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_attempts integer;
BEGIN
  -- Check for rapid successive attempts
  SELECT COUNT(*) INTO recent_attempts
  FROM public.security_audit_logs
  WHERE user_id = auth.uid()
    AND created_at > now() - interval '5 minutes'
    AND action = 'login_attempt';
  
  IF recent_attempts > 10 THEN
    PERFORM log_security_event('suspicious_activity_detected', 
      jsonb_build_object('type', 'rapid_login_attempts', 'count', recent_attempts), 
      NULL, NULL, 'critical');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.security_audit_logs 
  WHERE created_at < (now() - interval '90 days');
  
  DELETE FROM public.rate_limits 
  WHERE created_at < (now() - interval '30 days') 
    AND blocked_until < now();
END;
$$;