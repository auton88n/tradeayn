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
    const commandResponse = await handleCommand(userText, supabase, supabaseUrl, supabaseKey, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
    if (commandResponse) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, commandResponse);
      return new Response('OK', { status: 200 });
    }

    // Gather system context for AI
    const context = await gatherSystemContext(supabase);

    // FIX 5: Get real conversation history for memory
    const conversationHistory = await getConversationHistory(supabase);

    // Sanitize input
    const sanitizedInput = sanitizeUserPrompt(userText);
    if (detectInjectionAttempt(userText)) {
      await supabase.from('security_logs').insert({
        action: 'prompt_injection_attempt',
        details: { input_preview: userText.slice(0, 200), function: 'ayn-telegram-webhook' },
        severity: 'high',
      });
    }

    // Call AI with conversation history
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "⚠️ My AI brain isn't configured. Check LOVABLE_API_KEY.");
      return new Response('OK', { status: 200 });
    }

    // Build messages array with history
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: AYN_PERSONALITY + INJECTION_GUARD },
    ];

    // Add conversation history
    for (const turn of conversationHistory) {
      messages.push(turn);
    }

    // Add current message with system context
    messages.push({
      role: 'user',
      content: `System status:\n${JSON.stringify(context, null, 2)}\n\nAdmin says: ${sanitizedInput}`,
    });

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
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

    // Log BOTH the admin message and AYN's reply for conversation memory
    await supabase.from('ayn_mind').insert([
      {
        type: 'telegram_admin',
        content: userText.slice(0, 500),
        context: { source: 'telegram' },
        shared_with_admin: true,
      },
      {
        type: 'telegram_ayn',
        content: cleanReply.slice(0, 500),
        context: { source: 'telegram', actions: executedActions },
        shared_with_admin: true,
      },
    ]);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('ayn-telegram-webhook error:', error);
    return new Response('OK', { status: 200 });
  }
});

// --- FIX 5: Build conversation history from ayn_mind ---
async function getConversationHistory(supabase: ReturnType<typeof createClient>) {
  const { data: exchanges } = await supabase
    .from('ayn_mind')
    .select('type, content, created_at')
    .in('type', ['telegram_admin', 'telegram_ayn'])
    .order('created_at', { ascending: true })
    .limit(20); // last 10 exchanges = 20 entries

  if (!exchanges?.length) return [];

  const messages: Array<{ role: string; content: string }> = [];
  for (const entry of exchanges) {
    if (entry.type === 'telegram_admin') {
      messages.push({ role: 'user', content: entry.content });
    } else if (entry.type === 'telegram_ayn') {
      messages.push({ role: 'assistant', content: entry.content });
    }
  }

  return messages;
}

// --- Quick commands (FIX 6: expanded) ---
async function handleCommand(
  text: string,
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  supabaseKey: string,
  telegramToken: string,
  chatId: string,
): Promise<string | null> {
  const cmd = text.toLowerCase();

  if (cmd === '/help') {
    return `🤖 AYN Commands:
/health — System health check
/tickets — Open/pending ticket counts
/stats — User stats
/errors — Recent error details
/think — Force a thinking cycle
/unblock [user_id] — Unblock a user
/help — This message

Or just chat with me naturally!`;
  }

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

  if (cmd === '/errors') {
    const { data: recentErrors } = await supabase
      .from('error_logs')
      .select('error_message, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentErrors?.length) return '✅ No recent errors!';

    const errorList = recentErrors.map((e, i) => {
      const ago = Math.round((Date.now() - new Date(e.created_at!).getTime()) / 60000);
      return `${i + 1}. ${e.error_message.slice(0, 80)} (${ago}m ago)`;
    }).join('\n');
    return `⚠️ Recent Errors:\n${errorList}`;
  }

  if (cmd === '/think') {
    // Trigger proactive loop
    try {
      await fetch(`${supabaseUrl}/functions/v1/ayn-proactive-loop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return '🧠 Running a thinking cycle now... I\'ll message you if I find anything interesting.';
    } catch {
      return '❌ Failed to trigger thinking cycle.';
    }
  }

  if (cmd.startsWith('/unblock ')) {
    const userId = text.slice(9).trim();
    if (!userId) return '❌ Usage: /unblock [user_id]';
    await supabase.from('api_rate_limits').update({ blocked_until: null }).eq('user_id', userId);
    return `✅ Unblocked user ${userId.slice(0, 8)}...`;
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
