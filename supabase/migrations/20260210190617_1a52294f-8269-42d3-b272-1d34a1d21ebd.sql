
-- Create immutable consent audit log table
CREATE TABLE public.terms_consent_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL DEFAULT '2026-02-07',
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  ai_disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.terms_consent_log ENABLE ROW LEVEL SECURITY;

-- Users can insert their own consent records
CREATE POLICY "Users can insert own consent"
ON public.terms_consent_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can read their own consent records
CREATE POLICY "Users can read own consent"
ON public.terms_consent_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all consent records (for admin panel proof)
CREATE POLICY "Admins can read all consent"
ON public.terms_consent_log
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- No UPDATE or DELETE policies = immutable audit log
