import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationEmailRequest {
  serviceType: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  message?: string;
  formData?: Record<string, unknown>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serviceType, applicantName, applicantEmail, applicantPhone, message, formData }: ApplicationEmailRequest = await req.json();

    console.log(`Processing application email for ${serviceType} from ${applicantEmail}`);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const notificationEmail = Deno.env.get("NOTIFICATION_EMAIL") || "info@aynn.io";

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error("SMTP configuration missing");
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    // Build complete form data from individual fields and any extra formData
    const completeFormData: Record<string, unknown> = {
      ...(applicantPhone ? { phone: applicantPhone } : {}),
      ...(message ? { message } : {}),
      ...(formData || {}),
    };

    // Format form data for email
    const formatFormData = (data: Record<string, unknown>): string => {
      if (!data || Object.keys(data).length === 0) return '';
      return Object.entries(data)
        .filter(([key]) => key !== 'message')
        .map(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          if (Array.isArray(value)) {
            return `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#666;font-weight:600;">${label}</td><td style="padding:8px 16px;border-bottom:1px solid #eee;">${value.join(', ')}</td></tr>`;
          }
          return `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#666;font-weight:600;">${label}</td><td style="padding:8px 16px;border-bottom:1px solid #eee;">${value || 'Not provided'}</td></tr>`;
        })
        .join('');
    };

    // Confirmation email to applicant
    const confirmationHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
<div style="text-align:center;margin-bottom:32px;">
<h1 style="font-size:56px;font-weight:900;letter-spacing:-2px;margin:0;">AYN</h1>
<div style="width:40px;height:4px;background:#000;margin:16px auto;"></div>
</div>
<p style="font-size:18px;color:#333;margin-bottom:24px;">Hi ${applicantName},</p>
<p style="font-size:16px;color:#666;line-height:1.6;margin-bottom:24px;">Thank you for your interest in our <strong>${serviceType}</strong> service. We've received your application and our team is reviewing it.</p>
<p style="font-size:16px;color:#666;line-height:1.6;margin-bottom:24px;">We'll get back to you within 24-48 hours with next steps.</p>
<div style="background:#f9f9f9;border-radius:12px;padding:24px;margin:32px 0;">
<p style="font-size:14px;color:#999;margin:0 0 8px;text-transform:uppercase;font-weight:600;">SERVICE</p>
<p style="font-size:18px;color:#333;margin:0;font-weight:600;">${serviceType}</p>
</div>
<p style="font-size:14px;color:#999;margin-top:40px;">If you have any questions, simply reply to this email.</p>
<div style="margin-top:40px;padding-top:24px;border-top:1px solid #eee;text-align:center;">
<p style="font-size:12px;color:#999;margin:0;">AYN AI - Your Intelligent Companion</p>
</div>
</div>
</body>
</html>`;

    // Notification email to team
    const notificationHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
<div style="text-align:center;margin-bottom:32px;">
<h1 style="font-size:56px;font-weight:900;letter-spacing:-2px;margin:0;">AYN</h1>
<div style="width:40px;height:4px;background:#000;margin:16px auto;"></div>
</div>
<div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:16px 20px;margin-bottom:32px;">
<p style="font-size:16px;color:#0369a1;margin:0;font-weight:600;">New Service Application</p>
</div>
<div style="background:#f9f9f9;border-radius:12px;padding:24px;margin-bottom:24px;">
<p style="font-size:14px;color:#999;margin:0 0 8px;text-transform:uppercase;font-weight:600;">SERVICE TYPE</p>
<p style="font-size:20px;color:#333;margin:0;font-weight:700;">${serviceType}</p>
</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#666;font-weight:600;">Name</td><td style="padding:8px 16px;border-bottom:1px solid #eee;">${applicantName}</td></tr>
<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#666;font-weight:600;">Email</td><td style="padding:8px 16px;border-bottom:1px solid #eee;"><a href="mailto:${applicantEmail}" style="color:#0ea5e9;">${applicantEmail}</a></td></tr>
${formatFormData(completeFormData)}
</table>
${completeFormData.message ? `
<div style="margin-top:24px;">
<p style="font-size:14px;color:#999;margin:0 0 8px;text-transform:uppercase;font-weight:600;">MESSAGE</p>
<p style="font-size:14px;color:#333;line-height:1.6;background:#f9f9f9;padding:16px;border-radius:8px;">${completeFormData.message}</p>
</div>
` : ''}
<div style="margin-top:32px;text-align:center;">
<a href="mailto:${applicantEmail}?subject=Re: Your ${serviceType} Application" style="display:inline-block;background:#000;color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:600;">Reply to Applicant</a>
</div>
<div style="margin-top:40px;padding-top:24px;border-top:1px solid #eee;text-align:center;">
<p style="font-size:12px;color:#999;margin:0;">AYN AI Admin Notification</p>
</div>
</div>
</body>
</html>`;

    // Send confirmation to applicant
    await client.send({
      from: smtpUser,
      to: applicantEmail,
      replyTo: notificationEmail,
      subject: `Application Received - ${serviceType}`,
      content: "auto",
      html: confirmationHtml,
    });

    console.log(`Confirmation email sent to ${applicantEmail}`);

    // Send notification to team
    await client.send({
      from: smtpUser,
      to: notificationEmail,
      replyTo: applicantEmail,
      subject: `New Application: ${serviceType} - ${applicantName}`,
      content: "auto",
      html: notificationHtml,
    });

    console.log(`Notification email sent to ${notificationEmail}`);

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error sending application emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
