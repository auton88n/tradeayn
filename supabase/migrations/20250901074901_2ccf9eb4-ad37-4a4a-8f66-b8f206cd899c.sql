-- Comprehensive security hardening measures (database-level)

-- 1. Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  severity text DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_logs 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to log security events
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
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (user_id, action, details, ip_address, user_agent, severity)
  VALUES (auth.uid(), _action, _details, _ip_address, _user_agent, _severity);
END;
$$;

-- 2. Add input validation functions
CREATE OR REPLACE FUNCTION public.validate_input_sanitization(input_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
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

-- 3. Create enhanced data validation function
CREATE OR REPLACE FUNCTION public.enforce_data_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add validation trigger to profiles table
DROP TRIGGER IF EXISTS enforce_profile_data_validation ON public.profiles;
CREATE TRIGGER enforce_profile_data_validation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_data_validation();

-- 4. Create rate limiting table for security
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  attempt_count integer DEFAULT 1,
  last_attempt timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only users can view their own rate limits, admins can view all
CREATE POLICY "Users can view own rate limits" 
ON public.rate_limits 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Create function to check and enforce rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _action_type text,
  _max_attempts integer DEFAULT 5,
  _window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 5. Create function to detect suspicious patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 6. Add constraints to prevent data tampering
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_not_null CHECK (user_id IS NOT NULL);

-- 7. Create cleanup function for old security logs
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.security_audit_logs 
  WHERE created_at < (now() - interval '90 days');
  
  DELETE FROM public.rate_limits 
  WHERE created_at < (now() - interval '30 days') 
    AND blocked_until < now();
END;
$$;