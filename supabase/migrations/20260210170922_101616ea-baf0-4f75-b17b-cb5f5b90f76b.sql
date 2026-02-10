-- Add scheduling and thread support columns to twitter_posts
ALTER TABLE public.twitter_posts 
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS thread_id uuid,
ADD COLUMN IF NOT EXISTS thread_order integer;

-- Index for scheduled poster cron job
CREATE INDEX IF NOT EXISTS idx_twitter_posts_scheduled 
ON public.twitter_posts (scheduled_at) 
WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- Index for grouping thread tweets
CREATE INDEX IF NOT EXISTS idx_twitter_posts_thread 
ON public.twitter_posts (thread_id) 
WHERE thread_id IS NOT NULL;