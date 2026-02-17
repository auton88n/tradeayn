
-- Update handle_new_user trigger to set is_active = true for new sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create access grant - active immediately with free tier
  INSERT INTO public.access_grants (user_id, is_active, monthly_limit, requires_approval)
  VALUES (NEW.id, true, 5, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Activate all existing inactive users
UPDATE public.access_grants
SET is_active = true, granted_at = now()
WHERE is_active = false;
