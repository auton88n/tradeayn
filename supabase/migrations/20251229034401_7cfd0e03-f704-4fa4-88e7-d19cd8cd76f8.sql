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
BEGIN
  -- Ensure a row exists (table defaults handle initial values)
  INSERT INTO public.user_ai_limits (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO limits
  FROM public.user_ai_limits
  WHERE user_id = _user_id;

  -- Reset daily counters if needed (also handles NULL reset timestamps)
  IF limits.daily_reset_at IS NULL OR limits.daily_reset_at <= now() THEN
    UPDATE public.user_ai_limits
    SET
      current_daily_messages = 0,
      current_daily_engineering = 0,
      current_daily_search = 0,
      current_daily_files = 0,
      daily_reset_at = now() + INTERVAL '1 day',
      updated_at = now()
    WHERE user_id = _user_id;

    SELECT * INTO limits
    FROM public.user_ai_limits
    WHERE user_id = _user_id;
  END IF;

  -- Reset monthly counters if needed (also handles NULL reset timestamps)
  IF limits.monthly_reset_at IS NULL OR limits.monthly_reset_at <= now() THEN
    UPDATE public.user_ai_limits
    SET
      current_month_cost_sar = 0,
      monthly_reset_at = now() + INTERVAL '1 month',
      updated_at = now()
    WHERE user_id = _user_id;

    SELECT * INTO limits
    FROM public.user_ai_limits
    WHERE user_id = _user_id;
  END IF;

  -- Unlimited users bypass all checks
  IF COALESCE(limits.is_unlimited, false) THEN
    RETURN jsonb_build_object('allowed', true, 'unlimited', true);
  END IF;

  -- Determine which field to check (COALESCE protects against NULLs)
  CASE _intent_type
    WHEN 'chat' THEN
      current_val := COALESCE(limits.current_daily_messages, 0);
      limit_val := COALESCE(limits.daily_messages, 10);
      field_name := 'current_daily_messages';
    WHEN 'engineering' THEN
      current_val := COALESCE(limits.current_daily_engineering, 0);
      limit_val := COALESCE(limits.daily_engineering, 3);
      field_name := 'current_daily_engineering';
    WHEN 'search' THEN
      current_val := COALESCE(limits.current_daily_search, 0);
      limit_val := COALESCE(limits.daily_search, 5);
      field_name := 'current_daily_search';
    WHEN 'files' THEN
      current_val := COALESCE(limits.current_daily_files, 0);
      limit_val := COALESCE(limits.daily_files, 3);
      field_name := 'current_daily_files';
    ELSE
      current_val := COALESCE(limits.current_daily_messages, 0);
      limit_val := COALESCE(limits.daily_messages, 10);
      field_name := 'current_daily_messages';
  END CASE;

  -- Enforce limit
  IF current_val >= limit_val THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit_reached',
      'current', current_val,
      'limit', limit_val,
      'resets_at', limits.daily_reset_at
    );
  END IF;

  -- Increment usage (NULL-safe)
  EXECUTE format(
    'UPDATE public.user_ai_limits SET %I = COALESCE(%I, 0) + 1, updated_at = now() WHERE user_id = $1',
    field_name,
    field_name
  )
  USING _user_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'current', current_val + 1,
    'limit', limit_val,
    'remaining', (limit_val - current_val - 1),
    'resets_at', limits.daily_reset_at
  );
END;
$function$;
