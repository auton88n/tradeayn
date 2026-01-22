-- Update handle_new_user() to auto-activate new users immediately (no approval required)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, company_name, contact_person)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create access grant entry - AUTO-ACTIVATED (no approval needed)
  INSERT INTO public.access_grants (
    user_id, 
    is_active,
    requires_approval,
    auth_method,
    monthly_limit
  )
  VALUES (
    NEW.id, 
    true,    -- Auto-activate immediately
    false,   -- No approval required
    'email',
    50       -- Free tier: 50 credits/month
  );
  
  -- Create user_ai_limits entry with Free tier defaults
  INSERT INTO public.user_ai_limits (
    user_id,
    monthly_messages,
    current_monthly_messages,
    monthly_engineering,
    current_monthly_engineering,
    monthly_reset_at
  )
  VALUES (
    NEW.id,
    50,   -- Free tier credits
    0,    -- Starting usage
    10,   -- Free tier engineering calcs
    0,    -- Starting usage
    (CURRENT_DATE + INTERVAL '1 month')::timestamptz
  );
  
  -- Create user_subscriptions entry with Free tier
  INSERT INTO public.user_subscriptions (
    user_id,
    subscription_tier,
    status
  )
  VALUES (
    NEW.id,
    'free',
    'active'
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;