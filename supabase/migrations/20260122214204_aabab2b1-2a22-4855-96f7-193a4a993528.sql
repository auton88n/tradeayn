-- Fix the handle_new_user trigger to use correct column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  current_period_start TIMESTAMP;
BEGIN
  current_period_start := date_trunc('month', NOW());
  
  -- Create profile using CORRECT column names (contact_person instead of full_name, no phone)
  INSERT INTO public.profiles (user_id, contact_person, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create access_grants entry - START ACTIVE for direct signup flow
  INSERT INTO public.access_grants (user_id, is_active, tier, granted_at, updated_at)
  VALUES (NEW.id, true, 'free', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create user_ai_limits with free tier defaults (50 monthly credits)
  INSERT INTO public.user_ai_limits (
    user_id, 
    monthly_messages, 
    current_monthly_messages, 
    unlimited_until, 
    billing_period_start
  )
  VALUES (NEW.id, 50, 0, NULL, current_period_start)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;