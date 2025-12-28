-- ============================================
-- UNIFIED AYN SYSTEM: Memory, LLM Management & User Limits
-- ============================================

-- 1. User Preferences Table (Tier 1 - Permanent)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  preferred_language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'SAR',
  region TEXT DEFAULT 'SA',
  building_code TEXT DEFAULT 'SBC',
  personalization_enabled BOOLEAN DEFAULT true,
  communication_style TEXT DEFAULT 'casual',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences" ON public.user_preferences
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 2. User Memory Table (Tiered Memory System)
CREATE TABLE IF NOT EXISTS public.user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('profile', 'project', 'conversation', 'summary')),
  memory_key TEXT NOT NULL,
  memory_data JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 4),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, memory_type, memory_key)
);

-- Enable RLS
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own memory" ON public.user_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own memory" ON public.user_memory
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memory" ON public.user_memory
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_memory_user_type ON public.user_memory(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_user_memory_expires ON public.user_memory(expires_at) WHERE expires_at IS NOT NULL;

-- 3. LLM Models Configuration Table
CREATE TABLE IF NOT EXISTS public.llm_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  intent_type TEXT NOT NULL CHECK (intent_type IN ('chat', 'engineering', 'files', 'search')),
  priority INTEGER DEFAULT 1,
  cost_per_1k_input DECIMAL(10, 6) DEFAULT 0,
  cost_per_1k_output DECIMAL(10, 6) DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  max_tokens INTEGER DEFAULT 4096,
  supports_streaming BOOLEAN DEFAULT true,
  api_endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, model_id, intent_type)
);

-- Enable RLS
ALTER TABLE public.llm_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view enabled models" ON public.llm_models
  FOR SELECT USING (is_enabled = true);

CREATE POLICY "Admins can manage models" ON public.llm_models
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 4. LLM Usage Logs Table
CREATE TABLE IF NOT EXISTS public.llm_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  model_id UUID REFERENCES public.llm_models(id),
  intent_type TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_sar DECIMAL(10, 6) DEFAULT 0,
  response_time_ms INTEGER,
  was_fallback BOOLEAN DEFAULT false,
  fallback_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.llm_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage" ON public.llm_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage" ON public.llm_usage_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert usage" ON public.llm_usage_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_llm_usage_user ON public.llm_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_date ON public.llm_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_usage_model ON public.llm_usage_logs(model_id);

-- 5. LLM Failures Table
CREATE TABLE IF NOT EXISTS public.llm_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.llm_models(id),
  user_id UUID,
  error_type TEXT NOT NULL,
  error_message TEXT,
  request_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.llm_failures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view failures" ON public.llm_failures
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert failures" ON public.llm_failures
  FOR INSERT WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_llm_failures_date ON public.llm_failures(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_failures_model ON public.llm_failures(model_id);

-- 6. User AI Limits Table
CREATE TABLE IF NOT EXISTS public.user_ai_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  daily_messages INTEGER DEFAULT 10,
  daily_engineering INTEGER DEFAULT 3,
  daily_search INTEGER DEFAULT 5,
  daily_files INTEGER DEFAULT 3,
  monthly_cost_limit_sar DECIMAL(10, 2) DEFAULT 10.00,
  current_daily_messages INTEGER DEFAULT 0,
  current_daily_engineering INTEGER DEFAULT 0,
  current_daily_search INTEGER DEFAULT 0,
  current_daily_files INTEGER DEFAULT 0,
  current_month_cost_sar DECIMAL(10, 2) DEFAULT 0,
  daily_reset_at TIMESTAMPTZ DEFAULT now() + INTERVAL '1 day',
  monthly_reset_at TIMESTAMPTZ DEFAULT now() + INTERVAL '1 month',
  is_unlimited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_ai_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own limits" ON public.user_ai_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all limits" ON public.user_ai_limits
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 7. Admin AI Conversations Table
CREATE TABLE IF NOT EXISTS public.admin_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  context JSONB,
  actions_taken JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view own conversations" ON public.admin_ai_conversations
  FOR SELECT USING (auth.uid() = admin_id AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert conversations" ON public.admin_ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = admin_id AND has_role(auth.uid(), 'admin'));

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to get user context (memory + preferences)
CREATE OR REPLACE FUNCTION public.get_user_context(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  user_prefs JSONB;
  user_mem JSONB;
BEGIN
  -- Get preferences
  SELECT jsonb_build_object(
    'language', preferred_language,
    'currency', currency,
    'region', region,
    'building_code', building_code,
    'personalization', personalization_enabled,
    'style', communication_style
  ) INTO user_prefs
  FROM public.user_preferences
  WHERE user_id = _user_id;

  -- Get active memories (not expired)
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', memory_type,
      'key', memory_key,
      'data', memory_data,
      'priority', priority
    )
  ) INTO user_mem
  FROM public.user_memory
  WHERE user_id = _user_id
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY priority ASC, updated_at DESC
  LIMIT 20;

  result := jsonb_build_object(
    'preferences', COALESCE(user_prefs, '{}'::jsonb),
    'memories', COALESCE(user_mem, '[]'::jsonb)
  );

  RETURN result;
END;
$$;

-- Function to upsert user memory
CREATE OR REPLACE FUNCTION public.upsert_user_memory(
  _user_id UUID,
  _memory_type TEXT,
  _memory_key TEXT,
  _memory_data JSONB,
  _priority INTEGER DEFAULT 2
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  memory_id UUID;
  expiry TIMESTAMPTZ;
BEGIN
  -- Calculate expiry based on memory type
  expiry := CASE _memory_type
    WHEN 'profile' THEN NULL  -- Never expires
    WHEN 'project' THEN now() + INTERVAL '30 days'
    WHEN 'conversation' THEN now() + INTERVAL '48 hours'
    WHEN 'summary' THEN NULL  -- Never expires
    ELSE now() + INTERVAL '7 days'
  END;

  INSERT INTO public.user_memory (user_id, memory_type, memory_key, memory_data, priority, expires_at)
  VALUES (_user_id, _memory_type, _memory_key, _memory_data, _priority, expiry)
  ON CONFLICT (user_id, memory_type, memory_key)
  DO UPDATE SET
    memory_data = _memory_data,
    priority = _priority,
    expires_at = expiry,
    updated_at = now()
  RETURNING id INTO memory_id;

  RETURN memory_id;
END;
$$;

-- Function to check and update user AI limits
CREATE OR REPLACE FUNCTION public.check_user_ai_limit(
  _user_id UUID,
  _intent_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  limits RECORD;
  current_val INTEGER;
  limit_val INTEGER;
  field_name TEXT;
BEGIN
  -- Get or create user limits
  INSERT INTO public.user_ai_limits (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO limits FROM public.user_ai_limits WHERE user_id = _user_id;

  -- Reset daily if needed
  IF limits.daily_reset_at <= now() THEN
    UPDATE public.user_ai_limits
    SET 
      current_daily_messages = 0,
      current_daily_engineering = 0,
      current_daily_search = 0,
      current_daily_files = 0,
      daily_reset_at = now() + INTERVAL '1 day'
    WHERE user_id = _user_id;
    
    SELECT * INTO limits FROM public.user_ai_limits WHERE user_id = _user_id;
  END IF;

  -- Reset monthly if needed
  IF limits.monthly_reset_at <= now() THEN
    UPDATE public.user_ai_limits
    SET 
      current_month_cost_sar = 0,
      monthly_reset_at = now() + INTERVAL '1 month'
    WHERE user_id = _user_id;
    
    SELECT * INTO limits FROM public.user_ai_limits WHERE user_id = _user_id;
  END IF;

  -- Unlimited users bypass checks
  IF limits.is_unlimited THEN
    RETURN jsonb_build_object('allowed', true, 'unlimited', true);
  END IF;

  -- Determine which field to check
  CASE _intent_type
    WHEN 'chat' THEN
      current_val := limits.current_daily_messages;
      limit_val := limits.daily_messages;
      field_name := 'current_daily_messages';
    WHEN 'engineering' THEN
      current_val := limits.current_daily_engineering;
      limit_val := limits.daily_engineering;
      field_name := 'current_daily_engineering';
    WHEN 'search' THEN
      current_val := limits.current_daily_search;
      limit_val := limits.daily_search;
      field_name := 'current_daily_search';
    WHEN 'files' THEN
      current_val := limits.current_daily_files;
      limit_val := limits.daily_files;
      field_name := 'current_daily_files';
    ELSE
      current_val := limits.current_daily_messages;
      limit_val := limits.daily_messages;
      field_name := 'current_daily_messages';
  END CASE;

  -- Check if limit reached
  IF current_val >= limit_val THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit_reached',
      'current', current_val,
      'limit', limit_val,
      'resets_at', limits.daily_reset_at
    );
  END IF;

  -- Increment usage
  EXECUTE format('UPDATE public.user_ai_limits SET %I = %I + 1, updated_at = now() WHERE user_id = $1', field_name, field_name)
  USING _user_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'current', current_val + 1,
    'limit', limit_val,
    'remaining', limit_val - current_val - 1
  );
END;
$$;

-- Function to log LLM usage
CREATE OR REPLACE FUNCTION public.log_llm_usage(
  _user_id UUID,
  _model_id UUID,
  _intent_type TEXT,
  _input_tokens INTEGER,
  _output_tokens INTEGER,
  _response_time_ms INTEGER,
  _was_fallback BOOLEAN DEFAULT false,
  _fallback_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  log_id UUID;
  model_costs RECORD;
  total_cost DECIMAL(10, 6);
BEGIN
  -- Get model costs
  SELECT cost_per_1k_input, cost_per_1k_output INTO model_costs
  FROM public.llm_models WHERE id = _model_id;

  -- Calculate cost
  total_cost := (_input_tokens::decimal / 1000 * COALESCE(model_costs.cost_per_1k_input, 0)) +
                (_output_tokens::decimal / 1000 * COALESCE(model_costs.cost_per_1k_output, 0));

  -- Insert usage log
  INSERT INTO public.llm_usage_logs (
    user_id, model_id, intent_type, input_tokens, output_tokens,
    cost_sar, response_time_ms, was_fallback, fallback_reason
  )
  VALUES (
    _user_id, _model_id, _intent_type, _input_tokens, _output_tokens,
    total_cost, _response_time_ms, _was_fallback, _fallback_reason
  )
  RETURNING id INTO log_id;

  -- Update user's monthly cost
  UPDATE public.user_ai_limits
  SET current_month_cost_sar = current_month_cost_sar + total_cost
  WHERE user_id = _user_id;

  RETURN log_id;
END;
$$;

-- Function to generate monthly summary (run by cron)
CREATE OR REPLACE FUNCTION public.generate_monthly_summaries()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_rec RECORD;
  summary_count INTEGER := 0;
BEGIN
  -- Find users with conversation memories older than 30 days
  FOR user_rec IN
    SELECT DISTINCT user_id
    FROM public.user_memory
    WHERE memory_type = 'conversation'
      AND created_at < now() - INTERVAL '30 days'
  LOOP
    -- Create summary from old conversations (placeholder for AI summarization)
    INSERT INTO public.user_memory (user_id, memory_type, memory_key, memory_data, priority)
    VALUES (
      user_rec.user_id,
      'summary',
      'monthly_' || to_char(now() - INTERVAL '1 month', 'YYYY_MM'),
      jsonb_build_object(
        'period', to_char(now() - INTERVAL '1 month', 'YYYY-MM'),
        'generated_at', now(),
        'needs_ai_processing', true
      ),
      1
    )
    ON CONFLICT (user_id, memory_type, memory_key) DO NOTHING;
    
    summary_count := summary_count + 1;
  END LOOP;

  RETURN summary_count;
END;
$$;

-- Function to cleanup expired memories
CREATE OR REPLACE FUNCTION public.cleanup_expired_memories()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_memory
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- ============================================
-- SEED DEFAULT LLM MODELS
-- ============================================

INSERT INTO public.llm_models (provider, model_id, display_name, intent_type, priority, cost_per_1k_input, cost_per_1k_output, is_enabled, max_tokens, api_endpoint)
VALUES
  -- Chat models (fallback chain: Lovable AI -> OpenRouter Llama -> Qwen)
  ('lovable', 'google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'chat', 1, 0.00025, 0.001, true, 8192, 'https://ai.gateway.lovable.dev/v1/chat/completions'),
  ('openrouter', 'meta-llama/llama-3.1-70b-instruct', 'Llama 3.1 70B', 'chat', 2, 0.00052, 0.00075, true, 4096, 'https://openrouter.ai/api/v1/chat/completions'),
  ('openrouter', 'qwen/qwen-2.5-72b-instruct', 'Qwen 2.5 72B', 'chat', 3, 0.00035, 0.0004, true, 4096, 'https://openrouter.ai/api/v1/chat/completions'),
  
  -- Engineering models (fallback chain: DeepSeek R1 -> Gemini Pro -> Claude Haiku)
  ('openrouter', 'deepseek/deepseek-r1', 'DeepSeek R1', 'engineering', 1, 0.00014, 0.00028, true, 8192, 'https://openrouter.ai/api/v1/chat/completions'),
  ('lovable', 'google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'engineering', 2, 0.00125, 0.005, true, 8192, 'https://ai.gateway.lovable.dev/v1/chat/completions'),
  ('openrouter', 'anthropic/claude-3-haiku', 'Claude 3 Haiku', 'engineering', 3, 0.00025, 0.00125, true, 4096, 'https://openrouter.ai/api/v1/chat/completions'),
  
  -- File models
  ('lovable', 'google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'files', 1, 0.00025, 0.001, true, 8192, 'https://ai.gateway.lovable.dev/v1/chat/completions'),
  ('openrouter', 'google/gemini-flash-1.5', 'Gemini Flash 1.5', 'files', 2, 0.00025, 0.001, true, 8192, 'https://openrouter.ai/api/v1/chat/completions')
ON CONFLICT (provider, model_id, intent_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  cost_per_1k_input = EXCLUDED.cost_per_1k_input,
  cost_per_1k_output = EXCLUDED.cost_per_1k_output,
  updated_at = now();

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_user_memory_updated_at ON public.user_memory;
CREATE TRIGGER set_user_memory_updated_at
  BEFORE UPDATE ON public.user_memory
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_llm_models_updated_at ON public.llm_models;
CREATE TRIGGER set_llm_models_updated_at
  BEFORE UPDATE ON public.llm_models
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_user_ai_limits_updated_at ON public.user_ai_limits;
CREATE TRIGGER set_user_ai_limits_updated_at
  BEFORE UPDATE ON public.user_ai_limits
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();