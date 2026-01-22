-- Create a secure RPC function for role management
-- Using SECURITY DEFINER to bypass RLS and prevent future issues
CREATE OR REPLACE FUNCTION manage_user_role(
  p_target_user_id UUID,
  p_new_role app_role
) RETURNS void AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can manage roles';
  END IF;
  
  -- Prevent self-demotion for safety
  IF p_target_user_id = auth.uid() AND p_new_role != 'admin' THEN
    RAISE EXCEPTION 'Cannot demote yourself';
  END IF;
  
  -- Upsert the role
  INSERT INTO user_roles (user_id, role)
  VALUES (p_target_user_id, p_new_role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = p_new_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION manage_user_role(UUID, app_role) TO authenticated;