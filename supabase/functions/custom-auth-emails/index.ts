import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthEmailRequest {
  type: 'signup_confirmation' | 'password_reset' | 'email_change';
  email: string;
  confirmation_url: string;
  user_data?: any;
}

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Verify JWT and check admin role
    const jwt = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      await supabase.rpc('log_security_event', {
        _action: 'unauthorized_email_access_attempt',
        _details: { error: authError?.message || 'Invalid JWT' },
        _severity: 'high'
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check admin role
    const { data: hasAdminRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      await supabase.rpc('log_security_event', {
        _action: 'unauthorized_admin_access_attempt',
        _details: { user_id: user.id, attempted_action: 'send_auth_email' },
        _severity: 'high'
      });
      
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Rate limiting - 5 emails per hour per admin
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _action_type: 'send_auth_email',
      _max_attempts: 5,
      _window_minutes: 60
    });

    if (!rateLimitOk) {
      await supabase.rpc('log_security_event', {
        _action: 'admin_rate_limit_exceeded',
        _details: { action: 'send_auth_email', user_id: user.id },
        _severity: 'medium'
      });
      
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { type, email, confirmation_url, user_data }: AuthEmailRequest = await req.json();

    // Validate confirmation_url against allowed domains
    const allowedDomains = ['https://dfkoxuokfkttjhfjcecx.supabase.co', 'https://lovable.app'];
    const urlValid = allowedDomains.some(domain => confirmation_url.startsWith(domain));
    
    if (!urlValid) {
      await supabase.rpc('log_security_event', {
        _action: 'suspicious_confirmation_url',
        _details: { provided_url: confirmation_url, user_id: user.id },
        _severity: 'high'
      });
      
      return new Response(
        JSON.stringify({ error: 'Invalid confirmation URL domain' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the email template from database
    const { data: template, error: templateError } = await supabase
      .from('auth_email_templates')
      .select('*')
      .eq('template_type', type)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template error:', templateError);
      return new Response(
        JSON.stringify({ error: 'Email template not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Replace template variables
    let htmlContent = template.html_content;
    let textContent = template.text_content || '';
    
    // Replace common variables
    htmlContent = htmlContent.replace(/\{\{ \.Email \}\}/g, email);
    htmlContent = htmlContent.replace(/\{\{ \.ConfirmationURL \}\}/g, confirmation_url);
    
    textContent = textContent.replace(/\{\{ \.Email \}\}/g, email);
    textContent = textContent.replace(/\{\{ \.ConfirmationURL \}\}/g, confirmation_url);

    // Add user-specific data if available
    if (user_data) {
      for (const [key, value] of Object.entries(user_data)) {
        const placeholder = `{{ .${key} }}`;
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), String(value));
        textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value));
      }
    }

    // Send the email
    const emailResponse = await resend.emails.send({
      from: 'AYN <auth@aynn.io>',
      to: [email],
      subject: template.subject,
      html: htmlContent,
      text: textContent,
    });

    console.log('Custom auth email sent successfully:', emailResponse);

    // Log successful email send
    await supabase.rpc('log_security_event', {
      _action: 'auth_email_sent_success',
      _details: { 
        email_type: type, 
        recipient: email, 
        admin_id: user.id,
        email_id: emailResponse.data?.id 
      },
      _severity: 'low'
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Custom authentication email sent successfully',
      email_id: emailResponse.data?.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in custom-auth-emails function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send custom authentication email',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(serve_handler);