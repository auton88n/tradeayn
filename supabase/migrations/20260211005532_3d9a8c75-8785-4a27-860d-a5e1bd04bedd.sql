
-- Drop the old CHECK constraint and add telegram_summary to allowed types
ALTER TABLE public.ayn_mind DROP CONSTRAINT IF EXISTS ayn_mind_type_check;
ALTER TABLE public.ayn_mind ADD CONSTRAINT ayn_mind_type_check CHECK (type IN ('thought', 'observation', 'idea', 'task', 'mood', 'trend', 'telegram_admin', 'telegram_ayn', 'sales_lead', 'sales_draft', 'vision_analysis', 'proactive_research', 'telegram_summary'));
