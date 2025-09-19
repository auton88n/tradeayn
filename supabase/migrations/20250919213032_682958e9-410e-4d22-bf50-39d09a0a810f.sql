-- Fix RLS policies for profiles table to prevent data leaks
-- Drop conflicting policies first
DROP POLICY IF EXISTS "Block anonymous SELECT on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous INSERT on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous UPDATE on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous DELETE on profiles" ON public.profiles;

-- Create secure, non-conflicting policies
CREATE POLICY "Strict user isolation for profiles SELECT"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Strict admin access for profiles SELECT"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Strict user isolation for profiles INSERT"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Strict user isolation for profiles UPDATE"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Strict user isolation for profiles DELETE"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Strict admin access for profiles DELETE"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Add security logging function for chat operations
CREATE OR REPLACE FUNCTION log_chat_security_event(
  _action text,
  _session_id uuid DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_logs (
    user_id,
    action,
    details,
    severity,
    ip_address
  ) VALUES (
    auth.uid(),
    _action,
    jsonb_build_object(
      'session_id', _session_id,
      'timestamp', now(),
      'additional_details', _details
    ),
    'medium',
    inet_client_addr()
  );
END;
$$;

-- Add function to safely delete chat sessions
CREATE OR REPLACE FUNCTION delete_user_chat_sessions(
  _user_id uuid,
  _session_ids uuid[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_count INTEGER;
  deleted_count INTEGER;
BEGIN
  -- Verify user owns all sessions
  SELECT COUNT(*) INTO session_count
  FROM messages
  WHERE user_id = _user_id
    AND session_id = ANY(_session_ids);
  
  -- Get unique sessions from provided IDs
  SELECT COUNT(DISTINCT session_id) INTO deleted_count
  FROM messages
  WHERE user_id = _user_id
    AND session_id = ANY(_session_ids);
  
  -- Only proceed if user owns all sessions
  IF session_count = 0 OR deleted_count = 0 THEN
    PERFORM log_chat_security_event(
      'chat_deletion_blocked',
      NULL,
      jsonb_build_object('reason', 'user_does_not_own_sessions', 'session_ids', _session_ids)
    );
    RETURN FALSE;
  END IF;
  
  -- Delete all messages for these sessions (only for this user)
  DELETE FROM messages
  WHERE user_id = _user_id
    AND session_id = ANY(_session_ids);
  
  -- Log successful deletion
  PERFORM log_chat_security_event(
    'chat_deletion_success',
    NULL,
    jsonb_build_object('sessions_deleted', deleted_count, 'session_ids', _session_ids)
  );
  
  RETURN TRUE;
END;
$$;

-- Add function to validate session ownership
CREATE OR REPLACE FUNCTION validate_session_ownership(
  _user_id uuid,
  _session_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM messages
    WHERE user_id = _user_id
      AND session_id = _session_id
    LIMIT 1
  );
$$;