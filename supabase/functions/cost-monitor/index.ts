import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CostTrackingRequest {
  user_id: string;
  cost_amount: number;
  mode_used: string;
  session_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, cost_amount, mode_used, session_id }: CostTrackingRequest = await req.json();

    console.log(`[cost-monitor] Tracking cost: ${cost_amount} for user: ${user_id}, mode: ${mode_used}`);

    // Track cost using database function
    const { data: needsAlert, error: trackError } = await supabase
      .rpc('track_user_cost', {
        p_user_id: user_id,
        p_cost_amount: cost_amount,
        p_mode_used: mode_used
      });

    if (trackError) {
      console.error('Error tracking cost:', trackError);
      throw trackError;
    }

    // Also insert detailed cost record into ai_cost_tracking table
    const { error: insertError } = await supabase
      .from('ai_cost_tracking')
      .insert({
        user_id: user_id,
        cost_amount: cost_amount,
        mode_used: mode_used,
        request_timestamp: new Date().toISOString(),
        session_id: session_id,
        metadata: {
          tracked_at: new Date().toISOString(),
          alert_triggered: needsAlert
        }
      });

    if (insertError) {
      console.error('Error inserting cost tracking record:', insertError);
      // Don't throw here as cost thresholds were already updated successfully
    }

    // If alert is needed, get user details and send notification
    if (needsAlert) {
      console.log(`[cost-monitor] Alert needed for user: ${user_id}`);
      
      // Get current cost thresholds and user email
      const { data: costData, error: costError } = await supabase
        .from('cost_thresholds')
        .select('*')
        .eq('user_id', user_id)
        .single();

      const { data: user, error: userError } = await supabase.auth.admin.getUserById(user_id);

      if (!costError && costData && !userError && user) {
        // Determine which threshold was exceeded
        let alertType = '';
        let thresholdAmount = 0;
        let currentAmount = 0;

        if (costData.current_daily_spend >= costData.daily_threshold) {
          alertType = 'Daily';
          thresholdAmount = costData.daily_threshold;
          currentAmount = costData.current_daily_spend;
        } else if (costData.current_weekly_spend >= costData.weekly_threshold) {
          alertType = 'Weekly';
          thresholdAmount = costData.weekly_threshold;
          currentAmount = costData.current_weekly_spend;
        } else if (costData.current_monthly_spend >= costData.monthly_threshold) {
          alertType = 'Monthly';
          thresholdAmount = costData.monthly_threshold;
          currentAmount = costData.current_monthly_spend;
        }

        // Send notification
        await supabase.functions.invoke('send-notifications', {
          body: {
            type: 'cost_threshold',
            user_id: user_id,
            subject: `Cost Threshold Alert - ${alertType} Limit Exceeded`,
            content: `
              <h2>Cost Threshold Exceeded</h2>
              <p>Your ${alertType.toLowerCase()} spending has exceeded the threshold.</p>
              <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong>${alertType} Threshold:</strong> $${thresholdAmount}<br>
                <strong>Current ${alertType} Spend:</strong> $${currentAmount.toFixed(2)}<br>
                <strong>Mode Used:</strong> ${mode_used}
              </div>
              <p>Please monitor your usage to avoid unexpected charges.</p>
            `,
            metadata: {
              threshold_type: alertType.toLowerCase(),
              threshold_amount: thresholdAmount,
              current_amount: currentAmount,
              mode_used: mode_used,
              session_id: session_id
            }
          }
        });

        // Send admin notification if cost is very high
        if (currentAmount > thresholdAmount * 1.5) {
          await supabase.functions.invoke('send-notifications', {
            body: {
              type: 'cost_threshold',
              subject: `High Cost Alert - User ${user.email}`,
              content: `
                <h2>High Cost Alert</h2>
                <p>User ${user.email} has significantly exceeded their ${alertType.toLowerCase()} threshold.</p>
                <div style="background: #fef3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <strong>User:</strong> ${user.email}<br>
                  <strong>${alertType} Threshold:</strong> $${thresholdAmount}<br>
                  <strong>Current Spend:</strong> $${currentAmount.toFixed(2)}<br>
                  <strong>Overage:</strong> $${(currentAmount - thresholdAmount).toFixed(2)}<br>
                  <strong>Mode:</strong> ${mode_used}
                </div>
                <p>Consider reviewing the user's access or adjusting their limits.</p>
              `,
              metadata: {
                user_id: user_id,
                user_email: user.email,
                threshold_type: alertType.toLowerCase(),
                overage_amount: currentAmount - thresholdAmount
              }
            }
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      cost_tracked: cost_amount,
      alert_triggered: needsAlert,
      message: needsAlert ? 'Cost tracked and alert sent' : 'Cost tracked successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in cost-monitor function:', error);
    return new Response(JSON.stringify({
      error: 'Failed to track cost',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});