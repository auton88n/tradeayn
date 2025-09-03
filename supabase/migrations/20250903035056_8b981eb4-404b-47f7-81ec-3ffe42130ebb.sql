-- Fix security warnings by setting search_path for functions

-- Update log_security_event function with search_path
CREATE OR REPLACE FUNCTION public.log_security_event(
  _action TEXT,
  _details JSONB DEFAULT '{}',
  _severity TEXT DEFAULT 'info',
  _user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    action,
    details,
    severity,
    user_agent,
    ip_address
  ) VALUES (
    auth.uid(),
    _action,
    _details,
    _severity,
    _user_agent,
    inet_client_addr()
  );
END;
$$;

-- Update check_rate_limit function with search_path
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _action_type TEXT,
  _max_attempts INTEGER DEFAULT 5,
  _window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_window_start TIMESTAMP WITH TIME ZONE;
  current_count INTEGER;
BEGIN
  -- Calculate the current window start time
  current_window_start := date_trunc('minute', now()) - interval '1 minute' * (_window_minutes - 1);
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (user_id, action_type, window_start, attempt_count)
  VALUES (auth.uid(), _action_type, current_window_start, 1)
  ON CONFLICT (user_id, action_type, window_start)
  DO UPDATE SET 
    attempt_count = rate_limits.attempt_count + 1,
    created_at = now()
  RETURNING attempt_count INTO current_count;
  
  -- Check if limit is exceeded
  RETURN current_count <= _max_attempts;
END;
$$;