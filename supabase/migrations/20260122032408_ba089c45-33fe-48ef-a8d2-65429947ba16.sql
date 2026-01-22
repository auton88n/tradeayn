-- Create user_subscriptions table to track Stripe subscription data
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'business')),
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'canceled', 'past_due', 'inactive')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add monthly tracking columns to user_ai_limits
ALTER TABLE public.user_ai_limits 
ADD COLUMN IF NOT EXISTS monthly_messages INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS current_monthly_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', now()) + interval '1 month'),
ADD COLUMN IF NOT EXISTS monthly_engineering INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS current_monthly_engineering INTEGER DEFAULT 0;

-- Create trigger to update updated_at on user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);