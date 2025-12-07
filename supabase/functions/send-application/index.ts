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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serviceType, fullName, email, phone, message, customFields }: ApplicationRequest = await req.json();

    // Validate required fields
    if (!serviceType || !fullName || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: serviceType, fullName, email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing application from ${fullName} (${email}) for ${serviceType}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save to database
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

    // Initialize Resend client
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const serviceName = SERVICE_NAMES[serviceType] || serviceType;

    // Build custom fields HTML for team email
    let customFieldsHtml = '';
    if (customFields && Object.keys(customFields).length > 0) {
      customFieldsHtml = '<h3 style="color: #666; margin-top: 20px;">Additional Details:</h3><ul style="color: #333;">';
      for (const [key, value] of Object.entries(customFields)) {
        customFieldsHtml += `<li><strong>${key}:</strong> ${value}</li>`;
      }
      customFieldsHtml += '</ul>';
    }

    try {
      // Send confirmation email to applicant
      const confirmationResult = await resend.emails.send({
        from: "AYN <noreply@aynn.io>",
        to: [email],
        replyTo: "info@aynn.io",
        subject: `Thank you for your interest in ${serviceName}!`,
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 28px; color: #0a0a0a; margin: 0;">AYN</h1>
              <p style="color: #666; margin-top: 8px;">Your Intelligent Life Companion</p>
            </div>
            
            <h2 style="color: #0a0a0a; font-size: 24px;">Hi ${fullName},</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Thank you for reaching out about our <strong>${serviceName}</strong> service. 
              We've received your application and our team is excited to learn more about your project.
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Expect to hear from us within <strong>24-48 hours</strong> at this email address. 
              Our reply will come from <a href="mailto:info@aynn.io" style="color: #0a0a0a;">info@aynn.io</a>.
            </p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin: 30px 0;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                Have questions? Simply reply to this email and we'll get back to you.
              </p>
            </div>
            
            <p style="color: #333; font-size: 16px;">
              Best regards,<br>
              <strong>The AYN Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0 20px;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} AYN. All rights reserved.
            </p>
          </div>
        `,
      });

      console.log(`Confirmation email sent to ${email}:`, confirmationResult);

      // Send notification email to team
      const notificationResult = await resend.emails.send({
        from: "AYN Applications <noreply@aynn.io>",
        to: ["info@aynn.io"],
        subject: `New ${serviceName} Application from ${fullName}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #0a0a0a; font-size: 24px; margin-bottom: 30px;">New Service Application</h1>
            
            <div style="background: #f5f5f5; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
              <h2 style="color: #0a0a0a; font-size: 18px; margin: 0 0 16px;">Service: ${serviceName}</h2>
              <p style="color: #333; margin: 8px 0;"><strong>Name:</strong> ${fullName}</p>
              <p style="color: #333; margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              ${phone ? `<p style="color: #333; margin: 8px 0;"><strong>Phone:</strong> ${phone}</p>` : ''}
              ${message ? `<p style="color: #333; margin: 8px 0;"><strong>Message:</strong> ${message}</p>` : ''}
            </div>
            
            ${customFieldsHtml}
            
            <div style="margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">
                Application ID: <code>${application.id}</code><br>
                Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC
              </p>
            </div>
            
            <div style="margin-top: 30px;">
              <a href="mailto:${email}?subject=Re: Your ${serviceName} Application" 
                 style="background: #0a0a0a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Reply to ${fullName}
              </a>
            </div>
          </div>
        `,
      });

      console.log(`Notification email sent to info@aynn.io:`, notificationResult);

    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Don't fail the request if emails fail - application is already saved
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