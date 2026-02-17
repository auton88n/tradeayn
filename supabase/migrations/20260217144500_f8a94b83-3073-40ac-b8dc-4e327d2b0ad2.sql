
-- 1. Update handle_new_user to also create access_grants row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, contact_person, company_name, business_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'contact_person', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'business_type', '')
  );

  INSERT INTO public.user_settings (user_id, has_accepted_terms)
  VALUES (NEW.id, false)
  ON CONFLICT (user_id) DO NOTHING;

  -- Ensure new user appears in admin panel
  INSERT INTO public.access_grants (user_id, is_active, monthly_limit, requires_approval)
  VALUES (NEW.id, false, 5, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Backfill missing access_grants for existing users
INSERT INTO public.access_grants (user_id, is_active, monthly_limit, requires_approval)
SELECT p.user_id, false, 5, false
FROM public.profiles p
LEFT JOIN public.access_grants ag ON p.user_id = ag.user_id
WHERE ag.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
