-- News cache table for 30-minute TTL caching of Firecrawl news results
-- Prevents cost explosion and DDoS from repeated identical queries

CREATE TABLE public.news_cache (
  ticker TEXT PRIMARY KEY,
  news_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for TTL cleanup queries
CREATE INDEX idx_news_cache_created ON public.news_cache(created_at);

-- Enable RLS (service-role only access from edge functions)
ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;

-- No public policies — only service role key can read/write (edge functions use service role)