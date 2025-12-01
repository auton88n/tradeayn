-- Create system_config table for Admin settings
CREATE TABLE IF NOT EXISTS public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage system config"
ON public.system_config FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS total_sessions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON public.system_config(key);