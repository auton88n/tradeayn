-- Add usage tracking fields to access_grants table
ALTER TABLE access_grants ADD COLUMN monthly_limit INTEGER DEFAULT NULL;
ALTER TABLE access_grants ADD COLUMN current_month_usage INTEGER DEFAULT 0;
ALTER TABLE access_grants ADD COLUMN usage_reset_date DATE DEFAULT (date_trunc('month', CURRENT_DATE) + interval '1 month')::date;

-- Create usage_logs table to track detailed usage
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'message', 'analysis', 'report', etc.
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on usage_logs
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for usage_logs
CREATE POLICY "Users can view own usage logs"
ON public.usage_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs"
ON public.usage_logs
FOR INSERT
WITH CHECK (true); -- Allow system to insert usage logs

CREATE POLICY "Admins can view all usage logs"
ON public.usage_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to check if user has usage remaining
CREATE OR REPLACE FUNCTION public.check_usage_limit(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN ag.monthly_limit IS NULL THEN true -- No limit set
    WHEN ag.current_month_usage < ag.monthly_limit THEN true
    ELSE false
  END
  FROM access_grants ag
  WHERE ag.user_id = _user_id 
  AND ag.is_active = true
  AND (ag.expires_at IS NULL OR ag.expires_at > now());
$$;

-- Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(_user_id UUID, _action_type TEXT DEFAULT 'message', _count INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_month DATE;
  needs_reset BOOLEAN;
BEGIN
  current_month := date_trunc('month', CURRENT_DATE)::date;
  
  -- Check if we need to reset usage for new month
  SELECT CASE 
    WHEN usage_reset_date <= current_month THEN true 
    ELSE false 
  END INTO needs_reset
  FROM access_grants 
  WHERE user_id = _user_id;
  
  -- Reset usage if new month
  IF needs_reset THEN
    UPDATE access_grants 
    SET 
      current_month_usage = 0,
      usage_reset_date = (current_month + interval '1 month')::date
    WHERE user_id = _user_id;
  END IF;
  
  -- Check if user has remaining usage
  IF NOT check_usage_limit(_user_id) THEN
    RETURN false;
  END IF;
  
  -- Log the usage
  INSERT INTO usage_logs (user_id, action_type, usage_count)
  VALUES (_user_id, _action_type, _count);
  
  -- Increment current usage
  UPDATE access_grants 
  SET current_month_usage = current_month_usage + _count
  WHERE user_id = _user_id;
  
  RETURN true;
END;
$$;

-- Function to get usage stats for admin
CREATE OR REPLACE FUNCTION public.get_usage_stats(_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  company_name TEXT,
  monthly_limit INTEGER,
  current_usage INTEGER,
  usage_percentage NUMERIC,
  reset_date DATE
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ag.user_id,
    au.email as user_email,
    p.company_name,
    ag.monthly_limit,
    ag.current_month_usage as current_usage,
    CASE 
      WHEN ag.monthly_limit IS NULL THEN NULL
      WHEN ag.monthly_limit = 0 THEN 100
      ELSE ROUND((ag.current_month_usage::numeric / ag.monthly_limit::numeric) * 100, 2)
    END as usage_percentage,
    ag.usage_reset_date as reset_date
  FROM access_grants ag
  LEFT JOIN auth.users au ON ag.user_id = au.id
  LEFT JOIN profiles p ON ag.user_id = p.user_id
  WHERE (_user_id IS NULL OR ag.user_id = _user_id)
  AND ag.is_active = true;
$$;