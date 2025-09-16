-- Add the missing "General" mode to ai_mode_configs table
INSERT INTO public.ai_mode_configs (mode_name, webhook_url, is_active)
VALUES ('General', 'https://n8n.srv846714.hstgr.cloud/webhook/d8453419-8880-4bc4-b351-a0d0376b1fce', true);