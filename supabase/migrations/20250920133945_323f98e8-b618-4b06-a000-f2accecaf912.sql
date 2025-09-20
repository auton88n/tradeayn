-- Create webhook rate limiting table
CREATE TABLE IF NOT EXISTS public.webhook_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on webhook_rate_limits
ALTER TABLE public.webhook_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for webhook rate limits (only system can manage)
CREATE POLICY "System can manage webhook rate limits" 
ON public.webhook_rate_limits 
FOR ALL 
USING (true);

-- Create function to check webhook rate limits
CREATE OR REPLACE FUNCTION public.check_webhook_rate_limit(
  p_user_id UUID, 
  p_endpoint TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean up expired entries first
  DELETE FROM public.webhook_rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  -- Get current count in this hour window
  SELECT request_count, window_start INTO current_count, window_start_time
  FROM public.webhook_rate_limits 
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint;
    
  -- If no record exists, create one
  IF current_count IS NULL THEN
    INSERT INTO public.webhook_rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, NOW());
    RETURN TRUE;
  END IF;
  
  -- If window has expired, reset the counter
  IF window_start_time < NOW() - INTERVAL '1 hour' THEN
    UPDATE public.webhook_rate_limits 
    SET request_count = 1, 
        window_start = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    RETURN TRUE;
  END IF;
  
  -- Check if under the limit (50 requests per hour)
  IF current_count < 50 THEN
    UPDATE public.webhook_rate_limits 
    SET request_count = request_count + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    RETURN TRUE;
  ELSE
    -- Log rate limit violation
    PERFORM log_security_event(
      'webhook_rate_limit_violation',
      jsonb_build_object(
        'user_id', p_user_id,
        'endpoint', p_endpoint,
        'current_count', current_count,
        'limit', 50
      ),
      'high'
    );
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create webhook security logs table
CREATE TABLE IF NOT EXISTS public.webhook_security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  endpoint TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  request_headers JSONB,
  details JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on webhook security logs
ALTER TABLE public.webhook_security_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for webhook security logs (admins only)
CREATE POLICY "Only admins can view webhook security logs" 
ON public.webhook_security_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to log webhook security events
CREATE OR REPLACE FUNCTION public.log_webhook_security_event(
  p_endpoint TEXT,
  p_action TEXT,
  p_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_severity TEXT DEFAULT 'info'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.webhook_security_logs (
    user_id,
    endpoint,
    action,
    ip_address,
    details,
    severity
  ) VALUES (
    p_user_id,
    p_endpoint,
    p_action,
    inet_client_addr(),
    p_details,
    p_severity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_user_endpoint 
ON public.webhook_rate_limits(user_id, endpoint);

CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_window_start 
ON public.webhook_rate_limits(window_start);

CREATE INDEX IF NOT EXISTS idx_webhook_security_logs_created_at 
ON public.webhook_security_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_security_logs_severity 
ON public.webhook_security_logs(severity);

-- Create cleanup function for old webhook logs
CREATE OR REPLACE FUNCTION public.cleanup_webhook_logs()
RETURNS VOID AS $$
BEGIN
  -- Delete logs older than 30 days
  DELETE FROM public.webhook_security_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete old rate limit entries
  DELETE FROM public.webhook_rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;