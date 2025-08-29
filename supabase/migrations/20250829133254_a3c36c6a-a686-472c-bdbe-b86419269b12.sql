-- Update auth email templates with improved AYN-branded content

-- Update password reset template
UPDATE public.auth_email_templates 
SET 
  subject = 'Reset your AYN password',
  html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your AYN Password</title>
    <style>
        body { 
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            line-height: 1.6; 
            color: #1a202c; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc;
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 32px; 
            text-align: center; 
        }
        .header h1 { 
            font-size: 28px; 
            font-weight: 700; 
            margin: 0 0 8px 0; 
        }
        .header p { 
            font-size: 16px; 
            margin: 0; 
            opacity: 0.9; 
        }
        .content { 
            padding: 40px 32px; 
        }
        .greeting { 
            font-size: 18px; 
            font-weight: 600; 
            margin: 0 0 24px 0; 
        }
        .button { 
            display: inline-block; 
            background: #3182ce; 
            color: white; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 32px 0; 
            font-weight: 600;
            font-size: 16px;
        }
        .button-section { 
            text-align: center; 
        }
        .expiry-notice { 
            color: #e53e3e; 
            font-size: 14px; 
            text-align: center; 
            font-weight: 500; 
            margin: 20px 0;
        }
        .footer { 
            background-color: #f7fafc; 
            padding: 24px 32px; 
            border-top: 1px solid #e2e8f0; 
            text-align: center; 
            color: #718096; 
            font-size: 12px; 
        }
        .support-link { 
            color: #3182ce; 
            text-decoration: underline; 
        }
        .signature { 
            margin: 32px 0 0 0; 
            font-weight: 500; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
            <p>AYN - AI Business Consultant</p>
        </div>
        <div class="content">
            <div class="greeting">Hello,</div>
            
            <p>You requested to reset your password for your AYN account.</p>
            
            <p>Click the button below to create a new password:</p>
            
            <div class="button-section">
                <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
            </div>
            
            <div class="expiry-notice">This link expires in 24 hours for security.</div>
            
            <p>If you didn''t request this reset, you can ignore this email.</p>
            
            <p>Questions? Contact us at <a href="mailto:support@aynn.io" class="support-link">support@aynn.io</a></p>
            
            <div class="signature">
                Best regards,<br>
                The AYN Team
            </div>
        </div>
        <div class="footer">
            <p>© 2024 AYN - AI Business Consultant. All rights reserved.</p>
            <p>This email was sent to {{ .Email }}</p>
        </div>
    </div>
</body>
</html>',
  text_content = 'Reset Your AYN Password

Hello,

You requested to reset your password for your AYN account.

Click this link to create a new password:
{{ .ConfirmationURL }}

This link expires in 24 hours for security.

If you didn''t request this reset, you can ignore this email.

Questions? Contact us at support@aynn.io

Best regards,
The AYN Team

© 2024 AYN - AI Business Consultant. All rights reserved.'
WHERE template_type = 'password_reset';

-- Update signup confirmation template  
UPDATE public.auth_email_templates 
SET 
  subject = 'Welcome to AYN - Confirm your email',
  html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to AYN</title>
    <style>
        body { 
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            line-height: 1.6; 
            color: #1a202c; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc;
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 32px; 
            text-align: center; 
        }
        .header h1 { 
            font-size: 28px; 
            font-weight: 700; 
            margin: 0 0 8px 0; 
        }
        .header p { 
            font-size: 16px; 
            margin: 0; 
            opacity: 0.9; 
        }
        .content { 
            padding: 40px 32px; 
        }
        .greeting { 
            font-size: 18px; 
            font-weight: 600; 
            margin: 0 0 24px 0; 
        }
        .button { 
            display: inline-block; 
            background: #3182ce; 
            color: white; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 32px 0; 
            font-weight: 600;
            font-size: 16px;
        }
        .button-section { 
            text-align: center; 
        }
        .benefits-header { 
            font-weight: 600; 
            margin: 24px 0 16px 0; 
        }
        .benefits-list { 
            margin: 0 0 24px 0; 
        }
        .benefit-item { 
            margin: 8px 0; 
            padding-left: 8px; 
            color: #4a5568;
        }
        .expiry-notice { 
            color: #e53e3e; 
            font-size: 14px; 
            text-align: center; 
            font-weight: 500; 
            margin: 20px 0;
        }
        .divider { 
            border: none; 
            border-top: 1px solid #e2e8f0; 
            margin: 32px 0; 
        }
        .footer { 
            background-color: #f7fafc; 
            padding: 24px 32px; 
            border-top: 1px solid #e2e8f0; 
            text-align: center; 
            color: #718096; 
            font-size: 12px; 
        }
        .support-link { 
            color: #3182ce; 
            text-decoration: underline; 
        }
        .signature { 
            margin: 32px 0 0 0; 
            font-weight: 500; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to AYN</h1>
            <p>AI Business Consultant</p>
        </div>
        <div class="content">
            <div class="greeting">Hello,</div>
            
            <p>Welcome to AYN! You''re one step away from accessing your AI business consultant.</p>
            
            <p>Please confirm your email address to activate your account:</p>
            
            <div class="button-section">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
            </div>
            
            <div class="benefits-header">Once confirmed, you''ll have full access to:</div>
            
            <div class="benefits-list">
                <div class="benefit-item">• Market research and analysis</div>
                <div class="benefit-item">• Sales optimization strategies</div>
                <div class="benefit-item">• Growth planning assistance</div>
                <div class="benefit-item">• Competitor intelligence</div>
            </div>
            
            <div class="expiry-notice">This link expires in 24 hours.</div>
            
            <hr class="divider">
            
            <p>If you didn''t create an AYN account, please ignore this email.</p>
            
            <p>Questions? We''re here to help at <a href="mailto:support@aynn.io" class="support-link">support@aynn.io</a></p>
            
            <div class="signature">
                Welcome aboard,<br>
                The AYN Team
            </div>
        </div>
        <div class="footer">
            <p>© 2024 AYN - AI Business Consultant. All rights reserved.</p>
            <p>This email was sent to {{ .Email }}</p>
        </div>
    </div>
</body>
</html>',
  text_content = 'Welcome to AYN!

Hello,

Welcome to AYN! You''re one step away from accessing your AI business consultant.

Please confirm your email address to activate your account:
{{ .ConfirmationURL }}

Once confirmed, you''ll have full access to:
• Market research and analysis
• Sales optimization strategies  
• Growth planning assistance
• Competitor intelligence

This link expires in 24 hours.

If you didn''t create an AYN account, please ignore this email.

Questions? We''re here to help at support@aynn.io

Welcome aboard,
The AYN Team

© 2024 AYN - AI Business Consultant. All rights reserved.'
WHERE template_type = 'signup_confirmation';