-- Security fixes - Step 1: Core security functions and improvements
-- Enhanced rate limiting function  
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
  _action_type text, 
  _max_attempts integer DEFAULT 5, 
  _window_minutes integer DEFAULT 15,
  _user_identifier text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
  identifier text;
BEGIN
  -- Use provided identifier or fallback to user ID
  identifier := COALESCE(_user_identifier, auth.uid()::text, inet_client_addr()::text);
  
  -- Count recent attempts in the time window
  SELECT COUNT(*) INTO current_count
  FROM public.rate_limits 
  WHERE action_type = _action_type
    AND (user_id = auth.uid() OR _user_identifier IS NOT NULL)
    AND last_attempt > now() - interval '1 minute' * _window_minutes;
  
  -- Log rate limit violations
  IF current_count >= _max_attempts THEN
    PERFORM log_security_event(
      'rate_limit_violation',
      jsonb_build_object(
        'action_type', _action_type,
        'attempts', current_count,
        'limit', _max_attempts,
        'identifier', identifier
      ),
      'high'
    );
    
    RETURN false;
  END IF;
  
  -- Record this attempt
  INSERT INTO public.rate_limits (user_id, action_type, attempt_count, last_attempt)
  VALUES (auth.uid(), _action_type, 1, now())
  ON CONFLICT (user_id, action_type) DO UPDATE SET
    attempt_count = rate_limits.attempt_count + 1,
    last_attempt = now();
  
  RETURN true;
END;
$$;

-- Secure phone number access function
CREATE OR REPLACE FUNCTION public.get_profile_phone_secure(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  phone_value text;
BEGIN
  -- Only allow users to access their own phone or admins
  IF auth.uid() != _user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM log_security_event(
      'unauthorized_phone_access_attempt',
      jsonb_build_object(
        'requested_user_id', _user_id,
        'requesting_user_id', auth.uid()
      ),
      'high'
    );
    RAISE EXCEPTION 'Access denied: insufficient permissions to view phone number';
  END IF;

  -- Log legitimate access
  PERFORM log_security_event(
    'phone_number_accessed',
    jsonb_build_object(
      'target_user_id', _user_id,
      'accessed_by', auth.uid(),
      'is_admin_access', has_role(auth.uid(), 'admin'::app_role)
    ),
    'info'
  );

  SELECT phone INTO phone_value
  FROM profiles
  WHERE user_id = _user_id;
  
  RETURN phone_value;
END;
$$;

-- Enhanced admin action logging
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _target_table text DEFAULT NULL,
  _target_id uuid DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log if user is actually an admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM log_security_event(
      'unauthorized_admin_function_call',
      jsonb_build_object(
        'attempted_action', _action,
        'user_id', auth.uid()
      ),
      'critical'
    );
    RETURN;
  END IF;

  INSERT INTO security_logs (
    user_id,
    action,
    details,
    severity,
    ip_address
  ) VALUES (
    auth.uid(),
    'admin_action: ' || _action,
    jsonb_build_object(
      'target_table', _target_table,
      'target_id', _target_id,
      'admin_details', _details,
      'timestamp', now()
    ),
    'high',
    inet_client_addr()
  );
END;
$$;

-- Create API rate limits table for better webhook monitoring
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage API rate limits"
ON public.api_rate_limits
FOR ALL
USING (true);