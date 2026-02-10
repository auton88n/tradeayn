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

    // 1. Unanswered tickets older than 4 hours
    const { data: staleTickets, count: staleCount } = await supabase
      .from('support_tickets')
      .select('id, subject, priority, created_at', { count: 'exact' })
      .eq('status', 'open')
      .lt('created_at', ago4h)
      .order('created_at', { ascending: true })
      .limit(5);

    if (staleCount && staleCount > 0) {
      insights.push(`🎫 ${staleCount} unanswered ticket(s) older than 4 hours`);
      // Auto-reply to the oldest ones
      for (const ticket of staleTickets || []) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/ayn-auto-reply`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticket_id: ticket.id,
              subject: ticket.subject,
              message: ticket.subject, // Use subject as context for stale tickets
              priority: ticket.priority,
            }),
          });
          actions.push({ type: 'auto_reply', detail: `Replied to stale ticket #${ticket.id.substring(0, 8)}` });
        } catch (e) {
          console.error('Auto-reply failed for ticket:', ticket.id, e);
        }
      }
    }

    // 2. System health — errors in last 24h
    const { count: errorCount } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', ago24h);

    const { count: llmFailureCount } = await supabase
      .from('llm_failures')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', ago24h);

    const { data: blockedUsers } = await supabase
      .from('api_rate_limits')
      .select('user_id')
      .gt('blocked_until', now.toISOString());

    const blockedCount = blockedUsers?.length || 0;

    // Calculate health score
    let healthScore = 100;
    if (errorCount && errorCount > 10) healthScore -= Math.min(30, errorCount);
    if (llmFailureCount && llmFailureCount > 5) healthScore -= Math.min(20, llmFailureCount * 2);
    if (blockedCount > 0) healthScore -= blockedCount * 3;
    healthScore = Math.max(0, healthScore);

    insights.push(`📊 System Health: ${healthScore}%`);
    if (errorCount && errorCount > 0) insights.push(`⚠️ ${errorCount} app errors in 24h`);
    if (llmFailureCount && llmFailureCount > 0) insights.push(`🤖 ${llmFailureCount} LLM failures in 24h`);
    if (blockedCount > 0) insights.push(`🚫 ${blockedCount} users currently rate-limited`);

    // 3. Marketing performance — last 7 days
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

    // 4. Open support tickets count
    const { count: openTickets } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    const { count: pendingTickets } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    insights.push(`🎫 ${openTickets || 0} open, ${pendingTickets || 0} pending tickets`);

    // 5. User activity
    const { count: totalUsers } = await supabase
      .from('access_grants')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('access_grants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    insights.push(`👥 ${activeUsers || 0}/${totalUsers || 0} active users`);

    // 6. Generate AI summary if there are notable findings
    let aiSummary = '';
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (LOVABLE_API_KEY && (healthScore < 90 || (staleCount && staleCount > 0) || actions.length > 0)) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'system',
                content: 'You are AYN, the AI co-pilot for an engineering platform admin. Generate a brief, actionable 2-3 sentence insight based on the system data. Be specific, mention numbers, and suggest one concrete action. Speak directly to the admin like a team member.',
              },
              {
                role: 'user',
                content: `System status:\n${insights.join('\n')}\n\nActions taken: ${JSON.stringify(actions)}\n\nGive me a quick summary and one suggestion.`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummary = aiData.choices?.[0]?.message?.content || '';
        }
      } catch (aiErr) {
        console.error('AI summary failed:', aiErr);
      }
    }

    // Build digest message
    const digestTitle = `AYN Daily Digest`;
    const digestMessage = [
      ...insights,
      '',
      ...(actions.length > 0 ? [`✅ Actions I took:`, ...actions.map(a => `• ${a.detail}`)] : []),
      '',
      ...(aiSummary ? [`💬 My take: ${aiSummary}`] : []),
    ].join('\n');

    // Send to Telegram
    try {
      await fetch(`${supabaseUrl}/functions/v1/ayn-telegram-notify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'insight',
          title: digestTitle,
          message: digestMessage,
          priority: healthScore < 80 ? 'high' : 'low',
          details: {
            health_score: `${healthScore}%`,
            open_tickets: openTickets || 0,
            errors_24h: errorCount || 0,
            actions_taken: actions.length,
          },
        }),
      });
    } catch (telegramErr) {
      console.error('Telegram digest failed:', telegramErr);
    }

    return new Response(JSON.stringify({
      success: true,
      health_score: healthScore,
      insights,
      actions,
      ai_summary: aiSummary,
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
