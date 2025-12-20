-- Create pending_pin_changes table for PIN approval workflow
CREATE TABLE public.pending_pin_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  new_pin_hash TEXT NOT NULL,
  approval_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_pin_changes ENABLE ROW LEVEL SECURITY;

-- Only admins can view pending changes
CREATE POLICY "Admins can view pending PIN changes"
ON public.pending_pin_changes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert pending changes
CREATE POLICY "Admins can create pending PIN changes"
ON public.pending_pin_changes
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_pending_pin_changes_updated_at
BEFORE UPDATE ON public.pending_pin_changes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for token lookup
CREATE INDEX idx_pending_pin_changes_token ON public.pending_pin_changes(approval_token);
CREATE INDEX idx_pending_pin_changes_status ON public.pending_pin_changes(status);