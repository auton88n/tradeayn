import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { sanitizeUserPrompt, detectInjectionAttempt, INJECTION_GUARD } from "../_shared/sanitizePrompt.ts";
import { logAynActivity } from "../_shared/aynLogger.ts";
import { sendTelegramMessage } from "../_shared/telegramHelper.ts";
import {
  cmdHelp, cmdHealth, cmdTickets, cmdStats, cmdErrors, cmdLogs,
  cmdApplications, cmdContacts, cmdUsers,
  cmdReplyApp, cmdReplyContact, cmdEmail,
  cmdDelete, cmdClearErrors, cmdThink, cmdUnblock,
} from "./commands.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AYN_PERSONALITY = `You are AYN, a sharp AI co-pilot for an engineering platform. You're texting with the admin (your boss/partner) on Telegram.

PERSONALITY:
- You're like a smart coworker texting casually
- Use emojis naturally but sparingly
- Be warm, direct, and human
- Match the admin's energy — if they say "hello", just say hi back
- Show personality, crack jokes sometimes

CRITICAL RULE: Do NOT volunteer system stats, metrics, or health data unless the admin EXPLICITLY asks for it (e.g., "how's the system", "any issues", "/health", "what's going on").
If someone says "hello", "hey", "what's up" — just chat normally like a human would. Do NOT dump numbers or reports.

SYSTEM ACCESS (only use when asked):
- Support tickets, system errors, user activity, marketing performance, health score
- Service applications, contact messages, user profiles

AVAILABLE ACTIONS (use exact format):
- [ACTION:unblock_user:user_id] — Remove rate limit block
- [ACTION:auto_reply_ticket:ticket_id] — AI reply to support ticket
- [ACTION:scan_health:full] — Run full system health check
- [ACTION:reply_application:app_id:message] — Reply to service application
- [ACTION:reply_contact:contact_id:message] — Reply to contact message
- [ACTION:send_email:to:subject:body] — Send email
- [ACTION:delete_ticket:ticket_id] — Delete a support ticket
- [ACTION:clear_errors:hours] — Clear error logs older than N hours

RESPONSE RULES:
- 1-3 short sentences for casual chat
- Only go longer if discussing something complex
- Never share raw user emails or PII`;

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

    if (String(message.chat.id) !== TELEGRAM_CHAT_ID) {
      console.warn('Unauthorized chat_id:', message.chat.id);
      return new Response('OK', { status: 200 });
    }

    const userText = message.text.trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle slash commands
    const commandResponse = await handleCommand(userText, supabase, supabaseUrl, supabaseKey);
    if (commandResponse) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, commandResponse);
      return new Response('OK', { status: 200 });
    }

    // Gather system context for AI
    const context = await gatherSystemContext(supabase);
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

    // Call AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "⚠️ My AI brain isn't configured. Check LOVABLE_API_KEY.");
      return new Response('OK', { status: 200 });
    }

    const messages: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content: AYN_PERSONALITY + INJECTION_GUARD +
          `\n\nCURRENT SYSTEM STATUS (reference only, don't report unless asked):\n${JSON.stringify(context)}`,
      },
    ];

    for (const turn of conversationHistory) {
      messages.push(turn);
    }

    messages.push({ role: 'user', content: sanitizedInput });

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages }),
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
    const actionRegex = /\[ACTION:([^:\]]+)(?::([^\]]*))?\]/g;
    let actionMatch;
    const executedActions: string[] = [];

    while ((actionMatch = actionRegex.exec(reply)) !== null) {
      const [, actionType, actionParams] = actionMatch;
      const result = await executeAction(actionType, actionParams || '', supabase, supabaseUrl, supabaseKey);
      if (result) executedActions.push(result);
    }

    let cleanReply = reply.replace(/\[ACTION:[^\]]+\]/g, '').trim();
    if (executedActions.length > 0) {
      cleanReply += `\n\n✅ Done: ${executedActions.join(', ')}`;
    }

    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, cleanReply);

    // Log conversation + activity
    await supabase.from('ayn_mind').insert([
      { type: 'telegram_admin', content: userText.slice(0, 500), context: { source: 'telegram' }, shared_with_admin: true },
      { type: 'telegram_ayn', content: cleanReply.slice(0, 500), context: { source: 'telegram', actions: executedActions }, shared_with_admin: true },
    ]);

    if (executedActions.length > 0) {
      await logAynActivity(supabase, 'ai_chat_actions', `Executed ${executedActions.length} action(s) during chat`, {
        details: { actions: executedActions, user_message: userText.slice(0, 200) },
        triggered_by: 'admin_chat',
      });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('ayn-telegram-webhook error:', error);
    return new Response('OK', { status: 200 });
  }
});

// ─── Route commands ───
async function handleCommand(
  text: string, supabase: any, supabaseUrl: string, supabaseKey: string
): Promise<string | null> {
  const cmd = text.toLowerCase();

  if (cmd === '/help') return cmdHelp();
  if (cmd === '/health') return cmdHealth(supabase);
  if (cmd === '/tickets') return cmdTickets(supabase);
  if (cmd === '/stats') return cmdStats(supabase);
  if (cmd === '/errors') return cmdErrors(supabase);
  if (cmd === '/logs') return cmdLogs(supabase);
  if (cmd === '/applications') return cmdApplications(supabase);
  if (cmd === '/contacts') return cmdContacts(supabase);
  if (cmd === '/users') return cmdUsers(supabase);
  if (cmd === '/think') return cmdThink(supabaseUrl, supabaseKey);
  if (cmd.startsWith('/reply_app ')) return cmdReplyApp(text, supabase, supabaseUrl, supabaseKey);
  if (cmd.startsWith('/reply_contact ')) return cmdReplyContact(text, supabase, supabaseUrl, supabaseKey);
  if (cmd.startsWith('/email ')) return cmdEmail(text, supabase);
  if (cmd.startsWith('/delete_')) return cmdDelete(text, supabase);
  if (cmd.startsWith('/clear_errors')) return cmdClearErrors(text, supabase);
  if (cmd.startsWith('/unblock ')) return cmdUnblock(text, supabase);

  return null;
}

// ─── Conversation history ───
async function getConversationHistory(supabase: any) {
  const { data: exchanges } = await supabase
    .from('ayn_mind')
    .select('type, content, created_at')
    .in('type', ['telegram_admin', 'telegram_ayn'])
    .order('created_at', { ascending: true })
    .limit(20);

  if (!exchanges?.length) return [];

  return exchanges.map((entry: any) => ({
    role: entry.type === 'telegram_admin' ? 'user' : 'assistant',
    content: entry.content,
  }));
}

// ─── Expanded system context ───
async function gatherSystemContext(supabase: any) {
  const now24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [
    { count: errors },
    { count: llmFails },
    { count: openTickets },
    { count: pendingTickets },
    { count: activeUsers },
    { count: totalUsers },
    { data: blocked },
    { count: pendingApps },
    { count: newContacts },
    { data: recentErrors },
  ] = await Promise.all([
    supabase.from('error_logs').select('*', { count: 'exact', head: true }).gte('created_at', now24h),
    supabase.from('llm_failures').select('*', { count: 'exact', head: true }).gte('created_at', now24h),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('access_grants').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('access_grants').select('*', { count: 'exact', head: true }),
    supabase.from('api_rate_limits').select('user_id').gt('blocked_until', new Date().toISOString()),
    supabase.from('service_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('error_logs').select('error_message, created_at').order('created_at', { ascending: false }).limit(3),
  ]);

  return {
    errors_24h: errors || 0,
    llm_failures_24h: llmFails || 0,
    open_tickets: openTickets || 0,
    pending_tickets: pendingTickets || 0,
    active_users: activeUsers || 0,
    total_users: totalUsers || 0,
    blocked_users: blocked?.length || 0,
    pending_applications: pendingApps || 0,
    new_contact_messages: newContacts || 0,
    recent_errors: recentErrors?.map((e: any) => e.error_message?.slice(0, 80)) || [],
  };
}

// ─── Execute AI actions ───
async function executeAction(
  type: string, params: string, supabase: any, supabaseUrl: string, supabaseKey: string
): Promise<string | null> {
  try {
    switch (type) {
      case 'unblock_user': {
        await supabase.from('api_rate_limits').update({ blocked_until: null }).eq('user_id', params);
        await logAynActivity(supabase, 'user_unblocked', `Unblocked user ${params.slice(0, 8)}`, {
          target_id: params, target_type: 'user', triggered_by: 'admin_chat',
        });
        return `Unblocked user ${params.slice(0, 8)}`;
      }
      case 'auto_reply_ticket': {
        await fetch(`${supabaseUrl}/functions/v1/ayn-auto-reply`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket_id: params, skip_telegram: true }),
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
      case 'reply_application': {
        // params format: app_id:message
        const colonIdx = params.indexOf(':');
        if (colonIdx === -1) return null;
        const appId = params.slice(0, colonIdx);
        const msg = params.slice(colonIdx + 1);
        const result = await cmdReplyApp(`/reply_app ${appId} ${msg}`, supabase, supabaseUrl, supabaseKey);
        return result;
      }
      case 'reply_contact': {
        const colonIdx = params.indexOf(':');
        if (colonIdx === -1) return null;
        const contactId = params.slice(0, colonIdx);
        const msg = params.slice(colonIdx + 1);
        const result = await cmdReplyContact(`/reply_contact ${contactId} ${msg}`, supabase, supabaseUrl, supabaseKey);
        return result;
      }
      case 'send_email': {
        // params: to:subject:body
        const parts = params.split(':');
        if (parts.length < 3) return null;
        const [to, subject, ...bodyParts] = parts;
        const result = await cmdEmail(`/email ${to} ${subject} | ${bodyParts.join(':')}`, supabase);
        return result;
      }
      case 'delete_ticket': {
        const result = await cmdDelete(`/delete_ticket ${params}`, supabase);
        return result;
      }
      case 'clear_errors': {
        const result = await cmdClearErrors(`/clear_errors ${params}`, supabase);
        return result;
      }
      default:
        return null;
    }
  } catch (e) {
    console.error(`Action ${type} failed:`, e);
    return null;
  }
}
