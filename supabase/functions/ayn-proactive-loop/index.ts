import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

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
    const ago4h = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
    const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const insights: string[] = [];
    const actions: Array<{ type: string; detail: string }> = [];

    // --- 1. Unanswered tickets older than 4 hours ---
    const { data: staleTickets, count: staleCount } = await supabase
      .from('support_tickets')
      .select('id, subject, priority, created_at', { count: 'exact' })
      .eq('status', 'open')
      .lt('created_at', ago4h)
      .order('created_at', { ascending: true })
      .limit(5);

    if (staleCount && staleCount > 0) {
      insights.push(`🎫 ${staleCount} unanswered ticket(s) older than 4 hours`);
      for (const ticket of staleTickets || []) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/ayn-auto-reply`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket_id: ticket.id, subject: ticket.subject, message: ticket.subject, priority: ticket.priority }),
          });
          actions.push({ type: 'auto_reply', detail: `Replied to stale ticket #${ticket.id.substring(0, 8)}` });
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

    insights.push(`📊 System Health: ${healthScore}%`);
    if (errorCount && errorCount > 0) insights.push(`⚠️ ${errorCount} app errors in 24h`);
    if (llmFailureCount && llmFailureCount > 0) insights.push(`🤖 ${llmFailureCount} LLM failures in 24h`);
    if (blockedCount > 0) insights.push(`🚫 ${blockedCount} users currently rate-limited`);

    // --- 3. Marketing performance ---
    const { data: recentTweets } = await supabase
      .from('twitter_posts')
      .select('id, content, status, created_at, impressions, likes')
      .gte('created_at', ago7d)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentTweets?.length) {
      const posted = recentTweets.filter(t => t.status === 'posted');
      const drafts = recentTweets.filter(t => t.status === 'draft');
      const totalImpressions = posted.reduce((sum, t) => sum + (t.impressions || 0), 0);
      const totalLikes = posted.reduce((sum, t) => sum + (t.likes || 0), 0);
      insights.push(`📱 ${posted.length} tweets posted, ${drafts.length} drafts this week`);
      if (totalImpressions > 0) {
        insights.push(`👀 ${totalImpressions.toLocaleString()} impressions, ${totalLikes} likes`);
      }
    } else {
      insights.push(`📱 No tweets this week — should I draft some?`);
      actions.push({ type: 'suggest', detail: 'No marketing activity this week' });
    }

    // --- 4. Ticket counts ---
    const [{ count: openTickets }, { count: pendingTickets }] = await Promise.all([
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    insights.push(`🎫 ${openTickets || 0} open, ${pendingTickets || 0} pending tickets`);

    // --- 5. User activity ---
    const [{ count: totalUsers }, { count: activeUsers }] = await Promise.all([
      supabase.from('access_grants').select('*', { count: 'exact', head: true }),
      supabase.from('access_grants').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    insights.push(`👥 ${activeUsers || 0}/${totalUsers || 0} active users`);

    // ============================================================
    // AYN'S BRAIN: Trend detection + autonomous thinking
    // ============================================================

    // Get previous run's metrics from ayn_mind
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
      llm_failures_24h: llmFailureCount || 0,
      blocked_users: blockedCount,
      open_tickets: openTickets || 0,
      pending_tickets: pendingTickets || 0,
      active_users: activeUsers || 0,
      total_users: totalUsers || 0,
    };

    // Detect trends by comparing with last run
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

    // Get recent unshared thoughts to avoid repeating
    const { data: recentShared } = await supabase
      .from('ayn_mind')
      .select('content')
      .eq('shared_with_admin', true)
      .gte('created_at', ago24h)
      .limit(10);

    const alreadySaid = new Set((recentShared || []).map(t => t.content));

    // --- 6. Generate AI thoughts ---
    let aiThoughts: string[] = [];
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const shouldThink = healthScore < 90 || (staleCount && staleCount > 0) || trends.length > 0 || actions.length > 0;

    if (LOVABLE_API_KEY && shouldThink) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'system',
                content: `You are AYN, an autonomous AI co-pilot. You're doing your regular system check and generating original thoughts.

Rules:
- Generate 1-2 SHORT, specific observations or ideas (one sentence each)
- Focus on actionable insights, not summaries
- Be specific with numbers
- Think like a proactive team member
- If trends show decline, suggest a concrete action
- Format: Return each thought on a new line, prefixed with the type: [thought], [idea], or [trend]

Things I already told the admin recently (DON'T repeat these):
${Array.from(alreadySaid).join('\n')}`,
              },
              {
                role: 'user',
                content: `Current metrics:\n${JSON.stringify(currentMetrics, null, 2)}\n\nTrends detected:\n${trends.length > 0 ? trends.join('\n') : 'None'}\n\nInsights:\n${insights.join('\n')}\n\nActions taken:\n${JSON.stringify(actions)}`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          aiThoughts = content.split('\n').filter((l: string) => l.trim().length > 0).slice(0, 3);
        }
      } catch (aiErr) {
        console.error('AI thinking failed:', aiErr);
      }
    }

    // --- 7. Save to ayn_mind ---
    const mindEntries = [];

    // Save current metrics as observation
    mindEntries.push({
      type: 'observation',
      content: `System check: health ${healthScore}%, ${errorCount || 0} errors, ${openTickets || 0} open tickets, ${activeUsers || 0} active users`,
      context: currentMetrics,
      shared_with_admin: false,
    });

    // Save mood
    const mood = healthScore >= 90 ? 'happy' : healthScore >= 70 ? 'concerned' : 'worried';
    mindEntries.push({
      type: 'mood' as const,
      content: mood,
      context: { health_score: healthScore },
      shared_with_admin: false,
    });

    // Save trends
    for (const trend of trends) {
      mindEntries.push({
        type: 'trend' as const,
        content: trend,
        context: currentMetrics,
        shared_with_admin: false,
      });
    }

    // Save AI thoughts
    for (const thought of aiThoughts) {
      const cleanThought = thought.replace(/^\[(thought|idea|trend)\]\s*/i, '');
      if (cleanThought.length > 10 && !alreadySaid.has(cleanThought)) {
        const thoughtType = thought.toLowerCase().includes('[idea]') ? 'idea' : thought.toLowerCase().includes('[trend]') ? 'trend' : 'thought';
        mindEntries.push({
          type: thoughtType,
          content: cleanThought,
          context: currentMetrics,
          shared_with_admin: false,
        });
      }
    }

    if (mindEntries.length > 0) {
      await supabase.from('ayn_mind').insert(mindEntries);
    }

    // --- 8. Decide what to message the admin ---
    const worthSharing = trends.length > 0 || healthScore < 80 || (staleCount && staleCount > 2) || actions.length > 0;

    if (worthSharing) {
      const digestParts = [...insights];

      if (trends.length > 0) {
        digestParts.push('', '📈 Trends:', ...trends.map(t => `• ${t}`));
      }

      if (actions.length > 0) {
        digestParts.push('', '✅ Actions I took:', ...actions.map(a => `• ${a.detail}`));
      }

      if (aiThoughts.length > 0) {
        const cleanThoughts = aiThoughts.map(t => t.replace(/^\[(thought|idea|trend)\]\s*/i, '')).filter(t => t.length > 10);
        if (cleanThoughts.length > 0) {
          digestParts.push('', '💬 My thoughts:', ...cleanThoughts.map(t => `• ${t}`));
        }
      }

      const digestMessage = digestParts.join('\n');

      // Send to Telegram
      try {
        await fetch(`${supabaseUrl}/functions/v1/ayn-telegram-notify`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'insight',
            title: `AYN ${mood === 'happy' ? '😊' : mood === 'concerned' ? '🤔' : '😟'} Check-in`,
            message: digestMessage,
            priority: healthScore < 80 ? 'high' : 'low',
            details: {
              health_score: `${healthScore}%`,
              open_tickets: openTickets || 0,
              errors_24h: errorCount || 0,
              trends_detected: trends.length,
              actions_taken: actions.length,
            },
          }),
        });

        // Mark thoughts as shared
        if (mindEntries.length > 0) {
          const recentIds = await supabase
            .from('ayn_mind')
            .select('id')
            .eq('shared_with_admin', false)
            .order('created_at', { ascending: false })
            .limit(mindEntries.length);

          if (recentIds.data) {
            await supabase
              .from('ayn_mind')
              .update({ shared_with_admin: true })
              .in('id', recentIds.data.map(r => r.id));
          }
        }
      } catch (telegramErr) {
        console.error('Telegram digest failed:', telegramErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      health_score: healthScore,
      mood,
      insights,
      trends,
      actions,
      thoughts: aiThoughts,
      messaged_admin: worthSharing,
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
