-- Create rate limit check function for contact messages
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_count INTEGER;
  max_per_day INTEGER := 3;
BEGIN
  -- Count submissions from this email in last 24 hours
  SELECT COUNT(*) INTO recent_count
  FROM contact_messages
  WHERE email = _email
    AND created_at > now() - interval '24 hours';
  
  -- If at or over limit, log and reject
  IF recent_count >= max_per_day THEN
    INSERT INTO security_logs (action, details, severity)
    VALUES (
      'contact_rate_limit_exceeded',
      jsonb_build_object(
        'email', _email,
        'recent_count', recent_count,
        'limit', max_per_day
      ),
      'high'
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Drop existing open policy
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contact_messages;

-- Create rate-limited policy (max 3 per email per 24 hours)
CREATE POLICY "Rate limited contact messages" ON contact_messages
  FOR INSERT
  WITH CHECK (check_contact_rate_limit(email));