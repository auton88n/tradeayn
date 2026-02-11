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

    let body: any = {};
    try { body = await req.json(); } catch {}
    const mode = body.mode || 'compliance_scan';

    if (mode === 'legal_review') {
      // Telegram command: /legal_review topic
      const topic = body.topic || 'general compliance';
      const analysis = await aiLegalAnalysis(LOVABLE_API_KEY, `Provide a legal analysis for a SaaS platform regarding: ${topic}. Consider GDPR, data protection, ToS requirements, and liability.`);

      await supabase.from('ayn_mind').insert({
        type: 'legal_analysis',
        content: `⚖️ Legal Review: ${topic}\n\n${analysis}`,
        context: { from_employee: 'lawyer', topic },
        shared_with_admin: true,
      });

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `⚖️ Legal Review: ${topic}\n\n${analysis}`);
      }

      return jsonRes({ success: true, topic, analysis });
    }

    if (mode === 'contract_check') {
      const contractText = body.text || '';
      if (!contractText) return jsonRes({ error: 'No contract text provided' }, 400);

      const analysis = await aiLegalAnalysis(LOVABLE_API_KEY, `Review this contract/agreement and identify:\n1. Potential risks\n2. Missing clauses\n3. Unfavorable terms\n4. Recommendations\n\nContract:\n${contractText.slice(0, 8000)}`);

      await supabase.from('ayn_mind').insert({
        type: 'legal_analysis',
        content: `📜 Contract Review\n\n${analysis}`,
        context: { from_employee: 'lawyer', type: 'contract_review' },
        shared_with_admin: true,
      });

      return jsonRes({ success: true, analysis });
    }

    // Default: Daily compliance scan
    const findings: string[] = [];

    // 1. Check if data handling has privacy issues
    const ago24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: securityLogs } = await supabase
      .from('security_logs')
      .select('action, severity, details')
      .gte('created_at', ago24h)
      .in('severity', ['high', 'critical'])
      .limit(20);

    if (securityLogs?.length) {
      findings.push(`${securityLogs.length} high/critical security event(s) in 24h`);
      const types = [...new Set(securityLogs.map((l: any) => l.action))];
      findings.push(`Types: ${types.join(', ')}`);
    }

    // 2. Check for unencrypted sensitive data patterns
    const { count: unencryptedAlerts } = await supabase
      .from('alert_history')
      .select('*', { count: 'exact', head: true })
      .is('recipient_email_encrypted', null);

    if (unencryptedAlerts && unencryptedAlerts > 0) {
      findings.push(`⚠️ ${unencryptedAlerts} alert(s) with unencrypted email addresses`);
    }

    // 3. Check data retention
    const ago90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { count: oldLogs } = await supabase
      .from('security_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', ago90d);

    if (oldLogs && oldLogs > 1000) {
      findings.push(`📋 ${oldLogs} security logs older than 90 days — consider retention policy`);
    }

    // 4. Check user data exposure
    const { count: publicProfiles } = await supabase
      .from('creator_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    findings.push(`${publicProfiles || 0} public creator profiles — ensure privacy toggle compliance`);

    // AI compliance summary
    const complianceSummary = await aiLegalAnalysis(LOVABLE_API_KEY, `Based on these findings from a SaaS platform's daily compliance scan, provide a brief risk assessment and priority actions:\n\n${findings.join('\n')}`);

    // Save report
    await supabase.from('ayn_mind').insert({
      type: 'legal_analysis',
      content: `⚖️ Daily Compliance Scan\n\nFindings:\n${findings.map(f => `• ${f}`).join('\n')}\n\nAssessment:\n${complianceSummary}`,
      context: { from_employee: 'lawyer', scan_type: 'daily_compliance', findings_count: findings.length },
      shared_with_admin: true,
    });

    if (findings.some(f => f.includes('⚠️')) && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
        `⚖️ Lawyer — Compliance Alert\n\n${findings.filter(f => f.includes('⚠️')).join('\n')}`
      );
    }

    await logAynActivity(supabase, 'compliance_scan', `Daily compliance: ${findings.length} finding(s)`, {
      details: { findings },
      triggered_by: 'lawyer',
    });

    return jsonRes({ success: true, findings, summary: complianceSummary });
  } catch (error) {
    console.error('ayn-lawyer error:', error);
    return jsonRes({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

async function aiLegalAnalysis(apiKey: string, prompt: string): Promise<string> {
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{
          role: 'system',
          content: `You are AYN's Legal AI. You provide concise legal analysis focused on tech/SaaS businesses. Cover GDPR, data protection, liability, and regulatory compliance. Be specific and actionable. Max 500 words.`,
        }, {
          role: 'user',
          content: prompt,
        }],
      }),
    });
    if (!res.ok) return 'Legal analysis unavailable';
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No analysis generated';
  } catch {
    return 'Legal analysis failed';
  }
}

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}
