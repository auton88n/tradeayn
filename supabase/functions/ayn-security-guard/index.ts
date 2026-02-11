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
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    let body: any = {};
    try { body = await req.json(); } catch { /* empty body for cron */ }
    const mode = body.mode || 'check_threats';

    const results: string[] = [];

    if (mode === 'reply_detected' && body.record) {
      // Event-driven: security_logs INSERT with prompt_injection_attempt
      const record = body.record;
      const userId = record.user_id;
      if (userId) {
        await handleStrike(supabase, userId, record.action, record.details, results, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
      }
    } else {
      // Cron mode: scan for threats
      const ago6h = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const ago1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // 1. Check prompt injection attempts in last 6h
      const { data: injections } = await supabase
        .from('security_logs')
        .select('user_id, created_at')
        .eq('action', 'prompt_injection_attempt')
        .gte('created_at', ago6h)
        .not('user_id', 'is', null);

      // Group by user_id
      const userAttempts: Record<string, number> = {};
      for (const inj of injections || []) {
        if (inj.user_id) userAttempts[inj.user_id] = (userAttempts[inj.user_id] || 0) + 1;
      }

      for (const [userId, count] of Object.entries(userAttempts)) {
        if (count >= 2) {
          await handleStrike(supabase, userId, 'prompt_injection', { attempts: count, window: '6h' }, results, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        }
      }

      // 2. Check for rapid-fire message abuse (50+ messages/hour)
      const { data: spammers } = await supabase.rpc('check_api_rate_limit', { p_user_id: '00000000-0000-0000-0000-000000000000', p_endpoint: 'dummy' }).maybeSingle();
      // Instead, directly query messages
      const { data: recentMsgs } = await supabase
        .from('messages')
        .select('user_id')
        .gte('created_at', ago1h);

      const msgCounts: Record<string, number> = {};
      for (const m of recentMsgs || []) {
        if (m.user_id) msgCounts[m.user_id] = (msgCounts[m.user_id] || 0) + 1;
      }

      for (const [userId, count] of Object.entries(msgCounts)) {
        if (count >= 50) {
          await handleStrike(supabase, userId, 'message_abuse', { messages_per_hour: count }, results, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        }
      }

      // 3. Check repeated rate limit violations
      const { data: violators } = await supabase
        .from('api_rate_limits')
        .select('user_id, violation_count, endpoint')
        .gte('violation_count', 3);

      for (const v of violators || []) {
        if (v.violation_count >= 5) {
          await handleStrike(supabase, v.user_id, 'repeated_rate_limit', { violations: v.violation_count, endpoint: v.endpoint }, results, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        }
      }

      if (results.length === 0) {
        results.push('All clear — no threats detected');
      }
    }

    // Create employee report
    if (results.some(r => !r.includes('All clear'))) {
      await supabase.from('ayn_mind').insert({
        type: 'employee_report',
        content: `🛡️ Security Guard Report:\n${results.join('\n')}`,
        context: { from_employee: 'security_guard', timestamp: new Date().toISOString() },
        shared_with_admin: false,
      });
    }

    await logAynActivity(supabase, 'security_scan', `Security scan: ${results.length} finding(s)`, {
      details: { findings: results },
      triggered_by: 'security_guard',
    });

    return new Response(JSON.stringify({ success: true, findings: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ayn-security-guard error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleStrike(
  supabase: any, userId: string, incidentType: string, details: any,
  results: string[], botToken?: string, chatId?: string
) {
  // Check if user is admin/duty — never touch admins
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (roles?.some((r: any) => r.role === 'admin' || r.role === 'duty')) {
    results.push(`Skipped ${userId.slice(0, 8)} (admin/duty) for ${incidentType}`);
    return;
  }

  // Count existing strikes
  const { data: existing } = await supabase
    .from('security_incidents')
    .select('id, strike_count')
    .eq('user_id', userId)
    .eq('incident_type', incidentType)
    .eq('status', 'detected')
    .order('created_at', { ascending: false })
    .limit(1);

  const currentStrikes = (existing?.[0]?.strike_count || 0) + 1;

  let status = 'detected';
  let actionTaken = 'warned';
  let blockedUntil: string | null = null;

  if (currentStrikes >= 5) {
    // 24h block
    blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    status = 'blocked';
    actionTaken = 'blocked_24h';
    await supabase.from('api_rate_limits')
      .upsert({ user_id: userId, endpoint: 'all', blocked_until: blockedUntil, violation_count: currentStrikes }, { onConflict: 'user_id,endpoint' });
  } else if (currentStrikes >= 3) {
    // 30min block
    blockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    status = 'blocked';
    actionTaken = 'blocked_30min';
    await supabase.from('api_rate_limits')
      .upsert({ user_id: userId, endpoint: 'all', blocked_until: blockedUntil, violation_count: currentStrikes }, { onConflict: 'user_id,endpoint' });
  } else {
    status = 'warned';
    actionTaken = `warning_${currentStrikes}`;
  }

  // Upsert incident
  if (existing?.[0]?.id) {
    await supabase.from('security_incidents').update({
      strike_count: currentStrikes, status, action_taken: actionTaken,
      blocked_until: blockedUntil, details,
    }).eq('id', existing[0].id);
  } else {
    await supabase.from('security_incidents').insert({
      user_id: userId, incident_type: incidentType, severity: currentStrikes >= 3 ? 'high' : 'medium',
      strike_count: currentStrikes, status, action_taken: actionTaken,
      blocked_until: blockedUntil, details,
    });
  }

  const summary = `${incidentType}: user ${userId.slice(0, 8)} — strike ${currentStrikes} → ${actionTaken}`;
  results.push(summary);

  // Telegram alert for blocks only
  if (status === 'blocked' && botToken && chatId) {
    await sendTelegramMessage(botToken, chatId, `🛡️ Security Guard\n${summary}`);
  }
}
