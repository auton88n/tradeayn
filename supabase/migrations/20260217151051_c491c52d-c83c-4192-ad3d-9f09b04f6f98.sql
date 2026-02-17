
-- Fix Step 1: Correct daily_messages and daily_engineering for all free tier users
UPDATE public.user_ai_limits
SET daily_messages = 5, daily_engineering = 1, updated_at = now()
WHERE user_id IN (
  SELECT ual.user_id FROM public.user_ai_limits ual
  LEFT JOIN public.user_subscriptions us ON us.user_id = ual.user_id
  WHERE COALESCE(us.subscription_tier, 'free') = 'free'
    AND (ual.daily_messages != 5 OR ual.daily_engineering != 1)
);

-- Fix Step 2: Correct monthly_limit in access_grants for all free tier users
UPDATE public.access_grants
SET monthly_limit = 5, updated_at = now()
WHERE user_id IN (
  SELECT ag.user_id FROM public.access_grants ag
  LEFT JOIN public.user_subscriptions us ON us.user_id = ag.user_id
  WHERE COALESCE(us.subscription_tier, 'free') = 'free'
    AND (ag.monthly_limit IS NULL OR ag.monthly_limit != 5)
);
