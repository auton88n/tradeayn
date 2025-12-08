-- Create enum types for support system
CREATE TYPE support_ticket_category AS ENUM ('general', 'billing', 'technical', 'feature_request', 'bug_report');
CREATE TYPE support_ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'waiting_reply', 'resolved', 'closed');
CREATE TYPE ticket_sender_type AS ENUM ('user', 'admin', 'ai_bot');

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_name TEXT,
  subject TEXT NOT NULL,
  category support_ticket_category NOT NULL DEFAULT 'general',
  priority support_ticket_priority NOT NULL DEFAULT 'medium',
  status support_ticket_status NOT NULL DEFAULT 'open',
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_messages table
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type ticket_sender_type NOT NULL,
  sender_id UUID,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faq_items table
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created_at ON public.ticket_messages(created_at);
CREATE INDEX idx_faq_items_category ON public.faq_items(category);
CREATE INDEX idx_faq_items_is_published ON public.faq_items(is_published);

-- Enable RLS on all tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Users can create tickets (logged in or guest)
CREATE POLICY "Anyone can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (true);

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users can update own tickets"
ON public.support_tickets FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
ON public.support_tickets FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete tickets
CREATE POLICY "Admins can delete tickets"
ON public.support_tickets FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ticket_messages
-- Users can view messages on their own tickets (non-internal)
CREATE POLICY "Users can view own ticket messages"
ON public.ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_id AND user_id = auth.uid()
  ) AND is_internal_note = false
);

-- Users can create messages on their own tickets
CREATE POLICY "Users can create messages on own tickets"
ON public.ticket_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_id AND user_id = auth.uid()
  ) AND sender_type = 'user' AND is_internal_note = false
);

-- Service role can insert messages (for AI bot and guest tickets)
CREATE POLICY "Service role can insert messages"
ON public.ticket_messages FOR INSERT
WITH CHECK (true);

-- Admins can view all messages including internal notes
CREATE POLICY "Admins can view all messages"
ON public.ticket_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can create messages
CREATE POLICY "Admins can create messages"
ON public.ticket_messages FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update messages
CREATE POLICY "Admins can update messages"
ON public.ticket_messages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete messages
CREATE POLICY "Admins can delete messages"
ON public.ticket_messages FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for faq_items
-- Anyone can view published FAQs
CREATE POLICY "Anyone can view published FAQs"
ON public.faq_items FOR SELECT
USING (is_published = true);

-- Admins can view all FAQs
CREATE POLICY "Admins can view all FAQs"
ON public.faq_items FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage FAQs
CREATE POLICY "Admins can manage FAQs"
ON public.faq_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment FAQ view count
CREATE OR REPLACE FUNCTION public.increment_faq_view(faq_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.faq_items
  SET view_count = view_count + 1
  WHERE id = faq_id;
END;
$$;

-- Function to increment FAQ helpful count
CREATE OR REPLACE FUNCTION public.increment_faq_helpful(faq_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.faq_items
  SET helpful_count = helpful_count + 1
  WHERE id = faq_id;
END;
$$;