import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookConfig {
  mode_name: string;
  webhook_url: string;
  is_active: boolean;
}

interface HealthCheckResult {
  mode_name: string;
  webhook_url: string;
  status: 'online' | 'offline' | 'degraded';
  response_time_ms: number;
  error_message: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for optional specific mode check
    let specificMode: string | null = null;
    try {
      const body = await req.json();
      specificMode = body.mode_name || null;
    } catch {
      // No body or invalid JSON, check all modes
    }

    // Fetch active webhook configs
    let query = supabase.from('ai_mode_configs').select('*').eq('is_active', true);
    if (specificMode) {
      query = query.eq('mode_name', specificMode);
    }
    
    const { data: webhookConfigs, error: configError } = await query;

    if (configError) {
      console.error('Error fetching webhook configs:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhook configurations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhookConfigs || webhookConfigs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active webhook configurations found', results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking health of ${webhookConfigs.length} webhooks...`);

    // Check health of each webhook
    const results: HealthCheckResult[] = [];
    
    for (const config of webhookConfigs as WebhookConfig[]) {
      const startTime = Date.now();
      let status: 'online' | 'offline' | 'degraded' = 'offline';
      let errorMessage: string | null = null;
      let responseTime = 0;

      try {
        // Send a lightweight OPTIONS request to check if webhook is reachable
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(config.webhook_url, {
          method: 'OPTIONS',
          signal: controller.signal,
          headers: {
            'X-Health-Check': 'true',
          },
        });

        clearTimeout(timeoutId);
        responseTime = Date.now() - startTime;

        if (response.ok || response.status === 405) {
          // 405 is acceptable - means the endpoint exists but doesn't support OPTIONS
          status = responseTime > 3000 ? 'degraded' : 'online';
        } else if (response.status >= 500) {
          status = 'offline';
          errorMessage = `Server error: ${response.status}`;
        } else {
          status = 'degraded';
          errorMessage = `Unexpected status: ${response.status}`;
        }
      } catch (error) {
        responseTime = Date.now() - startTime;
        status = 'offline';
        errorMessage = error instanceof Error ? error.message : 'Connection failed';
        console.error(`Health check failed for ${config.mode_name}:`, errorMessage);
      }

      const result: HealthCheckResult = {
        mode_name: config.mode_name,
        webhook_url: config.webhook_url,
        status,
        response_time_ms: responseTime,
        error_message: errorMessage,
      };

      results.push(result);

      // Store result in database
      const { error: insertError } = await supabase
        .from('webhook_health_metrics')
        .insert({
          mode_name: config.mode_name,
          webhook_url: config.webhook_url,
          status,
          response_time_ms: responseTime,
          error_message: errorMessage,
          success_count_24h: status === 'online' ? 1 : 0,
          failure_count_24h: status === 'offline' ? 1 : 0,
        });

      if (insertError) {
        console.error(`Failed to store health metric for ${config.mode_name}:`, insertError);
      }

      // Log critical issues to security_logs
      if (status === 'offline') {
        await supabase.from('security_logs').insert({
          user_id: user.id,
          action: 'webhook_health_check_failed',
          details: {
            mode_name: config.mode_name,
            error_message: errorMessage,
            response_time_ms: responseTime,
          },
          severity: 'high',
        });
      }
    }

    // Cleanup old metrics (keep 7 days)
    await supabase.rpc('cleanup_old_health_metrics');

    console.log(`Health check complete. Results:`, results.map(r => `${r.mode_name}: ${r.status}`).join(', '));

    return new Response(
      JSON.stringify({
        message: 'Health check complete',
        checked_at: new Date().toISOString(),
        results,
        summary: {
          total: results.length,
          online: results.filter(r => r.status === 'online').length,
          degraded: results.filter(r => r.status === 'degraded').length,
          offline: results.filter(r => r.status === 'offline').length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
