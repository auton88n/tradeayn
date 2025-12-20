-- Create visitor_analytics table for tracking website visitors
CREATE TABLE public.visitor_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  country_code TEXT,
  city TEXT,
  region TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_visitor_analytics_created_at ON public.visitor_analytics(created_at DESC);
CREATE INDEX idx_visitor_analytics_country ON public.visitor_analytics(country);
CREATE INDEX idx_visitor_analytics_page_path ON public.visitor_analytics(page_path);
CREATE INDEX idx_visitor_analytics_visitor_id ON public.visitor_analytics(visitor_id);

-- Enable RLS
ALTER TABLE public.visitor_analytics ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for tracking)
CREATE POLICY "Allow public inserts for tracking"
ON public.visitor_analytics
FOR INSERT
WITH CHECK (true);

-- Allow admin reads
CREATE POLICY "Admins can view all analytics"
ON public.visitor_analytics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));