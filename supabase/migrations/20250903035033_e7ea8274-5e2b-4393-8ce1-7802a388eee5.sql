-- Create security_logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info',
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security logs (admin only for now)
CREATE POLICY "Authenticated users can insert their own security logs" 
ON public.security_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_type, window_start)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for rate limits
CREATE POLICY "Users can manage their own rate limits" 
ON public.rate_limits 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  _action TEXT,
  _details JSONB DEFAULT '{}',
  _severity TEXT DEFAULT 'info',
  _user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _action_type TEXT,
  _max_attempts INTEGER DEFAULT 5,
  _window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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