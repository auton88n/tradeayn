
-- Drop the existing CHECK constraint on ayn_mind.type and recreate with marketing_summary
ALTER TABLE public.ayn_mind DROP CONSTRAINT IF EXISTS ayn_mind_type_check;
ALTER TABLE public.ayn_mind ADD CONSTRAINT ayn_mind_type_check CHECK (type IN ('thought', 'observation', 'idea', 'task', 'mood', 'trend', 'telegram_admin', 'telegram_ayn', 'sales_lead', 'sales_draft', 'vision_analysis', 'proactive_research', 'telegram_summary', 'marketing_chat', 'marketing_ayn', 'marketing_summary'));
