-- Create email templates for custom authentication emails
CREATE TABLE IF NOT EXISTS public.auth_email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type text NOT NULL, -- 'signup_confirmation', 'password_reset', 'email_change', etc.
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can manage auth email templates" 
ON public.auth_email_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default AYN-branded email templates
INSERT INTO public.auth_email_templates (template_type, subject, html_content, text_content) VALUES
(
  'signup_confirmation',
  'Welcome to AYN - Confirm your email',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to AYN</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to AYN</h1>
            <p>Your AI-Powered Assistant Platform</p>
        </div>
        <div class="content">
            <h2>Confirm your email address</h2>
            <p>Thank you for signing up for AYN! To complete your registration, please confirm your email address by clicking the button below:</p>
            <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
            <p>If the button doesn''t work, you can copy and paste this link into your browser:</p>
            <p><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
            <p>If you didn''t create an account with AYN, you can safely ignore this email.</p>
            <p>Best regards,<br>The AYN Team</p>
        </div>
        <div class="footer">
            <p>© 2024 AYN. All rights reserved.</p>
            <p>This email was sent to {{ .Email }}</p>
        </div>
    </div>
</body>
</html>',
  'Welcome to AYN!

Thank you for signing up for AYN - Your AI-Powered Assistant Platform.

To complete your registration, please confirm your email address by clicking this link:
{{ .ConfirmationURL }}

If you didn''t create an account with AYN, you can safely ignore this email.

Best regards,
The AYN Team

© 2024 AYN. All rights reserved.'
),
(
  'password_reset',
  'Reset your AYN password',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your AYN Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
            <p>AYN - Your AI-Powered Assistant Platform</p>
        </div>
        <div class="content">
            <h2>Reset your password</h2>
            <p>We received a request to reset your AYN account password. Click the button below to create a new password:</p>
            <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
            <p>If the button doesn''t work, you can copy and paste this link into your browser:</p>
            <p><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
            <div class="warning">
                <strong>Security Notice:</strong> This link will expire in 24 hours. If you didn''t request a password reset, you can safely ignore this email.
            </div>
            <p>Best regards,<br>The AYN Team</p>
        </div>
        <div class="footer">
            <p>© 2024 AYN. All rights reserved.</p>
            <p>This email was sent to {{ .Email }}</p>
        </div>
    </div>
</body>
</html>',
  'Reset Your AYN Password

We received a request to reset your AYN account password.

Click this link to create a new password:
{{ .ConfirmationURL }}

This link will expire in 24 hours. If you didn''t request a password reset, you can safely ignore this email.

Best regards,
The AYN Team

© 2024 AYN. All rights reserved.'
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_auth_email_templates_updated_at
BEFORE UPDATE ON public.auth_email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();