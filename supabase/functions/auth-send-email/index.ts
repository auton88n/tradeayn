import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

// AYN branded email header
const AYN_HEADER = `
<div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 40px 20px; text-align: center;">
  <div style="font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #c084fc, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
    AYN
  </div>
  <div style="color: #9ca3af; font-size: 12px; margin-top: 8px; letter-spacing: 2px;">
    YOUR AI BUSINESS PARTNER
  </div>
</div>
`;

// AYN branded email footer
const AYN_FOOTER = `
<div style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
  <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
    © ${new Date().getFullYear()} AYN. All rights reserved.
  </p>
  <p style="color: #6b7280; font-size: 11px; margin: 0;">
    This email was sent because you requested it. If you didn't, you can safely ignore this email.
  </p>
  <p style="color: #6b7280; font-size: 11px; margin: 10px 0 0 0; direction: rtl;">
    تم إرسال هذا البريد الإلكتروني لأنك طلبت ذلك. إذا لم تفعل، يمكنك تجاهل هذا البريد بأمان.
  </p>
</div>
`;

// Email template wrapper
const wrapEmail = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a;">
    ${AYN_HEADER}
    ${content}
    ${AYN_FOOTER}
  </div>
</body>
</html>
`;

// CTA button style
const ctaButton = (url: string, text: string, textAr: string): string => `
<div style="text-align: center; margin: 30px 0;">
  <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
    ${text}
  </a>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 10px; direction: rtl;">
    ${textAr}
  </p>
</div>
`;

// Generate templates based on email type
function getTemplate(
  emailType: string,
  user: { email: string; user_metadata?: { full_name?: string } },
  confirmationUrl: string
): { subject: string; html: string } {
  const userName = user.user_metadata?.full_name || user.email.split('@')[0];

  switch (emailType) {
    case 'signup':
      return {
        subject: '🔐 Confirm your AYN account | تأكيد حسابك في AYN',
        html: wrapEmail(`
          <div style="padding: 40px 30px; color: #e5e7eb;">
            <h1 style="color: white; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
              Welcome to AYN! 🎉
            </h1>
            <h2 style="color: #9ca3af; font-size: 18px; margin: 0 0 30px 0; text-align: center; direction: rtl;">
              !AYN مرحباً بك في
            </h2>
            
            <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 15px 0;">
              Hi ${userName},
            </p>
            <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for signing up! Please confirm your email address to get started with AYN.
            </p>
            <p style="color: #9ca3af; line-height: 1.6; margin: 0 0 20px 0; direction: rtl;">
              شكراً للتسجيل! يرجى تأكيد بريدك الإلكتروني للبدء في استخدام AYN.
            </p>
            
            ${ctaButton(confirmationUrl, 'Verify Email', 'تأكيد البريد الإلكتروني')}
            
            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 15px; margin-top: 30px;">
              <p style="color: #a78bfa; font-size: 13px; margin: 0;">
                ⏰ This link expires in 24 hours.
              </p>
              <p style="color: #a78bfa; font-size: 13px; margin: 5px 0 0 0; direction: rtl;">
                ⏰ ينتهي هذا الرابط خلال 24 ساعة.
              </p>
            </div>
          </div>
        `)
      };

    case 'recovery':
      return {
        subject: '🔐 Reset your AYN password | إعادة تعيين كلمة المرور',
        html: wrapEmail(`
          <div style="padding: 40px 30px; color: #e5e7eb;">
            <h1 style="color: white; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
              Reset Your Password
            </h1>
            <h2 style="color: #9ca3af; font-size: 18px; margin: 0 0 30px 0; text-align: center; direction: rtl;">
              إعادة تعيين كلمة المرور
            </h2>
            
            <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 15px 0;">
              Hi ${userName},
            </p>
            <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 20px 0;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            <p style="color: #9ca3af; line-height: 1.6; margin: 0 0 20px 0; direction: rtl;">
              تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.
            </p>
            
            ${ctaButton(confirmationUrl, 'Reset Password', 'إعادة تعيين كلمة المرور')}
            
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 15px; margin-top: 30px;">
              <p style="color: #fca5a5; font-size: 13px; margin: 0;">
                🔒 If you didn't request this, please ignore this email. Your password will remain unchanged.
              </p>
              <p style="color: #fca5a5; font-size: 13px; margin: 10px 0 0 0; direction: rtl;">
                🔒 إذا لم تطلب ذلك، يرجى تجاهل هذا البريد. ستبقى كلمة مرورك كما هي.
              </p>
            </div>
            
            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 15px; margin-top: 15px;">
              <p style="color: #a78bfa; font-size: 13px; margin: 0;">
                ⏰ This link expires in 1 hour.
              </p>
              <p style="color: #a78bfa; font-size: 13px; margin: 5px 0 0 0; direction: rtl;">
                ⏰ ينتهي هذا الرابط خلال ساعة واحدة.
              </p>
            </div>
          </div>
        `)
      };

    case 'magiclink':
      return {
        subject: '🔐 Your AYN login link | رابط تسجيل الدخول',
        html: wrapEmail(`
          <div style="padding: 40px 30px; color: #e5e7eb;">
            <h1 style="color: white; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
              Your Login Link
            </h1>
            <h2 style="color: #9ca3af; font-size: 18px; margin: 0 0 30px 0; text-align: center; direction: rtl;">
              رابط تسجيل الدخول
            </h2>
            
            <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 15px 0;">
              Hi ${userName},
            </p>
            <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 20px 0;">
              Click the button below to securely log in to your AYN account.
            </p>
            <p style="color: #9ca3af; line-height: 1.6; margin: 0 0 20px 0; direction: rtl;">
              انقر على الزر أدناه لتسجيل الدخول بأمان إلى حسابك في AYN.
            </p>
            
            ${ctaButton(confirmationUrl, 'Log In to AYN', 'تسجيل الدخول إلى AYN')}
            
            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 15px; margin-top: 30px;">
              <p style="color: #a78bfa; font-size: 13px; margin: 0;">
                ⏰ This link expires in 1 hour and can only be used once.
              </p>
              <p style="color: #a78bfa; font-size: 13px; margin: 5px 0 0 0; direction: rtl;">
                ⏰ ينتهي هذا الرابط خلال ساعة واحدة ويمكن استخدامه مرة واحدة فقط.
              </p>
            </div>
          </div>
        `)
      };

    case 'email_change':
      return {
        subject: '📧 Confirm your new email | تأكيد بريدك الإلكتروني الجديد',
        html: wrapEmail(`
          <div style="padding: 40px 30px; color: #e5e7eb;">
            <h1 style="color: white; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
              Confirm Your New Email
            </h1>
            <h2 style="color: #9ca3af; font-size: 18px; margin: 0 0 30px 0; text-align: center; direction: rtl;">
              تأكيد بريدك الإلكتروني الجديد
            </h2>
            
            <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 15px 0;">
              Hi ${userName},
            </p>
            <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 20px 0;">
              You requested to change your email address. Please confirm this change by clicking the button below.
            </p>
            <p style="color: #9ca3af; line-height: 1.6; margin: 0 0 20px 0; direction: rtl;">
              لقد طلبت تغيير عنوان بريدك الإلكتروني. يرجى تأكيد هذا التغيير بالنقر على الزر أدناه.
            </p>
            
            ${ctaButton(confirmationUrl, 'Confirm Email Change', 'تأكيد تغيير البريد الإلكتروني')}
            
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 15px; margin-top: 30px;">
              <p style="color: #fca5a5; font-size: 13px; margin: 0;">
                🔒 If you didn't request this change, please contact support immediately.
              </p>
              <p style="color: #fca5a5; font-size: 13px; margin: 10px 0 0 0; direction: rtl;">
                🔒 إذا لم تطلب هذا التغيير، يرجى الاتصال بالدعم فوراً.
              </p>
            </div>
          </div>
        `)
      };

    default:
      // Generic fallback
      return {
        subject: '🔐 AYN Authentication | مصادقة AYN',
        html: wrapEmail(`
          <div style="padding: 40px 30px; color: #e5e7eb;">
            <h1 style="color: white; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
              Complete Your Action
            </h1>
            
            <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 20px 0;">
              Click the button below to continue.
            </p>
            
            ${ctaButton(confirmationUrl, 'Continue', 'متابعة')}
          </div>
        `)
      };
  }
}

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get the raw payload for signature verification
    const payload = await req.text();
    
    // Verify webhook signature
    if (!hookSecret) {
      console.error('[auth-send-email] SEND_EMAIL_HOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    let webhookData: {
      user: { id: string; email: string; user_metadata?: { full_name?: string } };
      email_data: {
        email_action_type: string;
        token_hash: string;
        token: string;
        redirect_to: string;
        site_url: string;
      };
    };

    try {
      webhookData = wh.verify(payload, headers) as typeof webhookData;
    } catch (verifyError) {
      console.error('[auth-send-email] Webhook verification failed:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { user, email_data } = webhookData;
    
    console.log(`[auth-send-email] Processing ${email_data.email_action_type} for ${user.email}`);

    // Build the confirmation URL
    const confirmationUrl = `https://dfkoxuokfkttjhfjcecx.supabase.co/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to || email_data.site_url)}`;

    // Get the appropriate template
    const { subject, html } = getTemplate(email_data.email_action_type, user, confirmationUrl);

    // Send via Resend
    const emailResult = await resend.emails.send({
      from: 'AYN <noreply@mail.aynn.io>',
      to: [user.email],
      subject,
      html
    });

    console.log(`[auth-send-email] Email sent successfully:`, emailResult);

    // Return success - Supabase expects empty object on success
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[auth-send-email] Error:', error);
    
    // Return error so Supabase can retry
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
