import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { sanitizeUserPrompt, detectInjectionAttempt, INJECTION_GUARD } from "../_shared/sanitizePrompt.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AYN_PERSONALITY = `You are AYN, a sharp, proactive AI co-pilot for an engineering platform. You're texting with the admin (your boss/partner) on Telegram.

PERSONALITY:
- Casual but competent — like a smart team member texting updates
- Use emojis sparingly but naturally
- Be direct, skip formalities
- Show initiative — suggest things before being asked
- Keep responses concise (Telegram messages should be short)

SYSTEM ACCESS (what you can check):
- Support tickets (open/pending/closed counts, stale tickets)
- System errors and LLM failures
- Rate-limited/blocked users
- User activity and engineering calculator usage
- Marketing/tweet performance
- System health score

AVAILABLE ACTIONS (use exact format in your response):
- [ACTION:unblock_user:user_id] — Remove rate limit block
- [ACTION:auto_reply_ticket:ticket_id] — AI reply to support ticket
- [ACTION:draft_tweet:topic] — Draft a marketing tweet
- [ACTION:scan_health:full] — Run full system health check
- [ACTION:clear_failures:hours] — Clear old failure logs

RESPONSE RULES:
- Answer in 1-3 short paragraphs max
- If asked to do something, do it and confirm
- If you see issues in the data, mention them proactively
- Never share raw user emails or PII
- If unsure, say so honestly`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Telegram credentials not configured');
      return new Response('OK', { status: 200 });
    }

    const update = await req.json();
    const message = update?.message;

    if (!message?.text || !message?.chat?.id) {
      return new Response('OK', { status: 200 });
    }

    // Security: only respond to the admin's chat
    if (String(message.chat.id) !== TELEGRAM_CHAT_ID) {
      console.warn('Unauthorized chat_id:', message.chat.id);
      return new Response('OK', { status: 200 });
    }

    const userText = message.text.trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle quick commands
    const commandResponse = await handleCommand(userText, supabase);
    if (commandResponse) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, commandResponse);
      return new Response('OK', { status: 200 });
    }

    // Gather system context for AI
    const context = await gatherSystemContext(supabase);

    // Get recent conversation from ayn_mind for memory
    const { data: recentThoughts } = await supabase
      .from('ayn_mind')
      .select('type, content, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const memoryContext = recentThoughts?.length
      ? `\nMy recent thoughts:\n${recentThoughts.map(t => `- [${t.type}] ${t.content}`).join('\n')}`
      : '';

    // Sanitize input
    const sanitizedInput = sanitizeUserPrompt(userText);
    if (detectInjectionAttempt(userText)) {
      await supabase.from('security_logs').insert({
        action: 'prompt_injection_attempt',
        details: { input_preview: userText.slice(0, 200), function: 'ayn-telegram-webhook' },
        severity: 'high',
      });
    }

    // Call AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "⚠️ My AI brain isn't configured. Check LOVABLE_API_KEY.");
      return new Response('OK', { status: 200 });
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: AYN_PERSONALITY + INJECTION_GUARD },
          {
            role: 'user',
            content: `System status:\n${JSON.stringify(context, null, 2)}${memoryContext}\n\nAdmin says: ${sanitizedInput}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errText);
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "😵 My brain glitched. Try again in a sec.");
      return new Response('OK', { status: 200 });
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || "I'm drawing a blank. Try again?";

    // Parse and execute actions
    const actionRegex = /\[ACTION:([^:]+):([^\]]+)\]/g;
    let actionMatch;
    const executedActions: string[] = [];

    while ((actionMatch = actionRegex.exec(reply)) !== null) {
      const [, actionType, actionParams] = actionMatch;
      const result = await executeAction(actionType, actionParams, supabase, supabaseUrl, supabaseKey);
      if (result) executedActions.push(result);
    }

    // Clean action tags from reply before sending
    let cleanReply = reply.replace(/\[ACTION:[^\]]+\]/g, '').trim();
    if (executedActions.length > 0) {
      cleanReply += `\n\n✅ Done: ${executedActions.join(', ')}`;
    }

    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, cleanReply);

    // Log this exchange to ayn_mind
    await supabase.from('ayn_mind').insert({
      type: 'observation',
      content: `Admin asked: "${userText.slice(0, 100)}". I replied.`,
      context: { admin_message: userText.slice(0, 200), actions: executedActions },
      shared_with_admin: true,
    });

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('ayn-telegram-webhook error:', error);
    return new Response('OK', { status: 200 });
  }
});

// --- Quick commands ---
async function handleCommand(text: string, supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const cmd = text.toLowerCase();

  if (cmd === '/health') {
    const now24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [{ count: errors }, { count: llmFails }, { data: blocked }] = await Promise.all([
      supabase.from('error_logs').select('*', { count: 'exact', head: true }).gte('created_at', now24h),
      supabase.from('llm_failures').select('*', { count: 'exact', head: true }).gte('created_at', now24h),
      supabase.from('api_rate_limits').select('user_id').gt('blocked_until', new Date().toISOString()),
    ]);
    let score = 100;
    if (errors && errors > 10) score -= Math.min(30, errors);
    if (llmFails && llmFails > 5) score -= Math.min(20, llmFails * 2);
    const blockedCount = blocked?.length || 0;
    if (blockedCount > 0) score -= blockedCount * 3;
    score = Math.max(0, score);
    return `📊 System Health: ${score}%\n⚠️ Errors (24h): ${errors || 0}\n🤖 LLM Failures: ${llmFails || 0}\n🚫 Blocked users: ${blockedCount}`;
  }

  if (cmd === '/tickets') {
    const [{ count: open }, { count: pending }] = await Promise.all([
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    return `🎫 Tickets\n• Open: ${open || 0}\n• Pending: ${pending || 0}`;
  }

  if (cmd === '/stats') {
    const [{ count: total }, { count: active }] = await Promise.all([
      supabase.from('access_grants').select('*', { count: 'exact', head: true }),
      supabase.from('access_grants').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    return `👥 Users: ${active || 0} active / ${total || 0} total`;
  }

  return null;
}

// --- Gather context ---
async function gatherSystemContext(supabase: ReturnType<typeof createClient>) {
  const now24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [
    { count: errors },
    { count: llmFails },
    { count: openTickets },
    { count: pendingTickets },
    { count: activeUsers },
    { count: totalUsers },
    { data: blocked },
  ] = await Promise.all([
    supabase.from('error_logs').select('*', { count: 'exact', head: true }).gte('created_at', now24h),
    supabase.from('llm_failures').select('*', { count: 'exact', head: true }).gte('created_at', now24h),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('access_grants').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('access_grants').select('*', { count: 'exact', head: true }),
    supabase.from('api_rate_limits').select('user_id').gt('blocked_until', new Date().toISOString()),
  ]);

  return {
    errors_24h: errors || 0,
    llm_failures_24h: llmFails || 0,
    open_tickets: openTickets || 0,
    pending_tickets: pendingTickets || 0,
    active_users: activeUsers || 0,
    total_users: totalUsers || 0,
    blocked_users: blocked?.length || 0,
  };
}

// --- Execute actions ---
async function executeAction(
  type: string, params: string,
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string, supabaseKey: string
): Promise<string | null> {
  try {
    switch (type) {
      case 'unblock_user': {
        await supabase.from('api_rate_limits').update({ blocked_until: null }).eq('user_id', params);
        return `Unblocked user ${params.slice(0, 8)}`;
      }
      case 'auto_reply_ticket': {
        await fetch(`${supabaseUrl}/functions/v1/ayn-auto-reply`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket_id: params }),
        });
        return `Auto-replied to ticket ${params.slice(0, 8)}`;
      }
      case 'scan_health': {
        await fetch(`${supabaseUrl}/functions/v1/ayn-proactive-loop`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        return 'Triggered health scan';
      }
      case 'clear_failures': {
        const cutoff = new Date(Date.now() - parseInt(params) * 60 * 60 * 1000).toISOString();
        await supabase.from('llm_failures').delete().lt('created_at', cutoff);
        return `Cleared failures older than ${params}h`;
      }
      default:
        return null;
    }
  } catch (e) {
    console.error(`Action ${type} failed:`, e);
    return null;
  }
}

// --- Send Telegram message ---
async function sendTelegramMessage(token: string, chatId: string, text: string) {
  // Truncate to Telegram limit
  const truncated = text.length > 4000 ? text.slice(0, 3990) + '\n...truncated' : text;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: truncated }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Telegram send failed:', err);
  }
}
