import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  content: string;
  htmlContent?: string;
  fromEmail?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const emailRequest: EmailRequest = await req.json();
    const { to, subject, content, htmlContent, fromEmail, templateId, templateVariables } = emailRequest;

    let finalSubject = subject;
    let finalContent = content;
    let finalHtmlContent = htmlContent;

    // If using a template, fetch and process it
    if (templateId) {
      const { data: template, error: templateError } = await supabaseClient
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) {
        throw new Error('Template not found');
      }

      // Replace template variables
      finalSubject = template.subject;
      finalContent = template.content;
      finalHtmlContent = template.html_content;

      if (templateVariables) {
        Object.entries(templateVariables).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          finalSubject = finalSubject.replace(new RegExp(placeholder, 'g'), value);
          finalContent = finalContent.replace(new RegExp(placeholder, 'g'), value);
          if (finalHtmlContent) {
            finalHtmlContent = finalHtmlContent.replace(new RegExp(placeholder, 'g'), value);
          }
        });
      }
    }

    // Create email record in database (draft initially)
    const { data: emailRecord, error: insertError } = await supabaseClient
      .from('admin_emails')
      .insert({
        sender_email: fromEmail || 'admin@yourcompany.com',
        recipient_email: to,
        subject: finalSubject,
        content: finalContent,
        html_content: finalHtmlContent,
        email_type: 'outbound',
        status: 'draft',
        created_by: user.id,
        metadata: { template_id: templateId, template_variables: templateVariables }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating email record:', insertError);
      throw new Error('Failed to create email record');
    }

    try {
      // Send email via Resend
      const emailResponse = await resend.emails.send({
        from: fromEmail || 'Admin <admin@yourcompany.com>',
        to: [to],
        subject: finalSubject,
        text: finalContent,
        html: finalHtmlContent || `<div style="white-space: pre-wrap;">${finalContent}</div>`,
      });

      console.log('Email sent successfully:', emailResponse);

      // Update email record as sent
      await supabaseClient
        .from('admin_emails')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: { 
            ...emailRecord.metadata, 
            resend_id: emailResponse.data?.id,
            resend_response: emailResponse 
          }
        })
        .eq('id', emailRecord.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          emailId: emailRecord.id,
          resendId: emailResponse.data?.id,
          message: 'Email sent successfully' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );

    } catch (emailError) {
      console.error('Error sending email:', emailError);

      // Update email record as failed
      await supabaseClient
        .from('admin_emails')
        .update({
          status: 'failed',
          error_message: emailError.message,
          metadata: { ...emailRecord.metadata, error: emailError }
        })
        .eq('id', emailRecord.id);

      throw emailError;
    }

  } catch (error) {
    console.error('Error in send-admin-email function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send email' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});