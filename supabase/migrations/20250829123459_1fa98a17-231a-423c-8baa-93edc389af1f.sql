-- Fix the search path security issue for the increment_template_usage function
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.email_templates 
  SET usage_count = COALESCE(usage_count, 0) + 1,
      updated_at = now()
  WHERE id = template_id;
END;
$$;