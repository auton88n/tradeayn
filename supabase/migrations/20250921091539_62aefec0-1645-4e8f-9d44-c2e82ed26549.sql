-- Create webhook_rate_limits table to fix the edge function
CREATE TABLE IF NOT EXISTS public.webhook_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.webhook_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own webhook rate limits"
ON public.webhook_rate_limits
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create the missing check_webhook_rate_limit function
CREATE OR REPLACE FUNCTION public.check_webhook_rate_limit(p_user_id UUID, p_endpoint TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;