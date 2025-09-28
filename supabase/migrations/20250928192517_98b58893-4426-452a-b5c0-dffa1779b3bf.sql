-- Comprehensive RLS policies for alert_history table to protect customer email addresses
-- This fixes the security vulnerability by ensuring only admins can access alert history data

-- First, ensure RLS is enabled (should already be enabled)
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policy to recreate with better security
DROP POLICY IF EXISTS "Only admins can view alert history" ON public.alert_history;

-- Comprehensive admin-only policies for all operations
CREATE POLICY "Admins can select alert history"
  ON public.alert_history
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert alert history"
  ON public.alert_history
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update alert history"
  ON public.alert_history
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete alert history"
  ON public.alert_history
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Additional security: Create a function to log access to sensitive alert data
CREATE OR REPLACE FUNCTION public.log_alert_history_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any access to alert history for security auditing
  PERFORM public.log_security_event(
    'alert_history_access',
    jsonb_build_object(
      'operation', TG_OP,
      'alert_id', COALESCE(NEW.id, OLD.id),
      'alert_type', COALESCE(NEW.alert_type, OLD.alert_type),
      'accessed_by', auth.uid(),
      'timestamp', now()
    ),
    'medium'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to log all access to alert history
DROP TRIGGER IF EXISTS log_alert_history_access_trigger ON public.alert_history;
CREATE TRIGGER log_alert_history_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.alert_history
  FOR EACH ROW EXECUTE FUNCTION public.log_alert_history_access();

-- Create a secure function for system-level alert insertion (bypasses RLS for automated alerts)
CREATE OR REPLACE FUNCTION public.create_system_alert(
  p_alert_type text,
  p_recipient_email text,
  p_subject text,
  p_content text,
  p_user_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_id uuid;
BEGIN
  -- This function can be called by edge functions to create system alerts
  -- It bypasses RLS for automated system notifications
  
  INSERT INTO public.alert_history (
    alert_type,
    recipient_email,
    subject,
    content,
    user_id,
    metadata,
    status
  ) VALUES (
    p_alert_type,
    p_recipient_email,
    p_subject,
    p_content,
    p_user_id,
    p_metadata,
    'sent'
  ) RETURNING id INTO alert_id;
  
  -- Log the system alert creation
  PERFORM public.log_security_event(
    'system_alert_created',
    jsonb_build_object(
      'alert_id', alert_id,
      'alert_type', p_alert_type,
      'recipient_email_hash', md5(p_recipient_email), -- Hash email for privacy
      'created_via', 'system_function'
    ),
    'info'
  );
  
  RETURN alert_id;
END;
$$;