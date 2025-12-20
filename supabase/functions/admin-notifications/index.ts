import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "access_request" | "daily_report" | "security_alert";
  user_id?: string;
  user_email?: string;
  action?: string;
  severity?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at?: string;
}

// Simple HMAC-like signature using Web Crypto API
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataToSign = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, dataToSign);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Generate approval token
async function generateApprovalToken(
  userId: string, 
  userEmail: string, 
  adminEmail: string, 
  secret: string
): Promise<string> {
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
  const dataToSign = `${userId}:${userEmail}:${adminEmail}:${expiresAt}`;
  const signature = await createSignature(dataToSign, secret);
  
  const tokenData = {
    user_id: userId,
    user_email: userEmail,
    admin_email: adminEmail,
    expires_at: expiresAt,
    signature
  };
  
  return btoa(JSON.stringify(tokenData));
}

// Premium email template
function generateEmailTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #eee;">
              <h1 style="margin: 0; font-size: 42px; font-weight: 900; letter-spacing: -2px; color: #0a0a0a;">AYN</h1>
              <div style="width: 40px; height: 3px; background-color: #0a0a0a; margin: 15px auto 0;"></div>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="padding: 30px 40px 10px 40px;">
              <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #0a0a0a;">${title}</h2>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
                This is an automated notification from AYN Admin System<br>
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
}

// Access request email content with approve button
function generateAccessRequestContent(data: NotificationRequest, approveUrl?: string): string {
  const timestamp = data.created_at ? new Date(data.created_at).toLocaleString('en-US', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  }) : new Date().toLocaleString('en-US');
  
  const approveButton = approveUrl ? `
    <a href="${approveUrl}" style="display: inline-block; padding: 14px 32px; background-color: #22c55e; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; margin-right: 12px;">✓ Approve Now</a>
  ` : '';
  
  return `
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1px;">New User</p>
      <p style="margin: 0; font-size: 18px; font-weight: 500; color: #0a0a0a;">${data.user_email || 'Unknown'}</p>
    </div>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1px;">User ID</p>
      <p style="margin: 0; font-size: 14px; font-family: monospace; color: #0a0a0a;">${data.user_id || 'Unknown'}</p>
    </div>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1px;">Requested At</p>
      <p style="margin: 0; font-size: 14px; color: #0a0a0a;">${timestamp}</p>
    </div>
    <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
      A new user has registered and is awaiting access approval. Click "Approve Now" for instant approval, or use the Admin Panel for more options.
    </p>
    <div style="margin-top: 30px; text-align: center;">
      ${approveButton}
      <a href="https://aynn.io/admin" style="display: inline-block; padding: 14px 32px; background-color: #0a0a0a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Open Admin Panel</a>
    </div>
    <p style="margin: 24px 0 0 0; font-size: 12px; color: #999; text-align: center;">
      The approval link expires in 24 hours for security.
    </p>
  `;
}

// Security alert email content
function generateSecurityAlertContent(data: NotificationRequest): string {
  const timestamp = data.created_at ? new Date(data.created_at).toLocaleString('en-US', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  }) : new Date().toLocaleString('en-US');
  
  const severityColor = data.severity === 'critical' ? '#dc2626' : '#f59e0b';
  const severityLabel = data.severity?.toUpperCase() || 'HIGH';
  
  return `
    <div style="background-color: ${severityColor}15; border-left: 4px solid ${severityColor}; border-radius: 4px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${severityColor};">⚠️ ${severityLabel} SEVERITY ALERT</p>
    </div>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1px;">Action</p>
      <p style="margin: 0; font-size: 16px; font-weight: 500; color: #0a0a0a;">${data.action || 'Unknown action'}</p>
    </div>
    ${data.ip_address ? `
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1px;">IP Address</p>
      <p style="margin: 0; font-size: 14px; font-family: monospace; color: #0a0a0a;">${data.ip_address}</p>
    </div>
    ` : ''}
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1px;">Detected At</p>
      <p style="margin: 0; font-size: 14px; color: #0a0a0a;">${timestamp}</p>
    </div>
    ${data.details ? `
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1px;">Details</p>
      <pre style="margin: 0; font-size: 12px; font-family: monospace; color: #0a0a0a; white-space: pre-wrap; word-break: break-all;">${JSON.stringify(data.details, null, 2)}</pre>
    </div>
    ` : ''}
    <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
      Please investigate this security event immediately and take appropriate action.
    </p>
    <div style="margin-top: 30px; text-align: center;">
      <a href="https://aynn.io/admin" style="display: inline-block; padding: 14px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">View Security Logs</a>
    </div>
  `;
}

// Daily report email content
function generateDailyReportContent(metrics: Record<string, unknown>): string {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">${today}</p>
    
    <h3 style="margin: 30px 0 15px 0; font-size: 16px; font-weight: 600; color: #0a0a0a; border-bottom: 1px solid #eee; padding-bottom: 10px;">📊 User Metrics</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border-radius: 6px 0 0 6px;">
          <p style="margin: 0; font-size: 12px; color: #999;">Total Users</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #0a0a0a;">${metrics.totalUsers || 0}</p>
        </td>
        <td style="padding: 12px; background-color: #f8f9fa;">
          <p style="margin: 0; font-size: 12px; color: #999;">Active Users</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #0a0a0a;">${metrics.activeUsers || 0}</p>
        </td>
        <td style="padding: 12px; background-color: #f8f9fa; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; font-size: 12px; color: #999;">New Today</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #22c55e;">${metrics.newUsersToday || 0}</p>
        </td>
      </tr>
    </table>

    <h3 style="margin: 30px 0 15px 0; font-size: 16px; font-weight: 600; color: #0a0a0a; border-bottom: 1px solid #eee; padding-bottom: 10px;">💬 Activity</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border-radius: 6px 0 0 6px;">
          <p style="margin: 0; font-size: 12px; color: #999;">Messages Today</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #0a0a0a;">${metrics.messagesToday || 0}</p>
        </td>
        <td style="padding: 12px; background-color: #f8f9fa;">
          <p style="margin: 0; font-size: 12px; color: #999;">Total Messages</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #0a0a0a;">${metrics.totalMessages || 0}</p>
        </td>
        <td style="padding: 12px; background-color: #f8f9fa; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; font-size: 12px; color: #999;">Sessions Today</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #0a0a0a;">${metrics.sessionsToday || 0}</p>
        </td>
      </tr>
    </table>

    <h3 style="margin: 30px 0 15px 0; font-size: 16px; font-weight: 600; color: #0a0a0a; border-bottom: 1px solid #eee; padding-bottom: 10px;">🎫 Support & Applications</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border-radius: 6px 0 0 6px;">
          <p style="margin: 0; font-size: 12px; color: #999;">Open Tickets</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: ${Number(metrics.openTickets) > 0 ? '#f59e0b' : '#0a0a0a'};">${metrics.openTickets || 0}</p>
        </td>
        <td style="padding: 12px; background-color: #f8f9fa;">
          <p style="margin: 0; font-size: 12px; color: #999;">Pending Access</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: ${Number(metrics.pendingAccess) > 0 ? '#f59e0b' : '#0a0a0a'};">${metrics.pendingAccess || 0}</p>
        </td>
        <td style="padding: 12px; background-color: #f8f9fa; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; font-size: 12px; color: #999;">New Applications</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #0a0a0a;">${metrics.newApplications || 0}</p>
        </td>
      </tr>
    </table>

    <h3 style="margin: 30px 0 15px 0; font-size: 16px; font-weight: 600; color: #0a0a0a; border-bottom: 1px solid #eee; padding-bottom: 10px;">🔒 Security</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border-radius: 6px 0 0 6px;">
          <p style="margin: 0; font-size: 12px; color: #999;">Security Events (24h)</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: ${Number(metrics.securityEvents) > 0 ? '#dc2626' : '#22c55e'};">${metrics.securityEvents || 0}</p>
        </td>
        <td style="padding: 12px; background-color: #f8f9fa;">
          <p style="margin: 0; font-size: 12px; color: #999;">Rate Limit Violations</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: ${Number(metrics.rateLimitViolations) > 0 ? '#f59e0b' : '#0a0a0a'};">${metrics.rateLimitViolations || 0}</p>
        </td>
        <td style="padding: 12px; background-color: #f8f9fa; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; font-size: 12px; color: #999;">Blocked IPs</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #0a0a0a;">${metrics.blockedIPs || 0}</p>
        </td>
      </tr>
    </table>

    <div style="margin-top: 30px; text-align: center;">
      <a href="https://aynn.io/admin" style="display: inline-block; padding: 14px 32px; background-color: #0a0a0a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">View Full Dashboard</a>
    </div>
  `;
}

// Fetch daily metrics from database
async function fetchDailyMetrics(supabase: ReturnType<typeof createClient>): Promise<Record<string, unknown>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Parallel queries for efficiency
  const [
    totalUsersResult,
    activeUsersResult,
    newUsersTodayResult,
    messagesTodayResult,
    totalMessagesResult,
    sessionsTodayResult,
    openTicketsResult,
    pendingAccessResult,
    newApplicationsResult,
    securityEventsResult,
    rateLimitViolationsResult,
    blockedIPsResult
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('access_grants').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
    supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    supabase.from('access_grants').select('id', { count: 'exact', head: true }).eq('is_active', false).eq('requires_approval', true),
    supabase.from('service_applications').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('security_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayISO).in('severity', ['high', 'critical']),
    supabase.from('api_rate_limits').select('id', { count: 'exact', head: true }).gt('violation_count', 0),
    supabase.from('ip_blocks').select('id', { count: 'exact', head: true }).eq('is_active', true)
  ]);

  return {
    totalUsers: totalUsersResult.count || 0,
    activeUsers: activeUsersResult.count || 0,
    newUsersToday: newUsersTodayResult.count || 0,
    messagesToday: messagesTodayResult.count || 0,
    totalMessages: totalMessagesResult.count || 0,
    sessionsToday: sessionsTodayResult.count || 0,
    openTickets: openTicketsResult.count || 0,
    pendingAccess: pendingAccessResult.count || 0,
    newApplications: newApplicationsResult.count || 0,
    securityEvents: securityEventsResult.count || 0,
    rateLimitViolations: rateLimitViolationsResult.count || 0,
    blockedIPs: blockedIPsResult.count || 0
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Admin notifications function called");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const approvalSecret = Deno.env.get("APPROVAL_TOKEN_SECRET");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: NotificationRequest = await req.json();
    console.log("Notification type:", data.type);

    // Get notification config
    const { data: config, error: configError } = await supabase
      .from('admin_notification_config')
      .select('*')
      .eq('notification_type', data.type)
      .single();

    if (configError || !config) {
      console.log("Config not found or error:", configError);
      return new Response(
        JSON.stringify({ error: "Notification type not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!config.is_enabled) {
      console.log("Notifications disabled for type:", data.type);
      return new Response(
        JSON.stringify({ message: "Notifications disabled for this type" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipientEmail = config.recipient_email;
    let subject = "";
    let content = "";
    let htmlBody = "";

    // Generate email based on type
    switch (data.type) {
      case "access_request":
        subject = "🔔 New Access Request - AYN";
        
        // Generate approval URL if secret is configured
        let approveUrl: string | undefined;
        if (approvalSecret && data.user_id && data.user_email) {
          const token = await generateApprovalToken(
            data.user_id,
            data.user_email,
            recipientEmail,
            approvalSecret
          );
          approveUrl = `https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/approve-access?token=${encodeURIComponent(token)}`;
          console.log("Generated approval URL for user:", data.user_email);
        } else {
          console.log("Approval token not generated - missing secret or user data");
        }
        
        content = generateAccessRequestContent(data, approveUrl);
        htmlBody = generateEmailTemplate("New Access Request", content);
        break;

      case "security_alert":
        subject = `⚠️ Security Alert: ${data.action} - AYN`;
        content = generateSecurityAlertContent(data);
        htmlBody = generateEmailTemplate("Security Alert", content);
        break;

      case "daily_report":
        const metrics = await fetchDailyMetrics(supabase);
        subject = "📊 Daily System Report - AYN";
        content = generateDailyReportContent(metrics);
        htmlBody = generateEmailTemplate("Daily System Report", content);
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Unknown notification type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Send email via SMTP
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.hostinger.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const senderEmail = Deno.env.get("SENDER_EMAIL") || smtpUser;

    if (!smtpUser || !smtpPass) {
      console.error("SMTP credentials not configured");
      return new Response(
        JSON.stringify({ error: "Email configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Connecting to SMTP:", smtpHost, smtpPort);
    
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

    try {
      await client.send({
        from: senderEmail!,
        to: recipientEmail,
        subject: subject,
        html: htmlBody,
      });
      
      console.log("Email sent successfully to:", recipientEmail);

      // Log the notification
      await supabase.from('admin_notification_log').insert({
        notification_type: data.type,
        recipient_email: recipientEmail,
        subject: subject,
        status: 'sent',
        metadata: {
          user_id: data.user_id,
          user_email: data.user_email,
          has_approval_link: data.type === 'access_request' && approvalSecret ? true : false
        }
      });

      await client.close();
      
      return new Response(
        JSON.stringify({ success: true, message: "Notification sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (smtpError) {
      console.error("SMTP error:", smtpError);
      
      // Log the failure
      await supabase.from('admin_notification_log').insert({
        notification_type: data.type,
        recipient_email: recipientEmail,
        subject: subject,
        status: 'failed',
        error_message: smtpError instanceof Error ? smtpError.message : 'Unknown SMTP error'
      });
      
      await client.close();
      
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: smtpError instanceof Error ? smtpError.message : 'Unknown error' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error in admin-notifications:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
