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
    try { body = await req.json(); } catch {}
    const mode = body.mode || 'check_retention';
    const insights: string[] = [];

    if (mode === 'new_application' && body.record) {
      // Event-driven: new service application
      const app = body.record;
      insights.push(`New application from ${app.full_name || 'unknown'} for ${app.service_type || 'service'}`);

      // Notify co-founder
      await supabase.from('ayn_mind').insert({
        type: 'employee_report',
        content: `👋 Customer Success: New application from ${app.full_name} (${app.email}) for ${app.service_type}. Application pending review.`,
        context: { from_employee: 'customer_success', application_id: app.id },
        shared_with_admin: false,
      });
    } else if (mode === 'negative_feedback' && body.record) {
      // Event-driven: negative message rating
      const rating = body.record;
      // Check if 3+ negatives in 24h from same user
      const ago24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('message_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', rating.user_id)
        .eq('rating', 'negative')
        .gte('created_at', ago24h);

      if (count && count >= 3) {
        insights.push(`⚠️ User ${rating.user_id?.slice(0, 8)} gave ${count} negative ratings in 24h — possible churn risk`);
        await supabase.from('ayn_mind').insert({
          type: 'employee_report',
          content: `⚠️ Churn alert: User ${rating.user_id?.slice(0, 8)} has ${count} negative ratings in 24h. Needs attention.`,
          context: { from_employee: 'customer_success', user_id: rating.user_id, negative_count: count },
          shared_with_admin: false,
        });
      }
    } else {
      // Cron mode: retention checks
      const ago7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const ago4h = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

      // 1. Users inactive 7+ days
      const { data: inactiveUsers } = await supabase
        .from('profiles')
        .select('user_id, contact_person, last_login')
        .lt('last_login', ago7d)
        .not('last_login', 'is', null)
        .limit(20);

      if (inactiveUsers?.length) {
        insights.push(`${inactiveUsers.length} user(s) inactive for 7+ days`);
      }

      // 2. Pending applications older than 4 hours
      const { data: staleApps } = await supabase
        .from('service_applications')
        .select('id, full_name, service_type, created_at')
        .eq('status', 'pending')
        .lt('created_at', ago4h);

      if (staleApps?.length) {
        insights.push(`${staleApps.length} application(s) pending for 4+ hours: ${staleApps.map(a => a.full_name).join(', ')}`);
      }

      // 3. Recent negative feedback ratio
      const ago24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentRatings } = await supabase
        .from('message_ratings')
        .select('rating')
        .gte('created_at', ago24h);

      if (recentRatings?.length) {
        const negative = recentRatings.filter((r: any) => r.rating === 'negative').length;
        const total = recentRatings.length;
        const ratio = Math.round((negative / total) * 100);
        if (ratio > 30) {
          insights.push(`⚠️ High negative feedback: ${negative}/${total} (${ratio}%) in 24h`);
        } else {
          insights.push(`Feedback: ${negative}/${total} negative (${ratio}%) — healthy`);
        }
      }

      // 4. Active user engagement
      const { count: activeToday } = await supabase
        .from('messages')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      insights.push(`${activeToday || 0} message(s) sent in last 24h`);

      // Report
      if (insights.length > 0) {
        await supabase.from('ayn_mind').insert({
          type: 'employee_report',
          content: `👥 Customer Success Report:\n${insights.map(i => `• ${i}`).join('\n')}`,
          context: {
            from_employee: 'customer_success',
            inactive_users: inactiveUsers?.length || 0,
            stale_apps: staleApps?.length || 0,
          },
          shared_with_admin: false,
        });
      }
    }

    await logAynActivity(supabase, 'customer_success_check', `Customer success: ${insights.length} insight(s)`, {
      details: { insights },
      triggered_by: 'customer_success',
    });

    return new Response(JSON.stringify({ success: true, insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ayn-customer-success error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
