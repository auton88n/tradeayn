-- Add new columns to service_applications table
ALTER TABLE public.service_applications 
ADD COLUMN IF NOT EXISTS assigned_to UUID,
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_error TEXT,
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- Create application_replies table for reply history
CREATE TABLE IF NOT EXISTS public.application_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.service_applications(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by UUID,
  email_sent BOOLEAN DEFAULT false,
  email_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on application_replies
ALTER TABLE public.application_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for application_replies - Admin only
CREATE POLICY "Admins can view all application replies"
ON public.application_replies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert application replies"
ON public.application_replies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update application replies"
ON public.application_replies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete application replies"
ON public.application_replies
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_application_replies_application_id 
ON public.application_replies(application_id);

CREATE INDEX IF NOT EXISTS idx_service_applications_status 
ON public.service_applications(status);

CREATE INDEX IF NOT EXISTS idx_service_applications_assigned_to 
ON public.service_applications(assigned_to);