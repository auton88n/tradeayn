
-- Table to store inbound email replies received via Resend webhooks
CREATE TABLE public.inbound_email_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  in_reply_to TEXT,
  message_id TEXT,
  -- Link to the pipeline lead if we can match the sender
  pipeline_lead_id UUID REFERENCES public.ayn_sales_pipeline(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inbound_email_replies ENABLE ROW LEVEL SECURITY;

-- Only admins can view inbound replies
CREATE POLICY "Admins can view inbound replies"
  ON public.inbound_email_replies
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update (mark as read)
CREATE POLICY "Admins can update inbound replies"
  ON public.inbound_email_replies
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete inbound replies"
  ON public.inbound_email_replies
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert (from webhook)
CREATE POLICY "Service role can insert inbound replies"
  ON public.inbound_email_replies
  FOR INSERT
  WITH CHECK (true);

-- Index for matching replies to pipeline leads
CREATE INDEX idx_inbound_replies_from_email ON public.inbound_email_replies(from_email);
CREATE INDEX idx_inbound_replies_created_at ON public.inbound_email_replies(created_at DESC);
