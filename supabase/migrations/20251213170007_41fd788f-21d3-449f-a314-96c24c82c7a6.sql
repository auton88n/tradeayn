-- Drop the old function first since return type is changing
DROP FUNCTION IF EXISTS public.get_user_profile_secure(uuid);

-- Recreate with correct columns (without non-existent business_context)
CREATE OR REPLACE FUNCTION public.get_user_profile_secure(_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, company_name text, contact_person text, business_type text, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Log the access (only existing fields)
  PERFORM public.log_profiles_sensitive_access(
    'SECURE_SELECT',
    _user_id,
    ARRAY['company_name', 'contact_person', 'business_type', 'avatar_url']
  );

  -- Return the data (only existing columns - business_context should be fetched via get_profile_business_context)
  RETURN QUERY
  SELECT p.id, p.user_id, p.company_name, p.contact_person, 
         p.business_type, p.avatar_url, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.user_id = _user_id;
END;
$function$;