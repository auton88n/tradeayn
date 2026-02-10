
-- Create support ticket replies table for AI and human replies
CREATE TABLE public.support_ticket_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_by TEXT NOT NULL DEFAULT 'admin',
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;

-- Admin can see all replies
CREATE POLICY "Admins can manage ticket replies"
ON public.support_ticket_replies
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Service role can insert (for edge functions)
CREATE POLICY "Service role can insert replies"
ON public.support_ticket_replies
FOR INSERT
WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX idx_ticket_replies_ticket_id ON public.support_ticket_replies(ticket_id);
