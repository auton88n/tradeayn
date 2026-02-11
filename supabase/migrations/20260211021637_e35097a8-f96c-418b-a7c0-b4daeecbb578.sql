
-- Competitor tracking tables for AYN Marketing Bot

CREATE TABLE public.marketing_competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  name TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on marketing_competitors"
  ON public.marketing_competitors FOR ALL
  USING (true) WITH CHECK (true);

CREATE TABLE public.competitor_tweets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES public.marketing_competitors(id) ON DELETE CASCADE,
  tweet_id TEXT,
  content TEXT,
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competitor_tweets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on competitor_tweets"
  ON public.competitor_tweets FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX idx_competitor_tweets_competitor ON public.competitor_tweets(competitor_id);
CREATE INDEX idx_competitor_tweets_scraped ON public.competitor_tweets(scraped_at DESC);
