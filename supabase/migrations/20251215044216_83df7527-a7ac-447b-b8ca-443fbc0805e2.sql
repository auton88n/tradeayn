-- Create admin notification config table
CREATE TABLE public.admin_notification_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL UNIQUE,
  recipient_email text NOT NULL DEFAULT 'crossmint7@gmail.com',
  is_enabled boolean NOT NULL DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create admin notification log table
CREATE TABLE public.admin_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  content text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_log ENABLE ROW LEVEL SECURITY;

-- RLS policies - admin only
CREATE POLICY "Only admins can manage notification config"
ON public.admin_notification_config FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can view notification logs"
ON public.admin_notification_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert notification logs"
ON public.admin_notification_log FOR INSERT
WITH CHECK (true);

-- Insert default notification configs
INSERT INTO public.admin_notification_config (notification_type, recipient_email, is_enabled, settings)
VALUES 
  ('access_request', 'crossmint7@gmail.com', true, '{"instant": true}'::jsonb),
  ('daily_report', 'crossmint7@gmail.com', true, '{"schedule": "08:00 UTC"}'::jsonb),
  ('security_alert', 'crossmint7@gmail.com', true, '{"severity_threshold": "high"}'::jsonb);

-- Create function to notify on new access request
CREATE OR REPLACE FUNCTION public.notify_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_enabled boolean;
  user_email text;
BEGIN
  -- Check if notifications are enabled
  SELECT is_enabled INTO config_enabled
  FROM admin_notification_config
  WHERE notification_type = 'access_request';
  
  IF config_enabled IS TRUE AND NEW.requires_approval = true AND NEW.is_active = false THEN
    -- Get user email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    
    -- Call edge function via pg_net
    PERFORM net.http_post(
      url := 'https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/admin-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw'
      ),
      body := jsonb_build_object(
        'type', 'access_request',
        'user_id', NEW.user_id,
        'user_email', user_email,
        'created_at', NEW.created_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to notify on security alerts
CREATE OR REPLACE FUNCTION public.notify_security_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_enabled boolean;
BEGIN
  -- Check if notifications are enabled and severity is high/critical
  SELECT is_enabled INTO config_enabled
  FROM admin_notification_config
  WHERE notification_type = 'security_alert';
  
  IF config_enabled IS TRUE AND NEW.severity IN ('high', 'critical') THEN
    -- Call edge function via pg_net
    PERFORM net.http_post(
      url := 'https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/admin-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw'
      ),
      body := jsonb_build_object(
        'type', 'security_alert',
        'action', NEW.action,
        'severity', NEW.severity,
        'details', NEW.details,
        'ip_address', NEW.ip_address::text,
        'created_at', NEW.created_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_access_request_created
AFTER INSERT ON public.access_grants
FOR EACH ROW
EXECUTE FUNCTION notify_access_request();

CREATE TRIGGER on_security_alert_created
AFTER INSERT ON public.security_logs
FOR EACH ROW
EXECUTE FUNCTION notify_security_alert();

-- Create updated_at trigger for config
CREATE TRIGGER update_admin_notification_config_updated_at
BEFORE UPDATE ON public.admin_notification_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();