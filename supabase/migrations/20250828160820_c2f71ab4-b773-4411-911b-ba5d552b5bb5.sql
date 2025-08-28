-- Fix function search_path security vulnerability
-- Set explicit search_path on all functions to prevent schema poisoning

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

-- Fix has_active_access function  
CREATE OR REPLACE FUNCTION public.has_active_access(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.access_grants
    WHERE user_id = _user_id 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  )
$function$;

-- Fix check_usage_limit function
CREATE OR REPLACE FUNCTION public.check_usage_limit(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN ag.monthly_limit IS NULL THEN true -- No limit set
    WHEN ag.current_month_usage < ag.monthly_limit THEN true
    ELSE false
  END
  FROM access_grants ag
  WHERE ag.user_id = _user_id 
  AND ag.is_active = true
  AND (ag.expires_at IS NULL OR ag.expires_at > now());
$function$;

-- Fix get_usage_stats function
CREATE OR REPLACE FUNCTION public.get_usage_stats(_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(user_id uuid, user_email text, company_name text, monthly_limit integer, current_usage integer, usage_percentage numeric, reset_date date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ag.user_id,
    au.email as user_email,
    p.company_name,
    ag.monthly_limit,
    ag.current_month_usage as current_usage,
    CASE 
      WHEN ag.monthly_limit IS NULL THEN NULL
      WHEN ag.monthly_limit = 0 THEN 100
      ELSE ROUND((ag.current_month_usage::numeric / ag.monthly_limit::numeric) * 100, 2)
    END as usage_percentage,
    ag.usage_reset_date as reset_date
  FROM access_grants ag
  LEFT JOIN auth.users au ON ag.user_id = au.id
  LEFT JOIN profiles p ON ag.user_id = p.user_id
  WHERE (_user_id IS NULL OR ag.user_id = _user_id)
  AND ag.is_active = true;
$function$;

-- Fix cleanup_old_system_reports function
CREATE OR REPLACE FUNCTION public.cleanup_old_system_reports()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.system_reports 
  WHERE generated_at < (now() - interval '30 days');
END;
$function$;