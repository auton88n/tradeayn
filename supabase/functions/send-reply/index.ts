import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReplyRequest {
  applicationId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, recipientEmail, recipientName, subject, message }: ReplyRequest = await req.json();

    if (!applicationId || !recipientEmail || !recipientName || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.info(`Sending reply to ${recipientName} (${recipientEmail}) for application ${applicationId}`);

    // Check SMTP credentials
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("SMTP credentials not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstName = recipientName.split(' ')[0];

    // Format message with line breaks for HTML
    const formattedMessage = message.replace(/\n/g, '<br>');

    const replyHtml = `<!DOCTYPE html>
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
Hello, ${firstName}!
</h2>
<div style="color:#333333;font-size:17px;line-height:1.8;margin:0 0 32px 0;">
${formattedMessage}
</div>
<div style="border-top:1px solid #e5e7eb;padding-top:32px;margin-top:40px;">
<p style="color:#999999;font-size:14px;margin:0 0 16px 0;line-height:1.6;">
Best regards,<br>
<strong style="color:#000000;">The AYN Team</strong>
</p>
<a href="https://aynn.io" style="display:inline-block;background-color:#000000;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
Visit AYN
</a>
</div>
</td>
</tr>
<tr>
<td style="padding:30px 40px;border-top:1px solid #f0f0f0;text-align:center;">
<p style="margin:0;color:#999999;font-size:13px;">
© ${new Date().getFullYear()} AYN. All rights reserved.
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

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
      await smtpClient.send({
        from: "AYN Team <info@aynn.io>",
        to: recipientEmail,
        subject: subject,
        content: message,
        html: replyHtml,
      });

      console.info(`Reply email sent to ${recipientEmail}`);

      await smtpClient.close();

      // Update application status in database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from("service_applications")
        .update({ status: 'replied', updated_at: new Date().toISOString() })
        .eq("id", applicationId);

      return new Response(
        JSON.stringify({ success: true, message: "Reply sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (emailError) {
      console.error("Email sending error:", emailError);
      try {
        await smtpClient.close();
      } catch {
        // Ignore close errors
      }
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error processing reply:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process reply" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
