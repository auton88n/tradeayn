
CREATE TABLE public.chart_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT,
  image_url TEXT,
  ticker TEXT,
  asset_type TEXT,
  timeframe TEXT,
  technical_analysis JSONB DEFAULT '{}'::jsonb,
  news_data JSONB DEFAULT '[]'::jsonb,
  sentiment_score DECIMAL(4,3),
  prediction_signal TEXT,
  confidence INTEGER,
  prediction_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chart_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.chart_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analyses"
  ON public.chart_analyses FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_chart_analyses_user ON public.chart_analyses(user_id);
CREATE INDEX idx_chart_analyses_ticker ON public.chart_analyses(ticker);
