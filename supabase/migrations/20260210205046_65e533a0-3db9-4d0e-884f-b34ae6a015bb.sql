
-- Create sales pipeline table for AYN's outreach tracking
CREATE TABLE public.ayn_sales_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_url TEXT,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  industry TEXT,
  pain_points TEXT[] DEFAULT '{}',
  recommended_services TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'contacted', 'followed_up', 'interested', 'converted', 'rejected')),
  emails_sent INTEGER NOT NULL DEFAULT 0,
  last_email_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  notes TEXT,
  context JSONB DEFAULT '{}',
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ayn_sales_pipeline ENABLE ROW LEVEL SECURITY;

-- Service role only (edge functions)
CREATE POLICY "Service role full access on ayn_sales_pipeline"
  ON public.ayn_sales_pipeline
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update timestamp
CREATE TRIGGER update_ayn_sales_pipeline_updated_at
  BEFORE UPDATE ON public.ayn_sales_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for follow-up scheduling
CREATE INDEX idx_ayn_sales_pipeline_next_follow_up ON public.ayn_sales_pipeline (next_follow_up_at) WHERE status NOT IN ('converted', 'rejected');
CREATE INDEX idx_ayn_sales_pipeline_status ON public.ayn_sales_pipeline (status);
