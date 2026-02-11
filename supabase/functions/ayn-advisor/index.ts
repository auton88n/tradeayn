import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { logAynActivity } from "../_shared/aynLogger.ts";
import { sendTelegramMessage } from "../_shared/telegramHelper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Check for unread employee reports
    const { data: reports } = await supabase
      .from('ayn_mind')
      .select('content, context, created_at')
      .eq('type', 'employee_report')
      .eq('shared_with_admin', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!reports?.length || reports.length < 3) {
      return new Response(JSON.stringify({ success: true, message: 'Not enough reports to synthesize yet' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gather additional context
    const ago24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [
      { count: activeUsers },
      { count: openTickets },
      { data: recentIncidents },
      { data: pipelineStats },
      { data: healthChecks },
    ] = await Promise.all([
      supabase.from('access_grants').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('security_incidents').select('incident_type, severity, status').gte('created_at', ago24h).limit(10),
      supabase.from('ayn_sales_pipeline').select('status').limit(100),
      supabase.from('system_health_checks').select('function_name, is_healthy, response_time_ms').order('checked_at', { ascending: false }).limit(10),
    ]);

    // Pipeline summary
    const pipelineSummary: Record<string, number> = {};
    for (const p of pipelineStats || []) {
      pipelineSummary[p.status] = (pipelineSummary[p.status] || 0) + 1;
    }

    // Synthesize with AI
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{
          role: 'system',
          content: `You are AYN's Strategic Advisor. You synthesize reports from all AI employees into actionable strategic insights for the founder.

Write a brief executive briefing (max 5 bullet points) covering:
1. Biggest opportunity right now
2. Biggest risk/threat
3. What's working well
4. What needs attention
5. One bold recommendation

Be direct and specific. No fluff. Reference actual data.`,
        }, {
          role: 'user',
          content: `Employee Reports:\n${reports.map(r => `• [${r.context?.from_employee || 'unknown'}] ${r.content}`).join('\n\n')}

Context:
- Active users: ${activeUsers || 0}
- Open tickets: ${openTickets || 0}
- Security incidents (24h): ${recentIncidents?.length || 0}
- Pipeline: ${JSON.stringify(pipelineSummary)}
- System health: ${healthChecks?.map(h => `${h.function_name}: ${h.is_healthy ? 'OK' : 'DOWN'}`).join(', ') || 'No data'}`,
        }],
      }),
    });

    if (!aiRes.ok) throw new Error('AI synthesis failed');

    const aiData = await aiRes.json();
    const insight = aiData.choices?.[0]?.message?.content?.trim() || 'Could not generate insights';

    // Save strategic insight
    await supabase.from('ayn_mind').insert({
      type: 'strategic_insight',
      content: insight,
      context: {
        from_employee: 'advisor',
        reports_analyzed: reports.length,
        timestamp: new Date().toISOString(),
      },
      shared_with_admin: true,
    });

    // Mark reports as shared
    const reportIds = reports.map(r => {
      // We don't have IDs from the select, so mark by type
      return true;
    });
    await supabase.from('ayn_mind')
      .update({ shared_with_admin: true })
      .eq('type', 'employee_report')
      .eq('shared_with_admin', false);

    // Send directly to founder via Telegram
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `📊 Advisor Briefing\n\n${insight}`);
    }

    await logAynActivity(supabase, 'advisor_briefing', `Strategic briefing: ${reports.length} reports synthesized`, {
      details: { reports_count: reports.length },
      triggered_by: 'advisor',
    });

    return new Response(JSON.stringify({ success: true, insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ayn-advisor error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
