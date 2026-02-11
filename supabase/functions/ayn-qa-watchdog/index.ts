import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { logAynActivity } from "../_shared/aynLogger.ts";
import { sendTelegramMessage } from "../_shared/telegramHelper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRITICAL_FUNCTIONS = ['health', 'ayn-unified', 'support-bot'];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    const healthResults: any[] = [];
    let criticalIssues = 0;

    // 1. Ping critical edge functions
    for (const fn of CRITICAL_FUNCTIONS) {
      const start = Date.now();
      let statusCode = 0;
      let isHealthy = true;
      let errorMessage: string | null = null;

      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/${fn}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ping: true }),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });
        statusCode = res.status;
        if (statusCode >= 500) {
          isHealthy = false;
          errorMessage = `HTTP ${statusCode}`;
          criticalIssues++;
        }
      } catch (e) {
        isHealthy = false;
        errorMessage = e instanceof Error ? e.message : 'Timeout or network error';
        criticalIssues++;
      }

      const responseTime = Date.now() - start;

      healthResults.push({
        function_name: fn,
        response_time_ms: responseTime,
        status_code: statusCode,
        is_healthy: isHealthy,
        error_message: errorMessage,
      });
    }

    // Save health checks
    if (healthResults.length > 0) {
      await supabase.from('system_health_checks').insert(healthResults);
    }

    // 2. Check error_logs for spikes (5+ errors in 10 min)
    const ago10m = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: recentErrors } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', ago10m);

    if (recentErrors && recentErrors >= 5) {
      criticalIssues++;
    }

    // 3. Check LLM failures
    const { count: recentLlmFails } = await supabase
      .from('llm_failures')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', ago10m);

    if (recentLlmFails && recentLlmFails >= 3) {
      criticalIssues++;
    }

    // Build report
    const report = healthResults.map(h =>
      `${h.is_healthy ? '✅' : '❌'} ${h.function_name}: ${h.response_time_ms}ms${h.error_message ? ` (${h.error_message})` : ''}`
    ).join('\n');

    const fullReport = `🔍 QA Watchdog Report\n${report}\n\nErrors (10min): ${recentErrors || 0}\nLLM failures (10min): ${recentLlmFails || 0}${criticalIssues > 0 ? `\n\n🚨 ${criticalIssues} critical issue(s)!` : ''}`;

    // Save employee report
    await supabase.from('ayn_mind').insert({
      type: 'employee_report',
      content: fullReport,
      context: {
        from_employee: 'qa_watchdog',
        critical_issues: criticalIssues,
        health_results: healthResults,
      },
      shared_with_admin: false,
    });

    // Alert on critical issues
    if (criticalIssues > 0 && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, fullReport);
    }

    // Cleanup old health checks
    await supabase.from('system_health_checks')
      .delete()
      .lt('checked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    await logAynActivity(supabase, 'qa_watchdog_check', `Health check: ${criticalIssues} critical issues`, {
      details: { critical_issues: criticalIssues, functions_checked: CRITICAL_FUNCTIONS.length },
      triggered_by: 'qa_watchdog',
    });

    return new Response(JSON.stringify({ success: true, critical_issues: criticalIssues, health: healthResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ayn-qa-watchdog error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
