-- Create table to store AI mode configurations
CREATE TABLE public.ai_mode_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode_name TEXT NOT NULL UNIQUE,
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_mode_configs ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can manage mode configs
CREATE POLICY "Only admins can manage AI mode configs" 
ON public.ai_mode_configs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add mode_used column to messages table
ALTER TABLE public.messages 
ADD COLUMN mode_used TEXT;

-- Insert the webhook URLs
INSERT INTO public.ai_mode_configs (mode_name, webhook_url) VALUES
('nen mode', 'https://n8n.srv846714.hstgr.cloud/webhook/93470f91-72ae-4b18-a1f6-16c229e5498a'),
('Research pro', 'https://n8n.srv846714.hstgr.cloud/webhook/486df34f-7ec4-4ad9-8e76-93c7edcdb912'),
('PDF analyst', 'https://n8n.srv846714.hstgr.cloud/webhook/0b9b9c5d-e2b9-409e-bc20-2d82fb1f46f3'),
('Vision lab', 'https://n8n.srv846714.hstgr.cloud/webhook/2c50d962-e450-4777-bdac-2fb27dbba229');

-- Create trigger for updated_at
CREATE TRIGGER update_ai_mode_configs_updated_at
BEFORE UPDATE ON public.ai_mode_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();