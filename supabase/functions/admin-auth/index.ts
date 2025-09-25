import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminAuthRequest {
  password: string;
  actionType: 'general' | 'emergency';
}

interface AdminAuthResponse {
  success: boolean;
  message: string;
  sessionToken?: string;
  expiresAt?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { password, actionType }: AdminAuthRequest = await req.json();

    if (!password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Password is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the appropriate password from environment
    const masterPassword = actionType === 'emergency' 
      ? Deno.env.get('EMERGENCY_SHUTDOWN_PASSWORD')
      : Deno.env.get('ADMIN_MASTER_PASSWORD');

    if (!masterPassword) {
      console.error(`Missing environment variable for ${actionType} password`);
      
      // Log security event
      await supabase.rpc('log_security_event', {
        _action: 'admin_auth_config_error',
        _details: { action_type: actionType, error: 'Missing password configuration' },
        _severity: 'critical'
      });

      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Authentication service temporarily unavailable' 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate password
    const isValid = password === masterPassword;
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    if (isValid) {
      // Generate secure session token
      const sessionToken = crypto.randomUUID();
      const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes

      // Log successful authentication
      await supabase.rpc('log_security_event', {
        _action: 'admin_auth_success',
        _details: { 
          action_type: actionType,
          session_token: sessionToken.substring(0, 8) + '...', // Only log partial token
          client_ip: clientIP,
          expires_at: new Date(expiresAt).toISOString()
        },
        _severity: 'info'
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Authentication successful',
        sessionToken,
        expiresAt
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Log failed authentication attempt
      await supabase.rpc('log_security_event', {
        _action: 'admin_auth_failed',
        _details: { 
          action_type: actionType,
          client_ip: clientIP,
          timestamp: new Date().toISOString()
        },
        _severity: 'high'
      });

      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid password'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Admin authentication error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Authentication service error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});