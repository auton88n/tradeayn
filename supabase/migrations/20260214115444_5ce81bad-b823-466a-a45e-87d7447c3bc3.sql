ALTER TABLE ayn_mind DROP CONSTRAINT ayn_mind_type_check;
ALTER TABLE ayn_mind ADD CONSTRAINT ayn_mind_type_check CHECK (type = ANY (ARRAY[
  'thought', 'observation', 'idea', 'task', 'mood', 'trend',
  'telegram_admin', 'telegram_ayn', 'sales_lead', 'sales_draft',
  'vision_analysis', 'proactive_research', 'telegram_summary',
  'marketing_chat', 'marketing_ayn', 'marketing_summary',
  'employee_report', 'innovation_proposal', 'employee_discussion',
  'strategic_advisory', 'security_alert', 'proactive_alert'
]));