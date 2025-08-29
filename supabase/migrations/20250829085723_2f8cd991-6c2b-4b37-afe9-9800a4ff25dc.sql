-- Create emails table for admin email management
CREATE TABLE public.admin_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  email_type TEXT NOT NULL DEFAULT 'outbound', -- 'outbound', 'inbound', 'draft'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'failed', 'received'
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for admin-only access
CREATE POLICY "Only admins can manage emails" 
ON public.admin_emails 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_admin_emails_type_status ON public.admin_emails(email_type, status);
CREATE INDEX idx_admin_emails_created_at ON public.admin_emails(created_at);
CREATE INDEX idx_admin_emails_sender ON public.admin_emails(sender_email);
CREATE INDEX idx_admin_emails_recipient ON public.admin_emails(recipient_email);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_emails_updated_at
BEFORE UPDATE ON public.admin_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  template_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'notification', 'marketing'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  variables JSONB DEFAULT '[]'::jsonb -- Store template variables like {{name}}, {{company}}
);

-- Enable RLS on templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for admin-only access to templates
CREATE POLICY "Only admins can manage email templates" 
ON public.email_templates 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for templates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default email templates
INSERT INTO public.email_templates (name, subject, content, html_content, template_type, variables) VALUES
('Welcome Email', 'Welcome to {{company_name}}!', 
 'Hello {{name}},\n\nWelcome to {{company_name}}! We''re excited to have you on board.\n\nBest regards,\nThe Team',
 '<h1>Welcome to {{company_name}}!</h1><p>Hello {{name}},</p><p>Welcome to {{company_name}}! We''re excited to have you on board.</p><p>Best regards,<br>The Team</p>',
 'general',
 '["name", "company_name"]'::jsonb),

('Access Granted', 'Your access has been approved',
 'Hello {{name}},\n\nYour access request has been approved! You can now access the system.\n\nCompany: {{company_name}}\nMonthly Limit: {{monthly_limit}}\n\nBest regards,\nAdmin Team',
 '<h1>Access Approved!</h1><p>Hello {{name}},</p><p>Your access request has been approved! You can now access the system.</p><ul><li><strong>Company:</strong> {{company_name}}</li><li><strong>Monthly Limit:</strong> {{monthly_limit}}</li></ul><p>Best regards,<br>Admin Team</p>',
 'notification',
 '["name", "company_name", "monthly_limit"]'::jsonb),

('Access Denied', 'Access Request Update',
 'Hello {{name}},\n\nThank you for your interest. Unfortunately, we cannot approve your access request at this time.\n\nReason: {{reason}}\n\nBest regards,\nAdmin Team',
 '<h1>Access Request Update</h1><p>Hello {{name}},</p><p>Thank you for your interest. Unfortunately, we cannot approve your access request at this time.</p><p><strong>Reason:</strong> {{reason}}</p><p>Best regards,<br>Admin Team</p>',
 'notification',
 '["name", "reason"]'::jsonb);