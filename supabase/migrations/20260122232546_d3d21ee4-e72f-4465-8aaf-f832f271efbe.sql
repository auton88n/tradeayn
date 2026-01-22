-- =====================================================
-- SECURITY FIX: Complete remaining RLS policy fixes
-- =====================================================

-- 1. Fix handle_new_user function - add SET search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_period_start TIMESTAMP;
BEGIN
  current_period_start := date_trunc('month', NOW());
  
  -- Create profile using CORRECT column names
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
$function$;

-- 2. Fix llm_failures INSERT policy - restrict to service role only
DROP POLICY IF EXISTS "Only service role can insert failures" ON public.llm_failures;
CREATE POLICY "Only service role can insert failures" 
ON public.llm_failures 
FOR INSERT 
WITH CHECK (
  (SELECT (auth.jwt() ->> 'role'::text)) = 'service_role'::text
);

-- 3. Fix llm_usage_logs INSERT policy - restrict to service role only  
DROP POLICY IF EXISTS "Only service role can insert usage" ON public.llm_usage_logs;
CREATE POLICY "Only service role can insert usage" 
ON public.llm_usage_logs 
FOR INSERT 
WITH CHECK (
  (SELECT (auth.jwt() ->> 'role'::text)) = 'service_role'::text
);

-- 4. Fix service_applications INSERT policy - add rate limiting check
DROP POLICY IF EXISTS "Anyone can submit service applications" ON public.service_applications;
CREATE POLICY "Anyone can submit service applications" 
ON public.service_applications 
FOR INSERT 
WITH CHECK (
  check_application_rate_limit(email)
);

-- 5. Fix support_tickets INSERT policy - require valid data
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;
CREATE POLICY "Anyone can create tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (
  -- Either authenticated user with their own user_id
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR 
  -- Or guest with valid email and no user_id
  (auth.uid() IS NULL AND user_id IS NULL AND guest_email IS NOT NULL AND length(guest_email) > 5)
);