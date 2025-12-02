-- ============================================
-- ENTERPRISE-GRADE SERVER-SIDE RATE LIMITING
-- ============================================

-- 1. Create comprehensive API rate limits table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  max_requests integer DEFAULT 100,
  blocked_until timestamptz,
  violation_count integer DEFAULT 0,
  last_violation timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Performance indexes
CREATE INDEX idx_api_rate_limits_user_endpoint ON public.api_rate_limits(user_id, endpoint);
CREATE INDEX idx_api_rate_limits_window ON public.api_rate_limits(window_start);
CREATE INDEX idx_api_rate_limits_blocked ON public.api_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own rate limits
CREATE POLICY "Users can view own rate limits"
ON public.api_rate_limits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role manages all rate limits (called from edge functions)
CREATE POLICY "Service role can manage rate limits"
ON public.api_rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can view all rate limits for monitoring
CREATE POLICY "Admins can view all rate limits"
ON public.api_rate_limits FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Create configurable rate limit function
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer DEFAULT 100,
  p_window_minutes integer DEFAULT 60
) RETURNS TABLE(
  allowed boolean,
  remaining_requests integer,
  reset_at timestamptz,
  retry_after_seconds integer
) AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamptz;
  v_blocked_until timestamptz;
  v_window_end timestamptz;
  v_remaining integer;
BEGIN
  -- Check if user is currently blocked
  SELECT api_rate_limits.blocked_until INTO v_blocked_until
  FROM public.api_rate_limits
  WHERE api_rate_limits.user_id = p_user_id 
    AND api_rate_limits.endpoint = p_endpoint
    AND api_rate_limits.blocked_until > now()
  LIMIT 1;

  IF v_blocked_until IS NOT NULL THEN
    -- User is blocked
    RETURN QUERY SELECT 
      false,
      0,
      v_blocked_until,
      EXTRACT(EPOCH FROM (v_blocked_until - now()))::integer;
    RETURN;
  END IF;

  -- Upsert rate limit record with atomic operation
  INSERT INTO public.api_rate_limits (user_id, endpoint, request_count, window_start, max_requests)
  VALUES (p_user_id, p_endpoint, 1, now(), p_max_requests)
  ON CONFLICT (user_id, endpoint)
  DO UPDATE SET
    request_count = CASE
      WHEN api_rate_limits.window_start + (p_window_minutes || ' minutes')::interval < now()
      THEN 1
      ELSE api_rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN api_rate_limits.window_start + (p_window_minutes || ' minutes')::interval < now()
      THEN now()
      ELSE api_rate_limits.window_start
    END,
    blocked_until = CASE
      WHEN api_rate_limits.request_count + 1 > p_max_requests
        AND api_rate_limits.window_start + (p_window_minutes || ' minutes')::interval >= now()
      THEN now() + (p_window_minutes || ' minutes')::interval
      ELSE NULL
    END,
    violation_count = CASE
      WHEN api_rate_limits.request_count + 1 > p_max_requests
        AND api_rate_limits.window_start + (p_window_minutes || ' minutes')::interval >= now()
      THEN api_rate_limits.violation_count + 1
      ELSE api_rate_limits.violation_count
    END,
    last_violation = CASE
      WHEN api_rate_limits.request_count + 1 > p_max_requests
      THEN now()
      ELSE api_rate_limits.last_violation
    END,
    updated_at = now()
  RETURNING 
    request_count,
    window_start,
    blocked_until
  INTO v_current_count, v_window_start, v_blocked_until;

  -- Calculate window end and remaining requests
  v_window_end := v_window_start + (p_window_minutes || ' minutes')::interval;
  v_remaining := GREATEST(0, p_max_requests - v_current_count);

  -- Log violations for security monitoring
  IF v_current_count > p_max_requests THEN
    PERFORM public.log_security_event(
      'api_rate_limit_violation',
      jsonb_build_object(
        'user_id', p_user_id,
        'endpoint', p_endpoint,
        'request_count', v_current_count,
        'max_requests', p_max_requests,
        'blocked_until', v_blocked_until
      ),
      'high'
    );
  END IF;

  -- Return result
  RETURN QUERY SELECT 
    v_current_count <= p_max_requests,
    v_remaining,
    v_window_end,
    CASE 
      WHEN v_current_count > p_max_requests 
      THEN EXTRACT(EPOCH FROM (v_window_end - now()))::integer
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Admin function to view rate limit stats
CREATE OR REPLACE FUNCTION public.get_rate_limit_stats()
RETURNS TABLE(
  user_id uuid,
  endpoint text,
  request_count integer,
  max_requests integer,
  violation_count integer,
  is_blocked boolean,
  blocked_until timestamptz,
  last_activity timestamptz
) AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    arl.user_id,
    arl.endpoint,
    arl.request_count,
    arl.max_requests,
    arl.violation_count,
    (arl.blocked_until IS NOT NULL AND arl.blocked_until > now()) as is_blocked,
    arl.blocked_until,
    arl.updated_at as last_activity
  FROM public.api_rate_limits arl
  ORDER BY arl.violation_count DESC, arl.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Admin function to unblock a user
CREATE OR REPLACE FUNCTION public.admin_unblock_user(p_user_id uuid, p_endpoint text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  UPDATE public.api_rate_limits
  SET blocked_until = NULL, updated_at = now()
  WHERE user_id = p_user_id
    AND (p_endpoint IS NULL OR endpoint = p_endpoint);

  -- Log admin action
  PERFORM public.log_security_event(
    'admin_unblock_user',
    jsonb_build_object('target_user_id', p_user_id, 'endpoint', p_endpoint),
    'info'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Insert default rate limit configurations
INSERT INTO public.system_config (key, value) VALUES
  ('rate_limit_messages_per_hour', '{"limit": 100, "window_minutes": 60}'::jsonb),
  ('rate_limit_uploads_per_hour', '{"limit": 50, "window_minutes": 60}'::jsonb),
  ('rate_limit_api_calls_per_hour', '{"limit": 200, "window_minutes": 60}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();