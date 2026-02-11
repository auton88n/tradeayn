-- Drop and recreate constraint with ALL existing + new types
ALTER TABLE public.ayn_mind DROP CONSTRAINT IF EXISTS ayn_mind_type_check;
ALTER TABLE public.ayn_mind ADD CONSTRAINT ayn_mind_type_check CHECK (
  type IN (
    'insight', 'observation', 'strategy', 'reflection', 'decision', 'memory',
    'idea', 'mood', 'sales_lead', 'thought', 'trend',
    'telegram_admin', 'telegram_ayn', 'telegram_summary',
    'support_chat', 'support_ayn',
    'marketing_chat', 'marketing_ayn'
  )
);

-- Add created_by_name column to twitter_posts
ALTER TABLE public.twitter_posts ADD COLUMN IF NOT EXISTS created_by_name text DEFAULT NULL;