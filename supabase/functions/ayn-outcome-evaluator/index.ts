import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { logAynActivity } from "../_shared/aynLogger.ts";
import { loadEmployeeState, updateEmployeeState } from "../_shared/employeeState.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Find unevaluated reflections
    const { data: reflections } = await supabase
      .from('employee_reflections')
      .select('*')
      .eq('outcome_evaluated', false)
      .order('created_at', { ascending: true })
      .limit(20);

    if (!reflections?.length) {
      return new Response(JSON.stringify({ success: true, message: 'No reflections to evaluate', evaluated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let evaluated = 0;
    let beliefsAdjusted = 0;

    for (const ref of reflections) {
      // Try to determine actual outcome based on action type
      let actualOutcome = 'unknown';
      let outcomePositive = false;

      if (ref.action_ref?.includes('sales') || ref.action_ref?.includes('outreach')) {
        // Check if leads from around that time converted
        const { count } = await supabase
          .from('ayn_sales_pipeline')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'replied')
          .gte('updated_at', ref.created_at);
        outcomePositive = (count || 0) > 0;
        actualOutcome = outcomePositive ? 'positive — leads engaged' : 'no engagement detected yet';
      } else if (ref.action_ref?.includes('security') || ref.action_ref?.includes('threat')) {
        // Check if the flagged threat materialized
        const { count } = await supabase
          .from('security_incidents')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', ref.created_at)
          .limit(1);
        outcomePositive = (count || 0) === 0; // No incident = correct threat assessment
        actualOutcome = outcomePositive ? 'threat did not materialize — good call' : 'incident occurred after assessment';
      } else if (ref.action_ref?.includes('health') || ref.action_ref?.includes('qa')) {
        // Check system health after the assessment
        const { data: healthChecks } = await supabase
          .from('system_health_checks')
          .select('is_healthy')
          .gte('checked_at', ref.created_at)
          .limit(5);
        const healthyPct = healthChecks?.length ? healthChecks.filter((h: any) => h.is_healthy).length / healthChecks.length : 1;
        outcomePositive = healthyPct > 0.8;
        actualOutcome = outcomePositive ? 'systems remained healthy' : `health degraded (${Math.round(healthyPct * 100)}% uptime)`;
      } else {
        // Generic: check if any errors occurred after
        const { count: errors } = await supabase
          .from('error_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', ref.created_at);
        outcomePositive = (errors || 0) < 3;
        actualOutcome = outcomePositive ? 'no significant issues followed' : `${errors} errors occurred after this action`;
      }

      // Update the reflection with actual outcome
      await supabase.from('employee_reflections').update({
        actual_outcome: actualOutcome,
        outcome_evaluated: true,
      }).eq('id', ref.id);

      // Adjust employee beliefs based on outcome
      const state = await loadEmployeeState(supabase, ref.employee_id);
      if (state) {
        const wasConfident = ref.confidence > 0.7;
        const wasRight = outcomePositive;

        if (wasConfident && !wasRight) {
          // Overconfident and wrong → reduce confidence and risk tolerance
          await updateEmployeeState(supabase, ref.employee_id, {
            confidence: state.confidence - 0.05,
            beliefs: {
              ...state.beliefs,
              risk_tolerance: (state.beliefs.risk_tolerance || 0.5) - 0.03,
            },
          });
          beliefsAdjusted++;
        } else if (!wasConfident && wasRight) {
          // Underconfident and right → boost confidence slightly
          await updateEmployeeState(supabase, ref.employee_id, {
            confidence: state.confidence + 0.03,
          });
          beliefsAdjusted++;
        } else if (wasConfident && wasRight) {
          // Confident and right → small confidence boost
          await updateEmployeeState(supabase, ref.employee_id, {
            confidence: state.confidence + 0.01,
          });
        }
        // If not confident and wrong, no change — expected
      }

      evaluated++;
    }

    await logAynActivity(supabase, 'outcome_evaluation', `Evaluated ${evaluated} reflections, adjusted beliefs for ${beliefsAdjusted} employees`, {
      details: { evaluated, beliefs_adjusted: beliefsAdjusted },
      triggered_by: 'outcome_evaluator',
    });

    return new Response(JSON.stringify({ success: true, evaluated, beliefs_adjusted: beliefsAdjusted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ayn-outcome-evaluator error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
