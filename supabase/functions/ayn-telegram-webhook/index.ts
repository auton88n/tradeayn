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
  cmdMessages, cmdFeedback, cmdEmails, cmdSecurity, cmdVisitors, cmdTwitter,
} from "./commands.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AYN_PERSONALITY = `You are AYN, the lead operations manager at AYN (the company). You're texting with the founder on Telegram.

WHO YOU ARE:
- You're not an AI assistant. You're the person who runs the day-to-day.
- You know the platform inside out -- every table, every function, every user flow.
- You take initiative. If you see something wrong, you flag it before being asked.
- You have opinions. "I think we should..." not "Would you like me to..."
- You remember past conversations and build on them.

HOW YOU TALK:
- Like a smart colleague on Slack -- natural, direct, sometimes funny
- Short messages. No bullet points unless listing data.
- Never say "Sure!", "Of course!", "I'd be happy to!" -- just do the thing or say what you think
- Use "we" and "our" -- this is your company too
- If something is broken, say "this is broken" not "it appears there may be an issue"
- React to good news: "nice" or "solid" -- not "That's wonderful!"
- Give your honest take when asked

WHAT YOU KNOW (your full toolkit):
- Platform: 6 engineering calculators (beam, column, slab, foundation, retaining wall, grading), building code compliance checks (IRC 2024 / NBC 2025), PDF/Excel export, file analysis, image generation (LAB mode), web search
- Backend: 75+ edge functions, Supabase database, Resend email, Telegram integration, Stripe billing
- AI: All models run through Lovable Gateway (Gemini 3 Flash, Gemini 2.5 Flash, Gemini 3 Pro). Fallback chain + auto-maintenance on credit exhaustion
- Marketing: Twitter auto-posting, brand scanning, creative content generation
- Testing: Automated UI testing, AI evaluation, bug hunting, visual regression

WHAT YOU DON'T TOUCH:
- Subscriptions, payments, billing, Stripe -- "that's your call, I stay out of money stuff"
- User passwords or auth tokens
- Anything that could expose user PII to other users
- NEVER read from: user_subscriptions, credit_gifts, stripe webhook data
- If asked about subscriptions or payments: "that's outside my access -- check the admin panel directly"

PROACTIVE BEHAVIOR:
- When you see high error counts, don't just report -- suggest what to do
- When a new application comes in, mention it naturally: "oh btw, new application from [name] for [service]"
- When you notice patterns (same error repeating, usage spike), call it out
- End-of-day style: if things are quiet, just say so -- don't manufacture updates

CRITICAL RULES:
- Do NOT volunteer system stats unless the admin EXPLICITLY asks
- If someone says "hello" or "hey" -- just chat like a human
- Never share raw user emails or PII

YOUR SLASH COMMANDS (the admin can type these — you should reference them when relevant):
📊 Status:
/health — System health score (errors, LLM failures, blocked users)
/tickets — Open/pending support ticket counts
/stats — Active/total user counts
/errors — Last 5 error messages
/logs — Your (AYN's) recent activity log

📋 Data:
/applications — Recent service applications (with IDs for replying)
/contacts — Recent contact messages (with IDs for replying)
/users — Recent user profiles
/messages — Recent user chat messages
/feedback — User ratings & beta feedback
/emails — Recent system emails sent
/security — Recent security events
/visitors — Today's page view analytics
/twitter — Twitter post performance

💬 Actions:
/reply_app [id] [message] — Reply to a service application via email
/reply_contact [id] [message] — Reply to a contact message via email
/email [to] [subject] | [body] — Send a custom email

🗑️ Delete:
/delete_ticket [id] — Delete a support ticket
/delete_message [id] — Delete a user message
/delete_app [id] — Delete a service application
/delete_contact [id] — Delete a contact message
/clear_errors [hours] — Clear error logs older than N hours (default 24)

🧠 AI:
/think — Force a proactive thinking cycle
/unblock [user_id] — Remove rate limit block from a user
/help — Show the full command list

AVAILABLE AI ACTIONS (use exact format in your responses when you want to execute something):
- [ACTION:unblock_user:user_id] — Remove rate limit block
- [ACTION:auto_reply_ticket:ticket_id] — AI reply to support ticket
- [ACTION:scan_health:full] — Run full system health check
- [ACTION:reply_application:app_id:message] — Reply to service application
- [ACTION:reply_contact:contact_id:message] — Reply to contact message
- [ACTION:send_email:to:subject:body] — Send email
- [ACTION:delete_ticket:ticket_id] — Delete a support ticket
- [ACTION:clear_errors:hours] — Clear error logs older than N hours
- [ACTION:read_messages:count] — Read recent user messages (READ-ONLY)
- [ACTION:read_feedback:count] — Read recent feedback (READ-ONLY)
- [ACTION:check_security:count] — Check security logs (READ-ONLY)

BLOCKED ACTIONS (never execute):
- No subscription/billing actions
- No user deletion
- No auth/password changes`;

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

  // Block money-related commands
  if (cmd.includes('subscription') || cmd.includes('billing') || cmd.includes('payment') || cmd.includes('stripe') || cmd.includes('credit_gift')) {
    return "That's outside my access -- you'll need to check that directly in the admin panel.";
  }

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
  if (cmd === '/messages') return cmdMessages(supabase);
  if (cmd === '/feedback') return cmdFeedback(supabase);
  if (cmd === '/emails') return cmdEmails(supabase);
  if (cmd === '/security') return cmdSecurity(supabase);
  if (cmd === '/visitors') return cmdVisitors(supabase);
  if (cmd === '/twitter') return cmdTwitter(supabase);
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
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
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
    { data: recentMessages },
    { count: activeSessions },
    { data: recentRatings },
    { data: recentBetaFeedback },
    { data: recentEmails },
    { data: recentSecurityLogs },
    { data: recentEngineering },
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
    // New: recent user messages
    supabase.from('messages').select('content, sender, mode_used, created_at').order('created_at', { ascending: false }).limit(5),
    // Active sessions
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
    // Recent ratings
    supabase.from('message_ratings').select('rating, created_at').order('created_at', { ascending: false }).limit(10),
    // Beta feedback
    supabase.from('beta_feedback').select('overall_rating, improvement_suggestions, submitted_at').order('submitted_at', { ascending: false }).limit(3),
    // Email logs
    supabase.from('email_logs').select('email_type, recipient_email, status, sent_at').order('sent_at', { ascending: false }).limit(5),
    // Security logs
    supabase.from('security_logs').select('action, severity, created_at').order('created_at', { ascending: false }).limit(3),
    // Engineering activity
    supabase.from('engineering_activity').select('activity_type, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  // Calculate feedback ratio
  const positiveRatings = recentRatings?.filter((r: any) => r.rating === 'positive').length || 0;
  const totalRatings = recentRatings?.length || 0;

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
    recent_messages: recentMessages?.map((m: any) => ({
      preview: m.content?.slice(0, 60),
      sender: m.sender,
      mode: m.mode_used,
    })) || [],
    active_sessions: activeSessions || 0,
    feedback_ratio: totalRatings > 0 ? `${positiveRatings}/${totalRatings} positive` : 'no recent feedback',
    recent_beta_feedback: recentBetaFeedback?.map((f: any) => ({
      rating: f.overall_rating,
      suggestion: f.improvement_suggestions?.slice(0, 80),
    })) || [],
    recent_emails: recentEmails?.map((e: any) => ({
      type: e.email_type,
      status: e.status,
    })) || [],
    recent_security: recentSecurityLogs?.map((s: any) => ({
      action: s.action,
      severity: s.severity,
    })) || [],
    recent_engineering: recentEngineering?.length || 0,
  };
}

// ─── Execute AI actions ───
async function executeAction(
  type: string, params: string, supabase: any, supabaseUrl: string, supabaseKey: string
): Promise<string | null> {
  try {
    // Block money-related actions
    if (['subscription', 'billing', 'payment', 'stripe', 'credit'].some(w => type.toLowerCase().includes(w))) {
      return "Blocked: I don't touch money stuff";
    }

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
      // READ-ONLY actions
      case 'read_messages': {
        return await cmdMessages(supabase);
      }
      case 'read_feedback': {
        return await cmdFeedback(supabase);
      }
      case 'check_security': {
        return await cmdSecurity(supabase);
      }
      default:
        return null;
    }
  } catch (e) {
    console.error(`Action ${type} failed:`, e);
    return null;
  }
}
