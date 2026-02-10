import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { logAynActivity } from "../_shared/aynLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const ago1h = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
    const ago4h = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
    const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const insights: string[] = [];
    const actions: Array<{ type: string; detail: string }> = [];
    let isUrgent = false; // Bypasses cooldown

    // --- 1. Unanswered tickets older than 4 hours ---
    const { data: staleTickets, count: staleCount } = await supabase
      .from('support_tickets')
      .select('id, subject, priority, created_at', { count: 'exact' })
      .eq('status', 'open')
      .lt('created_at', ago4h)
      .order('created_at', { ascending: true })
      .limit(5);

    if (staleCount && staleCount > 0) {
      insights.push(`${staleCount} unanswered ticket(s) older than 4 hours`);
      for (const ticket of staleTickets || []) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/ayn-auto-reply`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket_id: ticket.id, subject: ticket.subject, message: ticket.subject, priority: ticket.priority, skip_telegram: true }),
          });
          await supabase.from('support_tickets').update({ status: 'pending' }).eq('id', ticket.id);
          actions.push({ type: 'auto_reply', detail: `Replied to stale ticket #${ticket.id.substring(0, 8)} and set to pending` });
          await logAynActivity(supabase, 'proactive_auto_reply', `Auto-replied to stale ticket #${ticket.id.substring(0, 8)}`, {
            target_id: ticket.id, target_type: 'ticket',
            details: { subject: ticket.subject, priority: ticket.priority },
            triggered_by: 'proactive_loop',
          });
        } catch (e) {
          console.error('Auto-reply failed for ticket:', ticket.id, e);
        }
      }
    }

    // --- 2. System health ---
    const [{ count: errorCount }, { count: llmFailureCount }, { data: blockedUsers }] = await Promise.all([
      supabase.from('error_logs').select('*', { count: 'exact', head: true }).gte('created_at', ago24h),
      supabase.from('llm_failures').select('*', { count: 'exact', head: true }).gte('created_at', ago24h),
      supabase.from('api_rate_limits').select('user_id').gt('blocked_until', now.toISOString()),
    ]);

    const blockedCount = blockedUsers?.length || 0;
    let healthScore = 100;
    if (errorCount && errorCount > 10) healthScore -= Math.min(30, errorCount);
    if (llmFailureCount && llmFailureCount > 5) healthScore -= Math.min(20, llmFailureCount * 2);
    if (blockedCount > 0) healthScore -= blockedCount * 3;
    healthScore = Math.max(0, healthScore);

    // --- 3. URGENT: Error spike (>10 errors in last hour) ---
    const { count: errorsLastHour } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', ago1h);

    if (errorsLastHour && errorsLastHour > 10) {
      insights.push(`🚨 Error spike: ${errorsLastHour} errors in the last hour!`);
      isUrgent = true;
    }

    // --- 4. URGENT: New high-priority tickets ---
    const { data: urgentTickets } = await supabase
      .from('support_tickets')
      .select('id, subject, created_at')
      .eq('status', 'open')
      .eq('priority', 'urgent')
      .gte('created_at', ago4h)
      .limit(3);

    if (urgentTickets?.length) {
      insights.push(`🔴 ${urgentTickets.length} urgent ticket(s): ${urgentTickets.map(t => t.subject?.slice(0, 40)).join(', ')}`);
      isUrgent = true;
    }

    // --- 5. New service applications since last run ---
    const { data: newApps } = await supabase
      .from('service_applications')
      .select('id, full_name, service_type, created_at')
      .eq('status', 'pending')
      .gte('created_at', ago4h)
      .order('created_at', { ascending: false })
      .limit(5);

    if (newApps?.length) {
      insights.push(`📋 ${newApps.length} new application(s): ${newApps.map(a => `${a.full_name} (${a.service_type})`).join(', ')}`);
    }

    // --- 6. URGENT: Newly rate-limited users ---
    if (blockedCount > 0) {
      insights.push(`🚫 ${blockedCount} user(s) currently rate-limited`);
      // Check if any were blocked very recently (last hour)
      const { data: recentlyBlocked } = await supabase
        .from('api_rate_limits')
        .select('user_id, blocked_until, updated_at')
        .gt('blocked_until', now.toISOString())
        .gte('updated_at', ago1h);
      if (recentlyBlocked?.length) {
        insights.push(`⚠️ ${recentlyBlocked.length} user(s) blocked in the last hour`);
        isUrgent = true;
      }
    }

    // --- 7. Marketing performance ---
    const { data: recentTweets } = await supabase
      .from('twitter_posts')
      .select('id, content, status, created_at, impressions, likes')
      .gte('created_at', ago7d)
      .order('created_at', { ascending: false })
      .limit(10);

    let tweetSummary = 'No tweets this week';
    if (recentTweets?.length) {
      const posted = recentTweets.filter(t => t.status === 'posted');
      const drafts = recentTweets.filter(t => t.status === 'draft');
      const totalImpressions = posted.reduce((sum, t) => sum + (t.impressions || 0), 0);
      tweetSummary = `${posted.length} posted, ${drafts.length} drafts, ${totalImpressions} impressions this week`;
    }

    // --- 8. Ticket counts ---
    const [{ count: openTickets }, { count: pendingTickets }] = await Promise.all([
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    // --- 9. User activity ---
    const [{ count: totalUsers }, { count: activeUsers }] = await Promise.all([
      supabase.from('access_grants').select('*', { count: 'exact', head: true }),
      supabase.from('access_grants').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    // ============================================================
    // AYN'S BRAIN: Trend detection + autonomous thinking
    // ============================================================

    const { data: previousRun } = await supabase
      .from('ayn_mind')
      .select('context, created_at')
      .eq('type', 'observation')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentMetrics = {
      health_score: healthScore,
      errors_24h: errorCount || 0,
      errors_1h: errorsLastHour || 0,
      llm_failures_24h: llmFailureCount || 0,
      blocked_users: blockedCount,
      open_tickets: openTickets || 0,
      pending_tickets: pendingTickets || 0,
      active_users: activeUsers || 0,
      total_users: totalUsers || 0,
      tweet_summary: tweetSummary,
      new_applications: newApps?.length || 0,
    };

    // Detect trends
    const trends: string[] = [];
    if (previousRun?.context) {
      const prev = previousRun.context as Record<string, number>;
      if (prev.health_score && healthScore < prev.health_score - 10) {
        trends.push(`Health dropped ${prev.health_score}% → ${healthScore}%`);
      }
      if (prev.errors_24h !== undefined && (errorCount || 0) > prev.errors_24h * 2 && (errorCount || 0) > 5) {
        trends.push(`Errors doubled: ${prev.errors_24h} → ${errorCount}`);
      }
      if (prev.open_tickets !== undefined && (openTickets || 0) > prev.open_tickets + 3) {
        trends.push(`Tickets spiking: ${prev.open_tickets} → ${openTickets}`);
      }
      if (prev.active_users !== undefined && (activeUsers || 0) < prev.active_users * 0.7 && prev.active_users > 5) {
        trends.push(`Active users dropped: ${prev.active_users} → ${activeUsers}`);
      }
    }

    // --- Save to ayn_mind ---
    const mindEntries = [];
    mindEntries.push({
      type: 'observation',
      content: `System check: health ${healthScore}%, ${errorCount || 0} errors, ${openTickets || 0} open tickets, ${activeUsers || 0} active users`,
      context: currentMetrics,
      shared_with_admin: false,
    });

    const mood = healthScore >= 90 ? 'happy' : healthScore >= 70 ? 'concerned' : 'worried';
    mindEntries.push({ type: 'mood', content: mood, context: { health_score: healthScore }, shared_with_admin: false });

    for (const trend of trends) {
      mindEntries.push({ type: 'trend', content: trend, context: currentMetrics, shared_with_admin: false });
    }

    if (mindEntries.length > 0) {
      await supabase.from('ayn_mind').insert(mindEntries);
    }

    // ============================================================
    // COOLDOWN — skip messaging if we messaged recently
    // Unless isUrgent bypasses cooldown
    // ============================================================
    const { data: lastShared } = await supabase
      .from('ayn_mind')
      .select('created_at')
      .eq('shared_with_admin', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const COOLDOWN_MS = 5 * 60 * 60 * 1000; // 5 hours
    const lastSharedTime = lastShared?.created_at ? new Date(lastShared.created_at).getTime() : 0;
    const cooledDown = (now.getTime() - lastSharedTime) > COOLDOWN_MS;

    // Health < 60 is also urgent
    if (healthScore < 60) isUrgent = true;

    const worthSharing = trends.length > 0 || healthScore < 80 || (staleCount && staleCount > 5) || (newApps?.length && newApps.length > 0);
    const shouldMessage = (worthSharing && cooledDown) || isUrgent;

    if (shouldMessage) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      let telegramMessage = '';

      if (LOVABLE_API_KEY) {
        try {
          const urgentPrefix = isUrgent ? 'URGENT — this needs attention now. ' : '';
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-3-flash-preview',
              messages: [
                {
                  role: 'system',
                  content: `You are AYN, texting your boss/partner on Telegram. Write a SHORT casual message about the system status. Talk like a smart team member, not a dashboard.

Rules:
- 1-3 sentences max
- Use emojis sparingly
- Only mention things that are interesting, unusual, or need attention
- If everything is normal and boring, respond with exactly: [SKIP]
- Don't list all stats — pick the most important thing
- Sound human, not robotic
- If you took actions (like replying to tickets), mention briefly
- ${isUrgent ? 'This is URGENT — be direct and alarming. Do NOT skip.' : 'If nothing notable, say [SKIP]'}`,
                },
                {
                  role: 'user',
                  content: `${urgentPrefix}Current state:
Health: ${healthScore}%
Errors (24h): ${errorCount || 0}, Errors (1h): ${errorsLastHour || 0}
LLM failures: ${llmFailureCount || 0}
Open tickets: ${openTickets || 0}, Pending: ${pendingTickets || 0}
Active users: ${activeUsers || 0}/${totalUsers || 0}
Blocked users: ${blockedCount}
Tweets: ${tweetSummary}
New applications: ${newApps?.length ? newApps.map(a => `${a.full_name} (${a.service_type})`).join(', ') : 'none'}
Insights: ${insights.length > 0 ? insights.join('; ') : 'none'}
Trends: ${trends.length > 0 ? trends.join('; ') : 'none'}
Actions taken: ${actions.length > 0 ? actions.map(a => a.detail).join('; ') : 'none'}`,
                },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            telegramMessage = aiData.choices?.[0]?.message?.content?.trim() || '';
          }
        } catch (aiErr) {
          console.error('AI message generation failed:', aiErr);
        }
      }

      // If AI said skip or failed, don't send (unless urgent)
      const shouldSend = isUrgent
        ? Boolean(telegramMessage && !telegramMessage.includes('[SKIP]')) || true
        : Boolean(telegramMessage && !telegramMessage.includes('[SKIP]'));

      // Fallback message for urgent when AI fails
      if (isUrgent && (!telegramMessage || telegramMessage.includes('[SKIP]'))) {
        telegramMessage = `🚨 Urgent alert: ${insights.slice(0, 3).join(' | ') || `Health at ${healthScore}%`}`;
      }

      if (shouldSend && telegramMessage) {
        try {
          const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
          const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

          if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: telegramMessage }),
            });
          }

          // Mark entries as shared
          const { data: recentIds } = await supabase
            .from('ayn_mind')
            .select('id')
            .eq('shared_with_admin', false)
            .order('created_at', { ascending: false })
            .limit(mindEntries.length);

          if (recentIds?.length) {
            await supabase.from('ayn_mind').update({ shared_with_admin: true }).in('id', recentIds.map(r => r.id));
          }
        } catch (telegramErr) {
          console.error('Telegram send failed:', telegramErr);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      health_score: healthScore,
      mood,
      trends,
      insights,
      actions,
      is_urgent: isUrgent,
      messaged_admin: shouldMessage,
      cooldown_active: !cooledDown,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ayn-proactive-loop error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
