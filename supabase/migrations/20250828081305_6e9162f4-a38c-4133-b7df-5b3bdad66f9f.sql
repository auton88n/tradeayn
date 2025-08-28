-- Grant admin role to the user
UPDATE user_roles 
SET role = 'admin'::app_role 
WHERE user_id = 'd2ceaad6-af0d-4001-a739-6b57f040e404';

-- Activate the access grant for the user
UPDATE access_grants 
SET 
  is_active = true,
  granted_at = now(),
  granted_by = 'd2ceaad6-af0d-4001-a739-6b57f040e404',
  notes = 'Self-granted admin access for system setup'
WHERE user_id = 'd2ceaad6-af0d-4001-a739-6b57f040e404';