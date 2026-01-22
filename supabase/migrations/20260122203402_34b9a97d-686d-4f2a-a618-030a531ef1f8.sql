-- Drop the conflicting function first
DROP FUNCTION IF EXISTS log_admin_action(TEXT, UUID, TEXT, JSONB);

-- Recreate with unique signature
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_email TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') AND NOT has_role(auth.uid(), 'duty') THEN
    RAISE EXCEPTION 'Only admins can log actions';
  END IF;
  
  INSERT INTO admin_audit_logs (admin_id, action_type, target_user_id, target_email, details)
  VALUES (auth.uid(), p_action_type, p_target_user_id, p_target_email, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION log_admin_action(TEXT, UUID, TEXT, JSONB) TO authenticated;