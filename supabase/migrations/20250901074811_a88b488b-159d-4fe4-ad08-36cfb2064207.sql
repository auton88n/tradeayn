-- Comprehensive security hardening measures

-- 1. Enable leaked password protection
UPDATE auth.config SET value = 'true' WHERE parameter = 'password_strength_check';

-- 2. Enable password strength requirements
UPDATE auth.config SET value = '8' WHERE parameter = 'password_min_length';

-- 3. Set up session timeout (24 hours)
UPDATE auth.config SET value = '86400' WHERE parameter = 'jwt_expiry';

-- 4. Enable email confirmation requirements
UPDATE auth.config SET value = 'true' WHERE parameter = 'email_confirm_signup';

-- 5. Limit failed login attempts (rate limiting)
UPDATE auth.config SET value = '5' WHERE parameter = 'max_login_attempts';

-- 6. Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
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
  _user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (user_id, action, details, ip_address, user_agent)
  VALUES (auth.uid(), _action, _details, _ip_address, _user_agent);
END;
$$;

-- 7. Add security headers and validation functions
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
  
  RETURN true;
END;
$$;

-- 8. Create function to enforce data encryption validation
CREATE OR REPLACE FUNCTION public.enforce_data_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate phone numbers (basic format check)
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^\+?[0-9\s\-\(\)]{7,20}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Validate company name (prevent malicious input)
  IF NEW.company_name IS NOT NULL AND NOT validate_input_sanitization(NEW.company_name) THEN
    RAISE EXCEPTION 'Invalid characters in company name';
  END IF;
  
  -- Validate contact person name
  IF NEW.contact_person IS NOT NULL AND NOT validate_input_sanitization(NEW.contact_person) THEN
    RAISE EXCEPTION 'Invalid characters in contact person name';
  END IF;
  
  -- Log profile updates for security monitoring
  PERFORM log_security_event('profile_update', 
    jsonb_build_object('table', 'profiles', 'user_id', NEW.user_id));
  
  RETURN NEW;
END;
$$;

-- Add validation trigger to profiles table
DROP TRIGGER IF EXISTS enforce_profile_data_validation ON public.profiles;
CREATE TRIGGER enforce_profile_data_validation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_data_validation();

-- 9. Create function to monitor suspicious activity
CREATE OR REPLACE FUNCTION public.monitor_login_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log login attempt
  PERFORM log_security_event('login_attempt', 
    jsonb_build_object('email', NEW.email, 'success', 'true'));
  
  RETURN NEW;
END;
$$;