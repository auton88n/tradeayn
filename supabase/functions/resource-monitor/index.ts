import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[resource-monitor] Starting resource monitoring check...');

    // Example resource thresholds (these would be configured based on your Supabase plan)
    const resourceLimits = {
      storage_mb: 500, // 500MB limit for storage
      mau_count: 50000, // Monthly Active Users limit
      function_invocations: 500000, // Function invocations per month
    };

    // Simulate checking current resource usage
    // In a real implementation, these would come from Supabase APIs or metrics
    const currentUsage = {
      storage_mb: Math.floor(Math.random() * 600), // Random for demo
      mau_count: Math.floor(Math.random() * 60000),
      function_invocations: Math.floor(Math.random() * 600000),
    };

    const alerts = [];

    // Check each resource type
    for (const [metricType, currentValue] of Object.entries(currentUsage)) {
      const limitValue = resourceLimits[metricType as keyof typeof resourceLimits];
      const usagePercentage = (currentValue / limitValue) * 100;

      console.log(`[resource-monitor] ${metricType}: ${currentValue}/${limitValue} (${usagePercentage.toFixed(1)}%)`);

      // Update resource usage table
      await supabase
        .from('resource_usage')
        .upsert({
          metric_type: metricType,
          current_value: currentValue,
          limit_value: limitValue,
          usage_percentage: usagePercentage,
          alert_threshold_percentage: 80.0,
        }, {
          onConflict: 'metric_type',
        });

      // Check if alert threshold is exceeded
      if (usagePercentage >= 80) {
        const { data: lastAlert } = await supabase
          .from('resource_usage')
          .select('last_alerted_at')
          .eq('metric_type', metricType)
          .single();

        // Only send alert if we haven't alerted in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const shouldAlert = !lastAlert?.last_alerted_at || 
                           new Date(lastAlert.last_alerted_at) < oneHourAgo;

        if (shouldAlert) {
          console.log(`[resource-monitor] Sending alert for ${metricType} at ${usagePercentage.toFixed(1)}%`);
          
          let alertLevel = 'Warning';
          let alertColor = '#f59e0b'; // Yellow
          
          if (usagePercentage >= 95) {
            alertLevel = 'Critical';
            alertColor = '#dc2626'; // Red
          } else if (usagePercentage >= 90) {
            alertLevel = 'High';
            alertColor = '#ea580c'; // Orange
          }

          // Send notification
          await supabase.functions.invoke('send-notifications', {
            body: {
              type: 'resource_warning',
              subject: `${alertLevel} Resource Usage Alert - ${metricType}`,
              content: `
                <div style="background: ${alertColor}20; border: 2px solid ${alertColor}; padding: 20px; border-radius: 8px; margin: 15px 0;">
                  <h2 style="color: ${alertColor}; margin: 0 0 15px 0;">⚠️ ${alertLevel} Resource Usage Alert</h2>
                  <p><strong>Resource:</strong> ${metricType.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Current Usage:</strong> ${currentValue.toLocaleString()}</p>
                  <p><strong>Limit:</strong> ${limitValue.toLocaleString()}</p>
                  <p><strong>Usage Percentage:</strong> ${usagePercentage.toFixed(1)}%</p>
                  
                  ${usagePercentage >= 95 ? 
                    '<p style="color: #dc2626; font-weight: bold;">⚠️ CRITICAL: You are approaching your resource limit! Service may be interrupted soon.</p>' :
                    usagePercentage >= 90 ?
                    '<p style="color: #ea580c; font-weight: bold;">⚠️ HIGH: Please monitor usage closely and consider upgrading your plan.</p>' :
                    '<p style="color: #f59e0b;">⚠️ WARNING: Consider monitoring usage and planning for potential upgrades.</p>'
                  }
                </div>
                
                <h3>Recommended Actions:</h3>
                <ul>
                  <li>Monitor usage patterns and trends</li>
                  <li>Consider optimizing resource consumption</li>
                  <li>Plan for potential service plan upgrade</li>
                  <li>Review and clean up unused resources if applicable</li>
                </ul>
                
                <p>Time: ${new Date().toLocaleString()}</p>
              `,
              metadata: {
                metric_type: metricType,
                current_value: currentValue,
                limit_value: limitValue,
                usage_percentage: usagePercentage,
                alert_level: alertLevel,
                timestamp: new Date().toISOString()
              }
            }
          });

          // Update last alerted timestamp
          await supabase
            .from('resource_usage')
            .update({ last_alerted_at: new Date().toISOString() })
            .eq('metric_type', metricType);

          alerts.push({
            metric: metricType,
            usage: usagePercentage,
            level: alertLevel
          });
        }
      }
    }

    console.log(`[resource-monitor] Completed monitoring check. Alerts sent: ${alerts.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Resource monitoring completed',
      alerts_sent: alerts.length,
      alerts: alerts,
      resource_status: Object.entries(currentUsage).map(([metric, value]) => ({
        metric,
        current: value,
        limit: resourceLimits[metric as keyof typeof resourceLimits],
        percentage: ((value / resourceLimits[metric as keyof typeof resourceLimits]) * 100).toFixed(1)
      }))
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in resource-monitor function:', error);
    return new Response(JSON.stringify({
      error: 'Failed to monitor resources',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});