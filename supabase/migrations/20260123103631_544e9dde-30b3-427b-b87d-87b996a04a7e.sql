-- =========================================
-- SECURITY REMEDIATION: 3 Critical Findings
-- =========================================

-- 1. PROFILES TABLE: Add audit logging trigger for UPDATE operations
CREATE OR REPLACE FUNCTION public.log_profile_access_trigger()
RETURNS trigger AS $$
BEGIN
  -- Log when admin accesses/modifies another user's profile
  IF auth.uid() IS NOT NULL AND auth.uid() != COALESCE(NEW.user_id, OLD.user_id) THEN
    PERFORM public.log_security_event(
      'profile_cross_access',
      jsonb_build_object(
        'operation', TG_OP,
        'target_user', COALESCE(NEW.user_id, OLD.user_id),
        'accessor', auth.uid(),
        'timestamp', now()
      ),
      'high'
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for profile modification auditing
DROP TRIGGER IF EXISTS audit_profile_access ON public.profiles;
CREATE TRIGGER audit_profile_access
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_access_trigger();

-- 2. ALERT HISTORY: Strengthen INSERT policy to service_role only
DROP POLICY IF EXISTS "Admins can insert alert history" ON public.alert_history;
DROP POLICY IF EXISTS "Only system functions can insert alerts" ON public.alert_history;

CREATE POLICY "Only service role can insert alerts" 
ON public.alert_history 
FOR INSERT 
WITH CHECK (
  (SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'role')) = 'service_role'
);

-- 3. VISITOR ANALYTICS: Add rate limiting function
CREATE OR REPLACE FUNCTION public.check_visitor_analytics_rate_limit(_visitor_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
  max_per_minute INTEGER := 10;
BEGIN
  -- Count recent inserts for this visitor
  SELECT COUNT(*) INTO recent_count
  FROM public.visitor_analytics
  WHERE visitor_id = _visitor_id
    AND created_at > now() - interval '1 minute';
  
  -- Block if over limit and log the violation
  IF recent_count >= max_per_minute THEN
    INSERT INTO public.security_logs (action, details, severity)
    VALUES (
      'analytics_rate_limit_exceeded',
      jsonb_build_object(
        'visitor_id', _visitor_id,
        'count', recent_count,
        'blocked_at', now()
      ),
      'high'
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Update visitor_analytics INSERT policy with rate limiting
DROP POLICY IF EXISTS "Allow public inserts for tracking" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Allow rate-limited public inserts for tracking" ON public.visitor_analytics;

CREATE POLICY "Allow rate-limited public inserts for tracking" 
ON public.visitor_analytics 
FOR INSERT 
WITH CHECK (
  page_path IS NOT NULL 
  AND length(page_path) > 0
  AND length(page_path) <= 500
  AND visitor_id IS NOT NULL
  AND length(visitor_id) > 0
  AND length(visitor_id) <= 100
  AND public.check_visitor_analytics_rate_limit(visitor_id)
);