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


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Debug environment variables
    console.log('All available env vars:', Object.keys(Deno.env.toObject()));
    console.log('Looking for RESEND_API_KEY...');
    
    // Initialize Resend client
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    console.log('RESEND_API_KEY length:', resendApiKey ? resendApiKey.length : 'null/undefined');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not available in environment');
      throw new Error('RESEND_API_KEY environment variable is not set. Please check Supabase secrets configuration.');
    }
    
    const resend = new Resend(resendApiKey);

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
        sender_email: fromEmail || 'admin@aynn.io',
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
      // Send email via Resend (primary domain)
      const primaryFrom = fromEmail || 'AYN Admin <admin@aynn.io>';
      const emailResponse = await resend.emails.send({
        from: primaryFrom,
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
            resend_response: emailResponse,
            sender_used: primaryFrom
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

    } catch (emailError: any) {
      console.error('Error sending email (primary):', emailError);

      // If domain is not verified or similar sender issue, try fallback Resend sandbox domain
      const errorMessage = emailError?.message || JSON.stringify(emailError);
      const shouldFallback = /domain.*not.*verified|not verified|blocked.*sending|from address/i.test(errorMessage);

      if (shouldFallback) {
        try {
          console.log('Attempting fallback sender with Resend sandbox domain...');
          const fallbackFrom = 'Lovable Sandbox <onboarding@resend.dev>';
          const fallbackResponse = await resend.emails.send({
            from: fallbackFrom,
            to: [to],
            subject: finalSubject,
            text: finalContent,
            html: finalHtmlContent || `<div style="white-space: pre-wrap;">${finalContent}</div>`,
          });

          await supabaseClient
            .from('admin_emails')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              metadata: { 
                ...emailRecord.metadata, 
                resend_id: fallbackResponse.data?.id,
                resend_response: fallbackResponse,
                fallback_used: true,
                sender_used: fallbackFrom,
                primary_error: errorMessage
              }
            })
            .eq('id', emailRecord.id);

          return new Response(
            JSON.stringify({ 
              success: true, 
              emailId: emailRecord.id,
              resendId: fallbackResponse.data?.id,
              message: 'Email sent successfully (fallback sender)'
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        } catch (fallbackError: any) {
          console.error('Fallback send failed:', fallbackError);
          await supabaseClient
            .from('admin_emails')
            .update({
              status: 'failed',
              error_message: `Primary: ${errorMessage} | Fallback: ${fallbackError?.message || JSON.stringify(fallbackError)}`,
              metadata: { ...emailRecord.metadata, error_primary: emailError, error_fallback: fallbackError }
            })
            .eq('id', emailRecord.id);

          return new Response(
            JSON.stringify({ success: false, error: 'Email sending failed for both primary and fallback senders' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }

      // Update email record as failed (no fallback)
      await supabaseClient
        .from('admin_emails')
        .update({
          status: 'failed',
          error_message: errorMessage,
          metadata: { ...emailRecord.metadata, error: emailError }
        })
        .eq('id', emailRecord.id);

      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
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