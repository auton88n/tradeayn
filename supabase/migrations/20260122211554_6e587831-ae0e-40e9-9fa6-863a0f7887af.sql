-- Create email_logs table to track sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent',
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert (from edge functions)
CREATE POLICY "Service role can manage email logs"
  ON public.email_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups on user and email type
CREATE INDEX IF NOT EXISTS idx_email_logs_user_type ON public.email_logs(user_id, email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- Update handle_new_user to set is_active = false (requires email verification)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_period_start TIMESTAMP;
BEGIN
  current_period_start := date_trunc('month', NOW());
  
  -- Create basic profile in profiles table
  INSERT INTO public.profiles (user_id, full_name, phone, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create access_grants entry - START INACTIVE until email verified
  INSERT INTO public.access_grants (user_id, is_active, tier, granted_at, updated_at)
  VALUES (NEW.id, false, 'free', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create user_ai_limits with free tier defaults (50 messages/month)
  INSERT INTO public.user_ai_limits (
    user_id, 
    monthly_messages, 
    current_monthly_messages, 
    unlimited_until, 
    billing_period_start
  )
  VALUES (
    NEW.id, 
    50, 
    0, 
    NULL, 
    current_period_start
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create function to handle email confirmation and activate user
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- When email_confirmed_at changes from NULL to a value, activate user
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.access_grants 
    SET is_active = true, updated_at = NOW()
    WHERE user_id = NEW.id;
    
    -- Log the activation
    RAISE LOG 'User % activated after email confirmation', NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to activate on email confirmation
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_confirmed();