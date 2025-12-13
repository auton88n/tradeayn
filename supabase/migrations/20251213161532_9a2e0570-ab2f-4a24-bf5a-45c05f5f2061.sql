-- Create a security definer function that logs admin message access
-- This will be called from the RLS policy to log access while checking permissions
CREATE OR REPLACE FUNCTION public.admin_can_view_message_with_logging(message_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN false;
  END IF;
  
  -- Log the access if admin is viewing another user's message
  IF auth.uid() != message_user_id THEN
    INSERT INTO public.security_logs (
      user_id,
      action,
      details,
      severity,
      ip_address
    ) VALUES (
      auth.uid(),
      'admin_message_access',
      jsonb_build_object(
        'target_user_id', message_user_id,
        'accessed_at', now(),
        'access_type', 'message_view'
      ),
      'high',
      inet_client_addr()
    );
  END IF;
  
  RETURN true;
END;
$$;

-- Update the admin view policy to use the logging function
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages with audit logging"
ON public.messages
FOR SELECT
USING (public.admin_can_view_message_with_logging(user_id));

-- Add comment for documentation
COMMENT ON FUNCTION public.admin_can_view_message_with_logging(uuid) IS 'Checks admin role and logs when admins access other users messages for security audit compliance';