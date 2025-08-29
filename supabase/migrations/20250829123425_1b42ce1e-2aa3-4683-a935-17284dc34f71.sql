-- Add missing columns to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Update existing templates to have default values
UPDATE public.email_templates 
SET usage_count = 0 
WHERE usage_count IS NULL;

-- Create index for better performance on usage tracking
CREATE INDEX IF NOT EXISTS idx_email_templates_usage_count ON public.email_templates(usage_count DESC);

-- Create a function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.email_templates 
  SET usage_count = COALESCE(usage_count, 0) + 1,
      updated_at = now()
  WHERE id = template_id;
END;
$$;