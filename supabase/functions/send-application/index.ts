import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "npm:resend@2.0.0";

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

    console.log(`Processing application from ${fullName} (${email}) for ${serviceType}`);

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

    console.log(`Application saved with ID: ${application.id}`);

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const serviceName = SERVICE_NAMES[serviceType] || serviceType;
    const serviceEmoji = SERVICE_EMOJIS[serviceType] || '📋';
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const firstName = fullName.split(' ')[0];

    // Build custom fields rows
    let customFieldsRows = '';
    if (customFields && Object.keys(customFields).length > 0) {
      customFieldsRows = Object.entries(customFields)
        .map(([key, value]) => `<tr><td style="padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">${key}</td><td style="padding:12px 16px;color:#111827;font-size:14px;font-weight:500;border-bottom:1px solid #f3f4f6;">${value}</td></tr>`)
        .join('');
    }

    try {
      // Confirmation email to applicant
      const confirmationHtml = [
        '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>',
        '<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;">',
        '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;"><tr><td align="center">',
        '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">',
        '<tr><td style="background:linear-gradient(135deg,#111827 0%,#1f2937 100%);padding:40px 32px;text-align:center;">',
        `<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Thank You, ${firstName}!</h1>`,
        '<p style="margin:12px 0 0;color:#9ca3af;font-size:16px;">We received your application</p>',
        '</td></tr>',
        '<tr><td style="padding:32px;">',
        '<div style="background:#f9fafb;border-radius:12px;padding:24px;margin-bottom:24px;">',
        '<p style="margin:0 0 8px;color:#6b7280;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Service Selected</p>',
        `<p style="margin:0;color:#111827;font-size:20px;font-weight:600;">${serviceEmoji} ${serviceName}</p>`,
        '</div>',
        '<p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">Thank you for your interest in our services. Our team will review your application and get back to you within 24-48 hours.</p>',
        '<p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">In the meantime, feel free to reply to this email if you have any questions.</p>',
        '<div style="text-align:center;padding-top:16px;">',
        '<a href="https://aynn.io" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">Visit AYN</a>',
        '</div></td></tr>',
        '<tr><td style="padding:24px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">',
        '<p style="margin:0;color:#9ca3af;font-size:14px;">AYN - Your Intelligent Life Companion</p>',
        '</td></tr></table></td></tr></table></body></html>'
      ].join('');

      const confirmationResult = await resend.emails.send({
        from: "AYN <noreply@aynn.io>",
        to: [email],
        replyTo: "info@aynn.io",
        subject: `Thank you for your interest in ${serviceName}!`,
        html: confirmationHtml,
      });

      console.log(`Confirmation email sent to ${email}:`, JSON.stringify(confirmationResult, null, 2));

      // Team notification email
      const phoneRow = phone ? `<tr><td style="padding-bottom:12px;"><p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Phone</p><p style="margin:0;"><a href="tel:${phone}" style="color:#111827;font-size:16px;text-decoration:none;">${phone}</a></p></td></tr>` : '';
      const messageSection = message ? `<div style="margin-bottom:24px;"><p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Message</p><div style="background:#f9fafb;border-radius:12px;padding:16px;border-left:4px solid #111827;"><p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${message}</p></div></div>` : '';
      const customFieldsSection = customFieldsRows ? `<div style="margin-bottom:24px;"><p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Additional Details</p><table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:12px;overflow:hidden;">${customFieldsRows}</table></div>` : '';

      const notificationHtml = [
        '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>',
        '<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;">',
        '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;"><tr><td align="center">',
        '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">',
        '<tr><td style="background:linear-gradient(135deg,#111827 0%,#1f2937 100%);padding:32px;">',
        '<table width="100%" cellpadding="0" cellspacing="0"><tr>',
        '<td><span style="display:inline-block;background:rgba(255,255,255,0.15);color:#ffffff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">New Application</span></td>',
        `<td align="right"><span style="color:#9ca3af;font-size:14px;">${dateStr}</span></td>`,
        '</tr></table>',
        `<h1 style="margin:16px 0 0;color:#ffffff;font-size:24px;font-weight:700;">${serviceEmoji} ${serviceName}</h1>`,
        '</td></tr>',
        '<tr><td style="padding:32px;">',
        '<div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">',
        '<table width="100%" cellpadding="0" cellspacing="0">',
        '<tr><td style="padding-bottom:16px;">',
        '<p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Full Name</p>',
        `<p style="margin:0;color:#111827;font-size:18px;font-weight:600;">${fullName}</p>`,
        '</td></tr>',
        '<tr><td style="padding-bottom:12px;">',
        '<p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Email</p>',
        `<p style="margin:0;"><a href="mailto:${email}" style="color:#2563eb;font-size:16px;text-decoration:none;">${email}</a></p>`,
        '</td></tr>',
        phoneRow,
        '</table></div>',
        messageSection,
        customFieldsSection,
        '<div style="text-align:center;padding-top:8px;">',
        `<a href="mailto:${email}?subject=Re: Your ${serviceName} Application" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">Reply to ${firstName}</a>`,
        '</div></td></tr>',
        '<tr><td style="padding:20px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">',
        `<p style="margin:0;color:#9ca3af;font-size:13px;">Application ID: ${application.id}</p>`,
        '</td></tr></table></td></tr></table></body></html>'
      ].join('');

      const notificationResult = await resend.emails.send({
        from: "AYN Applications <noreply@aynn.io>",
        to: ["info@aynn.io"],
        subject: `${serviceEmoji} New ${serviceName} Application from ${fullName}`,
        html: notificationHtml,
      });

      console.log(`Notification email sent to info@aynn.io:`, JSON.stringify(notificationResult, null, 2));

    } catch (emailError) {
      console.error("Email sending error:", emailError);
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
