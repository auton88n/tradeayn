import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityCheckRequest {
  type: 'threat_scan' | 'anomaly_detection' | 'vulnerability_check';
  data?: any;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, data }: SecurityCheckRequest = await req.json();

    let result;

    switch (type) {
      case 'threat_scan':
        result = await performThreatScan(user.id);
        break;
      case 'anomaly_detection':
        result = await detectAnomalies(user.id);
        break;
      case 'vulnerability_check':
        result = await checkVulnerabilities();
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid security check type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Security monitor error:', error);
    
    // Log the security incident
    await supabase.rpc('log_security_event', {
      _action: 'security_monitor_error',
      _details: { error: error.message },
      _severity: 'high'
    });

    return new Response(
      JSON.stringify({ error: 'Security check failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function performThreatScan(adminUserId: string) {
  // Scan for suspicious activities in the last 24 hours
  const { data: threats } = await supabase
    .from('security_audit_logs')
    .select('*')
    .in('severity', ['high', 'critical'])
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  // Analyze threat patterns
  const threatPatterns = {
    malicious_inputs: threats?.filter(t => t.action === 'malicious_input_detected').length || 0,
    rate_limit_violations: threats?.filter(t => t.action === 'rate_limit_exceeded').length || 0,
    suspicious_activities: threats?.filter(t => t.action === 'suspicious_activity_detected').length || 0,
    xss_attempts: threats?.filter(t => t.action === 'potential_xss_attempt').length || 0
  };

  return {
    scan_type: 'threat_scan',
    timestamp: new Date().toISOString(),
    threat_level: calculateThreatLevel(threatPatterns),
    patterns: threatPatterns,
    recent_threats: threats?.slice(0, 10) || []
  };
}

async function detectAnomalies(adminUserId: string) {
  // Detect unusual patterns in user behavior
  const { data: recentLogs } = await supabase
    .from('security_audit_logs')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  const anomalies = [];

  if (recentLogs) {
    // Check for unusual activity patterns
    const userActivities = recentLogs.reduce((acc, log) => {
      if (!acc[log.user_id]) acc[log.user_id] = [];
      acc[log.user_id].push(log);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [userId, activities] of Object.entries(userActivities)) {
      // Detect rapid successive actions (potential bot activity)
      const rapidActions = activities.filter((activity, index) => {
        if (index === 0) return false;
        const prevActivity = activities[index - 1];
        const timeDiff = new Date(activity.created_at).getTime() - new Date(prevActivity.created_at).getTime();
        return timeDiff < 1000; // Less than 1 second between actions
      });

      if (rapidActions.length > 10) {
        anomalies.push({
          type: 'rapid_actions',
          user_id: userId,
          count: rapidActions.length,
          severity: 'high'
        });
      }

      // Detect unusual time patterns (activity at odd hours)
      const nightActivities = activities.filter(activity => {
        const hour = new Date(activity.created_at).getUTCHours();
        return hour >= 2 && hour <= 5; // Between 2 AM and 5 AM UTC
      });

      if (nightActivities.length > 20) {
        anomalies.push({
          type: 'unusual_time_pattern',
          user_id: userId,
          count: nightActivities.length,
          severity: 'medium'
        });
      }
    }
  }

  return {
    scan_type: 'anomaly_detection',
    timestamp: new Date().toISOString(),
    anomalies_detected: anomalies.length,
    anomalies: anomalies.slice(0, 20) // Limit to top 20
  };
}

async function checkVulnerabilities() {
  const vulnerabilities = [];

  // Check for common security misconfigurations
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  // Check if RLS is properly configured
  try {
    const { data: anonAccess } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (anonAccess && anonAccess.length > 0) {
      vulnerabilities.push({
        type: 'rls_bypass',
        severity: 'critical',
        description: 'Anonymous users can access profile data'
      });
    }
  } catch (error) {
    // Good - should fail for anonymous users
  }

  // Check for weak authentication patterns
  const { data: rateLimits } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('action_type', 'login_attempt')
    .gt('attempt_count', 10);

  if (rateLimits && rateLimits.length > 5) {
    vulnerabilities.push({
      type: 'brute_force_attempts',
      severity: 'high',
      description: `${rateLimits.length} users have excessive login attempts`
    });
  }

  return {
    scan_type: 'vulnerability_check',
    timestamp: new Date().toISOString(),
    vulnerabilities_found: vulnerabilities.length,
    vulnerabilities
  };
}

function calculateThreatLevel(patterns: any): 'low' | 'medium' | 'high' | 'critical' {
  const totalThreats = Object.values(patterns).reduce((sum: number, count: any) => sum + count, 0);
  
  if (totalThreats === 0) return 'low';
  if (totalThreats < 5) return 'medium';
  if (totalThreats < 20) return 'high';
  return 'critical';
}