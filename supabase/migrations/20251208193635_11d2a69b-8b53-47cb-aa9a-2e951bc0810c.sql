-- Add has_unread_reply column to track unread admin replies
ALTER TABLE public.support_tickets 
ADD COLUMN has_unread_reply boolean NOT NULL DEFAULT false;

-- Create index for faster queries on unread tickets
CREATE INDEX idx_support_tickets_unread ON public.support_tickets(user_id, has_unread_reply) WHERE has_unread_reply = true;