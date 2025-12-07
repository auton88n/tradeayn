import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationRequest {
  serviceType: 'content_creator' | 'ai_agents' | 'automation';
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
  customFields?: Record<string, string>;
}

const SERVICE_NAMES: Record<string, string> = {
  content_creator: 'Premium Content Creator Website',
  ai_agents: 'Custom AI Agent',
  automation: 'Process Automation'
};

const SERVICE_EMOJIS: Record<string, string> = {
  content_creator: '🌟',
  ai_agents: '🤖',
  automation: '⚡'
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serviceType, fullName, email, phone, message, customFields }: ApplicationRequest = await req.json();

    if (!serviceType || !fullName || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: serviceType, fullName, email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.info(`Processing application from ${fullName} (${email}) for ${serviceType}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: application, error: dbError } = await supabase
      .from("service_applications")
      .insert({
        service_type: serviceType,
        full_name: fullName,
        email: email,
        phone: phone || null,
        message: message || null,
        custom_fields: customFields || {},
        status: 'new'
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save application" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.info(`Application saved with ID: ${application.id}`);

    // Check SMTP credentials
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("SMTP credentials not configured, skipping email notifications");
      return new Response(
        JSON.stringify({
          success: true,
          applicationId: application.id,
          message: "Application saved (email notifications skipped - SMTP not configured)"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceName = SERVICE_NAMES[serviceType] || serviceType;
    const serviceEmoji = SERVICE_EMOJIS[serviceType] || '📋';
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const firstName = fullName.split(' ')[0];

    // Initialize SMTP client
    const smtpClient = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: parseInt(smtpPort || "465"),
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    try {
      // Confirmation email to applicant
      const confirmationHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
<tr>
<td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;">
<tr>
<td style="padding:60px 40px 40px 40px;text-align:center;">
<h1 style="margin:0;color:#000000;font-size:56px;font-weight:900;letter-spacing:-2px;">AYN</h1>
<div style="width:40px;height:3px;background-color:#000000;margin:20px auto;"></div>
</td>
</tr>
<tr>
<td style="padding:0 40px 60px 40px;">
<h2 style="color:#000000;font-size:28px;font-weight:600;margin:0 0 20px 0;line-height:1.3;">
${serviceEmoji} Thank You, ${firstName}!
</h2>
<p style="color:#666666;font-size:17px;line-height:1.7;margin:0 0 32px 0;">
We've received your application for <strong style="color:#000000;">${serviceName}</strong> and we're excited to learn more about your project.
</p>
<p style="color:#666666;font-size:17px;line-height:1.7;margin:0 0 32px 0;">
Our team will review your submission and get back to you within 24-48 hours.
</p>
<div style="margin:40px 0;">
<a href="https://aynn.io" style="display:inline-block;background-color:#000000;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
Visit AYN
</a>
</div>
<p style="color:#999999;font-size:14px;margin:40px 0 0 0;line-height:1.6;">
Best regards,<br>The AYN Team
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

      await smtpClient.send({
        from: smtpUser,
        to: email,
        subject: `Thank you for your interest in ${serviceName}!`,
        html: confirmationHtml,
      });

      console.info(`Confirmation email sent to ${email}`);

      // Team notification email - build dynamic sections
      const phoneRow = phone ? `<tr>
<td style="padding-bottom:20px;">
<p style="margin:0 0 6px;color:#999999;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Phone</p>
<p style="margin:0;"><a href="tel:${phone}" style="color:#000000;font-size:16px;text-decoration:underline;">${phone}</a></p>
</td>
</tr>` : '';

      const messageSection = message ? `<div style="border-top:1px solid #e5e7eb;padding-top:24px;margin-bottom:24px;">
<p style="margin:0 0 6px;color:#999999;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
<p style="margin:0;color:#000000;font-size:16px;line-height:1.7;">${message}</p>
</div>` : '';

      let customFieldsSection = '';
      if (customFields && Object.keys(customFields).length > 0) {
        const rows = Object.entries(customFields)
          .map(([key, value]) => `<tr>
<td style="padding-bottom:20px;">
<p style="margin:0 0 6px;color:#999999;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${key}</p>
<p style="margin:0;color:#000000;font-size:16px;">${value}</p>
</td>
</tr>`)
          .join('');
        customFieldsSection = `<div style="border-top:1px solid #e5e7eb;padding-top:24px;margin-bottom:24px;">
<table width="100%" cellpadding="0" cellspacing="0">
${rows}
</table>
</div>`;
      }

      const notificationHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
<tr>
<td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;">
<tr>
<td style="padding:60px 40px 40px 40px;text-align:center;">
<h1 style="margin:0;color:#000000;font-size:56px;font-weight:900;letter-spacing:-2px;">AYN</h1>
<div style="width:40px;height:3px;background-color:#000000;margin:20px auto;"></div>
</td>
</tr>
<tr>
<td style="padding:0 40px 60px 40px;">
<h2 style="color:#000000;font-size:28px;font-weight:600;margin:0 0 20px 0;line-height:1.3;">
${serviceEmoji} New ${serviceName} Application
</h2>
<p style="color:#666666;font-size:17px;line-height:1.7;margin:0 0 32px 0;">
Received on ${dateStr}
</p>
<div style="border-top:1px solid #e5e7eb;padding-top:24px;margin-bottom:24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding-bottom:20px;">
<p style="margin:0 0 6px;color:#999999;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Full Name</p>
<p style="margin:0;color:#000000;font-size:18px;font-weight:600;">${fullName}</p>
</td>
</tr>
<tr>
<td style="padding-bottom:20px;">
<p style="margin:0 0 6px;color:#999999;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
<p style="margin:0;"><a href="mailto:${email}" style="color:#000000;font-size:16px;text-decoration:underline;">${email}</a></p>
</td>
</tr>
${phoneRow}
</table>
</div>
${messageSection}
${customFieldsSection}
<div style="margin:40px 0;">
<a href="mailto:${email}?subject=Re: Your ${serviceName} Application" style="display:inline-block;background-color:#000000;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
Reply to ${firstName}
</a>
</div>
<p style="color:#999999;font-size:14px;margin:40px 0 0 0;line-height:1.6;">
Application ID: ${application.id}
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

      await smtpClient.send({
        from: smtpUser,
        to: "info@aynn.io",
        subject: `${serviceEmoji} New ${serviceName} Application from ${fullName}`,
        html: notificationHtml,
      });

      console.info(`Notification email sent to info@aynn.io`);

      await smtpClient.close();

    } catch (emailError) {
      console.error("Email sending error:", emailError);
      try {
        await smtpClient.close();
      } catch {
        // Ignore close errors
      }
      return new Response(
        JSON.stringify({
          success: true,
          applicationId: application.id,
          warning: "Application saved but email notification failed"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        applicationId: application.id,
        message: "Application submitted successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing application:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process application" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
