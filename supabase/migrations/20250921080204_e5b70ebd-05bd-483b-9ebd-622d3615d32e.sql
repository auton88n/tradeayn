-- Clean up unused email-related tables
DROP TABLE IF EXISTS public.admin_emails CASCADE;
DROP TABLE IF EXISTS public.auth_email_templates CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;

-- Clean up empty tables that are not being used
DELETE FROM public.alert_history WHERE id IS NOT NULL;

-- Clean up unused edge function tables since we're removing email functions
DROP TABLE IF EXISTS public.webhook_security_logs CASCADE;
DROP TABLE IF EXISTS public.webhook_rate_limits CASCADE;