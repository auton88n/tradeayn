-- Update check_user_ai_limit to be tier-aware:
-- Free tier: enforces daily_messages (5/day)
-- Paid tiers (starter/pro/business): enforces monthly_messages

CREATE OR REPLACE FUNCTION public.check_user_ai_limit(_user_id uuid, _intent_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  limits RECORD;
  subscription_tier TEXT;
  current_val INTEGER;
  limit_val INTEGER;
  bonus_val INTEGER;
  total_limit INTEGER;
  field_name TEXT;
  monthly_field_name TEXT;
  is_daily_limit BOOLEAN;
  reset_time TIMESTAMPTZ;
BEGIN
  -- Insert default limits if not exists
  INSERT INTO public.user_ai_limits (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current limits
  SELECT * INTO limits FROM public.user_ai_limits WHERE user_id = _user_id;

  -- Get subscription tier (default to 'free' if not found)
  SELECT COALESCE(us.subscription_tier, 'free') INTO subscription_tier
  FROM public.user_subscriptions us
  WHERE us.user_id = _user_id;
  
  IF subscription_tier IS NULL THEN
    subscription_tier := 'free';
  END IF;

  -- Reset daily counters if needed (always for tracking)
  IF limits.daily_reset_at IS NULL OR limits.daily_reset_at <= now() THEN
    UPDATE public.user_ai_limits SET
      current_daily_messages = 0,
      current_daily_engineering = 0,
      current_daily_files = 0,
      current_daily_search = 0,
      daily_reset_at = now() + INTERVAL '1 day'
    WHERE user_id = _user_id;
    
    -- Refresh limits after reset
    SELECT * INTO limits FROM public.user_ai_limits WHERE user_id = _user_id;
  END IF;

  -- Reset monthly counters if needed
  IF limits.monthly_reset_at IS NULL OR limits.monthly_reset_at <= now() THEN
    UPDATE public.user_ai_limits SET
      current_month_cost_sar = 0,
      current_monthly_messages = 0,
      current_monthly_engineering = 0,
      monthly_reset_at = now() + INTERVAL '1 month'
    WHERE user_id = _user_id;
    
    -- Refresh limits after reset
    SELECT * INTO limits FROM public.user_ai_limits WHERE user_id = _user_id;
  END IF;

  -- Check if user is unlimited (admin override or enterprise tier)
  IF limits.is_unlimited = true THEN
    -- Still increment counters for tracking, but don't enforce limits
    CASE _intent_type
      WHEN 'chat' THEN
        field_name := 'current_daily_messages';
        monthly_field_name := 'current_monthly_messages';
      WHEN 'engineering' THEN
        field_name := 'current_daily_engineering';
        monthly_field_name := 'current_monthly_engineering';
      ELSE
        field_name := 'current_daily_messages';
        monthly_field_name := 'current_monthly_messages';
    END CASE;
    
    -- Increment BOTH daily and monthly usage for tracking
    EXECUTE format(
      'UPDATE public.user_ai_limits SET 
        %I = COALESCE(%I, 0) + 1,
        %I = COALESCE(%I, 0) + 1,
        updated_at = now() 
      WHERE user_id = $1',
      field_name, field_name,
      monthly_field_name, monthly_field_name
    ) USING _user_id;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'current', 0,
      'limit', -1,
      'remaining', -1,
      'resets_at', limits.monthly_reset_at,
      'is_unlimited', true,
      'tier', subscription_tier,
      'is_daily', false
    );
  END IF;

  -- Determine limit type based on subscription tier
  -- Free tier: daily limits | Paid tiers: monthly limits
  is_daily_limit := (subscription_tier = 'free' OR subscription_tier IS NULL);
  bonus_val := COALESCE(limits.bonus_credits, 0);

  -- Determine which fields to check and increment
  CASE _intent_type
    WHEN 'chat' THEN
      IF is_daily_limit THEN
        current_val := COALESCE(limits.current_daily_messages, 0);
        limit_val := COALESCE(limits.daily_messages, 5);
        reset_time := limits.daily_reset_at;
      ELSE
        current_val := COALESCE(limits.current_monthly_messages, 0);
        limit_val := COALESCE(limits.monthly_messages, 50);
        reset_time := limits.monthly_reset_at;
      END IF;
      field_name := 'current_daily_messages';
      monthly_field_name := 'current_monthly_messages';
    WHEN 'engineering' THEN
      IF is_daily_limit THEN
        current_val := COALESCE(limits.current_daily_engineering, 0);
        limit_val := COALESCE(limits.daily_engineering, 1);
        reset_time := limits.daily_reset_at;
      ELSE
        current_val := COALESCE(limits.current_monthly_engineering, 0);
        limit_val := COALESCE(limits.monthly_engineering, 10);
        reset_time := limits.monthly_reset_at;
      END IF;
      field_name := 'current_daily_engineering';
      monthly_field_name := 'current_monthly_engineering';
    ELSE
      IF is_daily_limit THEN
        current_val := COALESCE(limits.current_daily_messages, 0);
        limit_val := COALESCE(limits.daily_messages, 5);
        reset_time := limits.daily_reset_at;
      ELSE
        current_val := COALESCE(limits.current_monthly_messages, 0);
        limit_val := COALESCE(limits.monthly_messages, 50);
        reset_time := limits.monthly_reset_at;
      END IF;
      field_name := 'current_daily_messages';
      monthly_field_name := 'current_monthly_messages';
  END CASE;

  -- Total limit includes bonus credits (only applies to message limits)
  IF _intent_type IN ('chat', 'files', 'search', 'image') THEN
    total_limit := limit_val + bonus_val;
  ELSE
    total_limit := limit_val;
  END IF;

  -- Check if limit exceeded
  IF current_val >= total_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'current', current_val,
      'limit', limit_val,
      'bonus_credits', bonus_val,
      'total_limit', total_limit,
      'remaining', 0,
      'resets_at', reset_time,
      'error', CASE WHEN is_daily_limit THEN 'Daily limit exceeded' ELSE 'Monthly limit exceeded' END,
      'tier', subscription_tier,
      'is_daily', is_daily_limit
    );
  END IF;

  -- Increment BOTH daily and monthly usage for tracking
  EXECUTE format(
    'UPDATE public.user_ai_limits SET 
      %I = COALESCE(%I, 0) + 1,
      %I = COALESCE(%I, 0) + 1,
      updated_at = now() 
    WHERE user_id = $1',
    field_name, field_name,
    monthly_field_name, monthly_field_name
  ) USING _user_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'current', current_val + 1,
    'limit', limit_val,
    'bonus_credits', bonus_val,
    'total_limit', total_limit,
    'remaining', (total_limit - current_val - 1),
    'resets_at', reset_time,
    'tier', subscription_tier,
    'is_daily', is_daily_limit
  );
END;
$function$;