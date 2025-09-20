-- Phase 1: Emergency Shutdown and Cost Monitoring System

-- 1. System Status and Emergency Shutdown Table
CREATE TABLE public.system_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_emergency_shutdown BOOLEAN NOT NULL DEFAULT false,
  shutdown_reason TEXT,
  shutdown_initiated_by UUID REFERENCES auth.users(id),
  shutdown_initiated_at TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;

-- Only admins can manage system status
CREATE POLICY "Only admins can manage system status"
ON public.system_status
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial system status record
INSERT INTO public.system_status (is_emergency_shutdown) VALUES (false);

-- 2. Cost Monitoring and Thresholds Table
CREATE TABLE public.cost_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  daily_threshold DECIMAL(10,2) DEFAULT 50.00,
  weekly_threshold DECIMAL(10,2) DEFAULT 200.00,
  monthly_threshold DECIMAL(10,2) DEFAULT 500.00,
  current_daily_spend DECIMAL(10,2) DEFAULT 0.00,
  current_weekly_spend DECIMAL(10,2) DEFAULT 0.00,
  current_monthly_spend DECIMAL(10,2) DEFAULT 0.00,
  last_reset_daily DATE DEFAULT CURRENT_DATE,
  last_reset_weekly DATE DEFAULT date_trunc('week', CURRENT_DATE)::date,
  last_reset_monthly DATE DEFAULT date_trunc('month', CURRENT_DATE)::date,
  alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cost_thresholds ENABLE ROW LEVEL SECURITY;

-- Users can view/update their own thresholds, admins can view all
CREATE POLICY "Users can manage own cost thresholds"
ON public.cost_thresholds
FOR ALL
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Alert History Table
CREATE TABLE public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'emergency_shutdown', 'cost_threshold', 'resource_warning'
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID, -- null for system-wide alerts
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view alert history
CREATE POLICY "Only admins can view alert history"
ON public.alert_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Resource Usage Monitoring Table
CREATE TABLE public.resource_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'storage_mb', 'mau_count', 'function_invocations'
  current_value BIGINT NOT NULL,
  limit_value BIGINT NOT NULL,
  usage_percentage DECIMAL(5,2) NOT NULL,
  alert_threshold_percentage DECIMAL(5,2) DEFAULT 80.00,
  last_alerted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resource_usage ENABLE ROW LEVEL SECURITY;

-- Only admins can manage resource usage
CREATE POLICY "Only admins can manage resource usage"
ON public.resource_usage
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Cost Tracking Function
CREATE OR REPLACE FUNCTION public.track_user_cost(
  p_user_id UUID,
  p_cost_amount DECIMAL(10,2),
  p_mode_used TEXT DEFAULT 'General'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_record RECORD;
  needs_alert BOOLEAN := false;
  alert_type TEXT := '';
BEGIN
  -- Get or create cost threshold record
  INSERT INTO public.cost_thresholds (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current record
  SELECT * INTO current_record 
  FROM public.cost_thresholds 
  WHERE user_id = p_user_id;
  
  -- Reset counters if needed
  IF current_record.last_reset_daily < CURRENT_DATE THEN
    UPDATE public.cost_thresholds 
    SET current_daily_spend = 0, last_reset_daily = CURRENT_DATE
    WHERE user_id = p_user_id;
  END IF;
  
  IF current_record.last_reset_weekly < date_trunc('week', CURRENT_DATE)::date THEN
    UPDATE public.cost_thresholds 
    SET current_weekly_spend = 0, last_reset_weekly = date_trunc('week', CURRENT_DATE)::date
    WHERE user_id = p_user_id;
  END IF;
  
  IF current_record.last_reset_monthly < date_trunc('month', CURRENT_DATE)::date THEN
    UPDATE public.cost_thresholds 
    SET current_monthly_spend = 0, last_reset_monthly = date_trunc('month', CURRENT_DATE)::date
    WHERE user_id = p_user_id;
  END IF;
  
  -- Update costs
  UPDATE public.cost_thresholds 
  SET 
    current_daily_spend = current_daily_spend + p_cost_amount,
    current_weekly_spend = current_weekly_spend + p_cost_amount,
    current_monthly_spend = current_monthly_spend + p_cost_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Check thresholds and return if alert needed
  SELECT * INTO current_record 
  FROM public.cost_thresholds 
  WHERE user_id = p_user_id;
  
  IF current_record.alerts_enabled THEN
    IF current_record.current_daily_spend >= current_record.daily_threshold THEN
      alert_type := 'daily_threshold_exceeded';
      needs_alert := true;
    ELSIF current_record.current_weekly_spend >= current_record.weekly_threshold THEN
      alert_type := 'weekly_threshold_exceeded';  
      needs_alert := true;
    ELSIF current_record.current_monthly_spend >= current_record.monthly_threshold THEN
      alert_type := 'monthly_threshold_exceeded';
      needs_alert := true;
    END IF;
  END IF;
  
  RETURN needs_alert;
END;
$$;

-- 6. Emergency Shutdown Check Function
CREATE OR REPLACE FUNCTION public.check_emergency_shutdown()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_emergency_shutdown FROM public.system_status ORDER BY created_at DESC LIMIT 1),
    false
  );
$$;

-- 7. Update triggers
CREATE TRIGGER update_cost_thresholds_updated_at
  BEFORE UPDATE ON public.cost_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint for cost thresholds
ALTER TABLE public.cost_thresholds ADD CONSTRAINT cost_thresholds_user_id_unique UNIQUE (user_id);