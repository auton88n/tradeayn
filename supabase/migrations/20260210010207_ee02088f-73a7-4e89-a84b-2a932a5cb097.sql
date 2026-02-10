
-- Create twitter_posts table for tracking AI-generated marketing tweets
CREATE TABLE public.twitter_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'failed', 'rejected')),
  psychological_strategy TEXT,
  target_audience TEXT,
  content_type TEXT CHECK (content_type IN ('value', 'engagement', 'feature', 'personality')),
  quality_score JSONB,
  tweet_id TEXT,
  error_message TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'ai'
);

-- Enable RLS
ALTER TABLE public.twitter_posts ENABLE ROW LEVEL SECURITY;

-- Only admins (via service role or authenticated admin check) can access
CREATE POLICY "Admin full access to twitter_posts"
  ON public.twitter_posts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.access_grants ag
      WHERE ag.user_id = auth.uid()
      AND ag.is_active = true
    )
  );

-- Index for status queries
CREATE INDEX idx_twitter_posts_status ON public.twitter_posts (status);
CREATE INDEX idx_twitter_posts_created_at ON public.twitter_posts (created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_twitter_posts_updated_at
  BEFORE UPDATE ON public.twitter_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
