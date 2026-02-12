
-- Table to store bot tokens for each AI agent
CREATE TABLE public.agent_telegram_bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  bot_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS — service role only (no anon/user access)
ALTER TABLE public.agent_telegram_bots ENABLE ROW LEVEL SECURITY;

-- No public policies = only service_role can read/write
-- Edge functions use service_role key, so they'll have full access
