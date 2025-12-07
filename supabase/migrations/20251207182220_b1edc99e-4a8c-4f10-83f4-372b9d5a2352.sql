-- Create service_applications table for storing form submissions
CREATE TABLE public.service_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL CHECK (service_type IN ('content_creator', 'ai_agents', 'automation')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_applications ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT (unauthenticated form submissions)
CREATE POLICY "Anyone can submit applications"
ON public.service_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view/manage applications
CREATE POLICY "Admins can view all applications"
ON public.service_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update applications"
ON public.service_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applications"
ON public.service_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_service_applications_updated_at
BEFORE UPDATE ON public.service_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_service_applications_status ON public.service_applications(status);
CREATE INDEX idx_service_applications_service_type ON public.service_applications(service_type);
CREATE INDEX idx_service_applications_created_at ON public.service_applications(created_at DESC);