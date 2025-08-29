import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@2.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { PasswordResetEmail } from './_templates/password-reset.tsx';
import { EmailConfirmationEmail } from './_templates/email-confirmation.tsx';

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
  email_type?: string; // Add support for marketing emails
  use_react_template?: boolean; // Add support for React Email templates
  template_type?: 'password_reset' | 'email_confirmation'; // Template type for React Email
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
    const { 
      to, 
      subject, 
      content, 
      htmlContent, 
      fromEmail, 
      templateId, 
      templateVariables, 
      email_type,
      use_react_template,
      template_type
    } = emailRequest;

    let finalSubject = subject;
    let finalContent = content;
    let finalHtmlContent = htmlContent;

    // Handle React Email templates
    if (use_react_template && template_type) {
      const confirmationUrl = templateVariables?.confirmationUrl || '#';
      const userEmail = to;

      try {
        if (template_type === 'password_reset') {
          finalHtmlContent = await renderAsync(
            React.createElement(PasswordResetEmail, {
              confirmationUrl,
              userEmail,
            })
          );
          finalSubject = 'Reset your AYN password';
        } else if (template_type === 'email_confirmation') {
          finalHtmlContent = await renderAsync(
            React.createElement(EmailConfirmationEmail, {
              confirmationUrl,
              userEmail,
            })
          );
          finalSubject = 'Welcome to AYN - Confirm your email';
        }
        
        // Set plain text content as fallback
        finalContent = content || `Please click the link to ${template_type === 'password_reset' ? 'reset your password' : 'confirm your email'}: ${confirmationUrl}`;
      } catch (renderError) {
        console.error('Error rendering React email template:', renderError);
        // Fall back to regular template processing
      }
    }

    // If using a database template, fetch and process it
    else if (templateId) {
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
        sender_email: fromEmail || 'onboarding@resend.dev',
        recipient_email: to,
        subject: finalSubject,
        content: finalContent,
        html_content: finalHtmlContent,
        email_type: email_type || 'outbound',
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
        from: fromEmail || 'AYN Admin <onboarding@resend.dev>',
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