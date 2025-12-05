-- Drop and recreate get_user_profile_secure function with correct return type (no phone column)
DROP FUNCTION IF EXISTS public.get_user_profile_secure(uuid);

CREATE OR REPLACE FUNCTION public.get_user_profile_secure(_user_id uuid)
RETURNS TABLE(id uuid, user_id uuid, company_name text, contact_person text, business_type text, business_context text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify access rights
  IF auth.uid() != _user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM public.log_security_event(
      'unauthorized_profile_access_attempt',
      jsonb_build_object(
        'requested_user_id', _user_id,
        'requesting_user_id', auth.uid()
      ),
      'critical'
    );
    RAISE EXCEPTION 'Access denied: insufficient permissions to view this profile';
  END IF;

  -- Log the access (removed phone from accessed fields)
  PERFORM public.log_profiles_sensitive_access(
    'SECURE_SELECT',
    _user_id,
    ARRAY['company_name', 'contact_person', 'business_type', 'business_context']
  );

  -- Return the data (removed phone column)
  RETURN QUERY
  SELECT p.id, p.user_id, p.company_name, p.contact_person, 
         p.business_type, p.business_context, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.user_id = _user_id;
END;
$$;