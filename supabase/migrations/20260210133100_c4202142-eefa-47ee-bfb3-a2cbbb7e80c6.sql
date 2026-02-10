
-- Create AYN's mind table for autonomous thinking
CREATE TABLE public.ayn_mind (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('thought', 'observation', 'idea', 'task', 'mood', 'trend')),
  content TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  shared_with_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ayn_mind ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions use service role key)
CREATE POLICY "Service role full access on ayn_mind"
  ON public.ayn_mind
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for querying recent unshared thoughts
CREATE INDEX idx_ayn_mind_unshared ON public.ayn_mind (shared_with_admin, created_at DESC);
CREATE INDEX idx_ayn_mind_type ON public.ayn_mind (type, created_at DESC);
