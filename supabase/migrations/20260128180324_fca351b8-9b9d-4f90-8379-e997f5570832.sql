-- Update check_user_ai_limit to increment BOTH daily and monthly counters
CREATE OR REPLACE FUNCTION public.check_user_ai_limit(_user_id uuid, _intent_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  limits RECORD;
  current_val INTEGER;
  limit_val INTEGER;
  field_name TEXT;
  monthly_field_name TEXT;
BEGIN
  -- Insert default limits if not exists
  INSERT INTO public.user_ai_limits (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current limits
  SELECT * INTO limits FROM public.user_ai_limits WHERE user_id = _user_id;

  -- Reset daily counters if needed
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

  -- Reset monthly counters if needed (including message counters)
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

  -- Check if user is unlimited
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
    
    -- Increment BOTH daily and monthly usage
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
      'resets_at', limits.daily_reset_at,
      'is_unlimited', true
    );
  END IF;

  -- Determine which fields to check and increment
  CASE _intent_type
    WHEN 'chat' THEN
      current_val := COALESCE(limits.current_daily_messages, 0);
      limit_val := COALESCE(limits.daily_messages, 10);
      field_name := 'current_daily_messages';
      monthly_field_name := 'current_monthly_messages';
    WHEN 'engineering' THEN
      current_val := COALESCE(limits.current_daily_engineering, 0);
      limit_val := COALESCE(limits.daily_engineering, 3);
      field_name := 'current_daily_engineering';
      monthly_field_name := 'current_monthly_engineering';
    ELSE
      current_val := COALESCE(limits.current_daily_messages, 0);
      limit_val := COALESCE(limits.daily_messages, 10);
      field_name := 'current_daily_messages';
      monthly_field_name := 'current_monthly_messages';
  END CASE;

  -- Check if limit exceeded
  IF current_val >= limit_val THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'current', current_val,
      'limit', limit_val,
      'remaining', 0,
      'resets_at', limits.daily_reset_at,
      'error', 'Daily limit exceeded'
    );
  END IF;

  -- Increment BOTH daily and monthly usage
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
    'remaining', (limit_val - current_val - 1),
    'resets_at', limits.daily_reset_at
  );
END;
$function$;