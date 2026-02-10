
-- Create ayn_activity_log table for tracking everything AYN does
CREATE TABLE public.ayn_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL, -- ticket_reply, email_sent, user_unblocked, application_replied, message_deleted, etc.
  target_id TEXT, -- ID of the thing acted on
  target_type TEXT, -- ticket, application, contact_message, email, user, error_log
  summary TEXT NOT NULL, -- human-readable summary
  details JSONB DEFAULT '{}'::jsonb, -- full context
  triggered_by TEXT NOT NULL DEFAULT 'system', -- telegram_command, proactive_loop, auto_reply, admin_chat
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ayn_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write (AYN uses service role key)
CREATE POLICY "Admins can view activity log"
  ON public.ayn_activity_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_ayn_activity_log_created_at ON public.ayn_activity_log (created_at DESC);
CREATE INDEX idx_ayn_activity_log_action_type ON public.ayn_activity_log (action_type);
