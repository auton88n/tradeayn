
-- Add model_name column to llm_usage_logs for direct model identification
ALTER TABLE public.llm_usage_logs ADD COLUMN IF NOT EXISTS model_name TEXT;

-- Add index for querying by model
CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_model_name ON public.llm_usage_logs(model_name);
