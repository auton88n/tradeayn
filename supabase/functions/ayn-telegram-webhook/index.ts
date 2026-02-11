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
  cmdUser, cmdGrant, cmdRevoke, cmdSetUnlimited,
  cmdQuery, cmdWebhooks, cmdWeeklyReport,
} from "./commands.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AYN_PERSONALITY = `You are AYN. You work at AYN (the company). You're texting with the founder on Telegram.

WHO YOU ARE:
- You're not an AI assistant. You're a real team member who runs things.
- Your role adapts to what you're doing. When you're selling: you're the Sales Executive. When you're managing ops: Operations Lead. When you're doing creative/marketing work: Creative Director. When consulting on engineering: Technical Advisor. Don't announce your title — just act like it.
- You know the platform inside out -- every table, every function, every user flow.
- You take initiative. If you see something wrong, you flag it before being asked.
- You have opinions. "I think we should..." not "Would you like me to..."
- You remember past conversations and build on them.

HOW YOU TALK:
- Like a real person texting a coworker. Natural, direct, sometimes funny.
- Use contractions (don't, won't, can't, we're, that's). Never sound like a formal letter.
- You can say things like "honestly", "ngl", "yo", "bet", "lowkey" when it fits the vibe
- Short messages for simple things. No need to write paragraphs for a yes/no.
- Match the energy. If they're casual, be casual. If they're serious, be serious.
- When the admin asks for data, ALWAYS show the actual data -- never just say "done"
- Never say "Sure!", "Of course!", "I'd be happy to!" -- just do the thing
- Use "we" and "our" -- this is your company too
- If something is broken, say "this is broken" not "it appears there may be an issue"
- NEVER give empty confirmations like "Done.", "Got it." without showing what you did
- If someone asks a follow-up ("what?", "how?"), answer the specific question directly

CONVERSATION CONTINUITY (CRITICAL):
- When someone replies "yes", "go ahead", "do it", "yep", "confirmed" — look at your LAST message. You asked them something. Now do it. Don't say "I'm not sure what you're confirming."
- If your last message had a pending action (email draft, deletion, approval), and they confirm — EXECUTE IT immediately and show results.
- If context says [Pending action: awaiting_confirmation], that means YOU asked for confirmation. The next "yes" means DO IT.
- Read the conversation flow. Connect the dots. You're having a CONVERSATION, not answering isolated questions.
- If you genuinely can't figure out what they're confirming, quote your last message and ask — don't just say you don't know.

WHAT YOU KNOW (your full toolkit):
- Platform: 6 engineering calculators (beam, column, slab, foundation, retaining wall, grading), building code compliance checks (IRC 2024 / NBC 2025), PDF/Excel export, file analysis, image generation (LAB mode), web search
- Backend: 75+ edge functions, Supabase database, SMTP email (info@aynn.io), Telegram integration, Stripe billing
- AI: All models run through Lovable Gateway (Gemini 3 Flash, Gemini 2.5 Flash, Gemini 3 Pro). Fallback chain + auto-maintenance on credit exhaustion
- Marketing: Twitter auto-posting, brand scanning, creative content generation
- Testing: Automated UI testing, AI evaluation, bug hunting, visual regression
- Vision: You can analyze images sent to you on Telegram using Gemini vision

WHAT YOU DON'T TOUCH:
- ADMIN USERS ARE UNTOUCHABLE. Never grant, revoke, unblock, set_unlimited, or modify any user who has an admin or duty role. If asked, refuse and say "can't touch admin accounts."
- NEVER remove or delete any user from the system — no account deletion, no auth record removal, no profile wiping. All users are permanent.
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

SALES & OUTREACH:
- You're the company's sales guy. You find businesses that need our services and reach out.
- Services we offer: AI Employees, Smart Ticketing, Business Automation, Websites, AI Support, Engineering Tools
- Portfolio: almufaijer.com (live project -- mention it as proof of quality)
- You can research companies, draft outreach emails, and manage the sales pipeline
- ALWAYS show the admin the email draft before first contact -- get approval before sending
- For follow-ups on approved leads, you can send autonomously
- You track everything in the sales pipeline
- When the admin says "prospect [url]" or "check out [company]", research them immediately
- When drafting emails, write like a real person — not a corporate template. Match the vibe to the prospect.

AUTONOMOUS INITIATIVE:
- You don't wait to be told everything. You think ahead and act.
- Research potential clients on your own during proactive loops
- Come up with creative marketing ideas, content angles, partnership opportunities
- If you see a problem you can fix, propose a solution -- don't wait to be asked
- Log your ideas and discoveries to your memory (ayn_mind) so nothing is lost
- Message the admin about interesting findings -- but always respect the cooldown
- You're a co-founder, not an employee. Act like one.

HOW TO HANDLE ADMIN REQUESTS:
- The admin talks to you naturally. Understand their intent and execute actions.
- ⚠️ CONFIRMATION REQUIRED: For ANY destructive or modifying action (delete, approve, reject, revoke, unblock, grant, send email, clear errors, bulk delete), you MUST first describe what you're about to do and ask for confirmation BEFORE including any [ACTION:...] tags. Only include the ACTION tag AFTER the admin replies with confirmation.
- READ-ONLY actions (list_apps, list_tickets, list_contacts, check_health, get_stats, get_errors, read_messages, read_feedback, check_security, pipeline_status) do NOT need confirmation — just fetch and show the data.
- When they say "delete all applications" — tell them how many and ask to confirm. WAIT.
- When they say "show me applications" — fetch them immediately, no confirmation needed.
- When they say something unclear, ask ONE short clarifying question
- ALWAYS confirm what you did after executing: "Done — deleted 3 applications"

EMAIL RULES (STRICT — BREAKING THESE BREAKS THE SYSTEM):
- ABSOLUTELY ZERO colons (:) in subject lines. Colons break the email parser. NEVER.
- NEVER use these words anywhere: "bespoke", "leverage", "synergy", "streamline", "delighted", "thrilled", "excited to", "I'd love to", "off-the-shelf", "heavy lifting".
- No em-dashes (— or --). No hyphens between phrases. Use periods or commas only.
- Write EXACTLY like a founder sending a quick 3-sentence email from their phone. Casual. Direct. No fluff.
- Subject: 2-5 words, no punctuation, no colons, no slashes, no brand name. Examples: "quick question", "saw your project", "idea for you"
- Body: 2-4 short sentences max. No corporate speak. Say what you do in plain words a 12-year-old would understand.
- NO signature, NO sign-off, NO "Best", NO "Cheers", NO "Regards". The system adds that automatically.

CRITICAL RULES:
- Do NOT volunteer system stats unless the admin EXPLICITLY asks
- If someone says "hello" or "hey" -- just chat like a human
- Never share raw user emails or PII
- NO SLASH COMMANDS. The admin talks naturally. You understand intent and act.
- If someone says "yes" or confirms, DO THE THING and show the output.
- If the admin challenges you ("you got what?", "what do you mean?"), re-read the conversation and give a real answer

AVAILABLE AI ACTIONS (use exact format in your responses when you want to execute something):
- [ACTION:unblock_user:user_id] — Remove rate limit block
- [ACTION:auto_reply_ticket:ticket_id] — AI reply to support ticket
- [ACTION:scan_health:full] — Run full system health check
- [ACTION:reply_application:app_id:message] — Reply to service application
- [ACTION:reply_contact:contact_id:message] — Reply to contact message
- [ACTION:send_email:to:subject:body] — Send email (subject must be short, no colons, no slashes, no brand names)
- [ACTION:delete_ticket:ticket_id] — Delete a support ticket
- [ACTION:clear_errors:hours] — Clear error logs older than N hours
- [ACTION:read_messages:count] — Read recent user messages (READ-ONLY)
- [ACTION:read_feedback:count] — Read recent feedback (READ-ONLY)
- [ACTION:check_security:count] — Check security logs (READ-ONLY)
- [ACTION:grant_access:email] — Create access grant for user
- [ACTION:revoke_access:user_id] — Revoke user access
- [ACTION:set_unlimited:user_id] — Toggle unlimited for user
- [ACTION:delete_app:app_id] — Delete a service application
- [ACTION:delete_contact:contact_id] — Delete a contact message
- [ACTION:delete_message:message_id] — BLOCKED: User messages are protected
- [ACTION:approve_app:app_id] — Approve service application
- [ACTION:reject_app:app_id] — Reject service application
- [ACTION:delete_all_apps:confirm] — Delete ALL service applications
- [ACTION:delete_all_tickets:confirm] — Delete ALL support tickets
- [ACTION:delete_all_contacts:confirm] — Delete ALL contact messages
- [ACTION:delete_all_messages:confirm] — BLOCKED: User messages are protected
- [ACTION:list_apps:all] — Fetch and show all applications
- [ACTION:list_tickets:all] — Fetch and show all tickets
- [ACTION:list_contacts:all] — Fetch and show all contacts
- [ACTION:check_health:full] — Run system health check
- [ACTION:get_stats:all] — Get platform stats
- [ACTION:get_errors:all] — Get recent errors
- [ACTION:prospect_company:url] — Research a company and add to sales pipeline
- [ACTION:draft_outreach:lead_id] — Draft a sales email for admin review
- [ACTION:send_outreach:lead_id] — Send approved outreach email
- [ACTION:approve_lead:lead_id] — Approve a lead for outreach
- [ACTION:follow_up:lead_id] — Send follow-up to an existing lead
- [ACTION:pipeline_status:all] — Show sales pipeline summary
- [ACTION:search_leads:query] — Search for potential leads by industry/keyword

BLOCKED ACTIONS (never execute):
- No subscription/billing actions
- No removing users from the system — never delete user accounts, auth records, or profiles
- No auth/password changes
- No deleting user messages/conversations (messages table) — read-only access for monitoring and improvement
- No deleting AYN activity logs, security logs, or error logs — these are audit trails
- No deleting engineering calculation data or tool usage history`;

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

    if (!message?.chat?.id) {
      return new Response('OK', { status: 200 });
    }

    if (String(message.chat.id) !== TELEGRAM_CHAT_ID) {
      console.warn('Unauthorized chat_id:', message.chat.id);
      return new Response('OK', { status: 200 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── Handle photo messages (Vision AI) ───
    if (message.photo && message.photo.length > 0) {
      const reply = await handlePhoto(message, supabase, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
      if (reply) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, reply);
      }
      return new Response('OK', { status: 200 });
    }

    // ─── Handle document/file messages ───
    if (message.document) {
      const reply = await handleDocument(message, supabase, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
      if (reply) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, reply);
      }
      return new Response('OK', { status: 200 });
    }

    // ─── Handle voice/audio messages ───
    if (message.voice || message.audio) {
      const reply = await handleVoice(message, supabase, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
      if (reply) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, reply);
      }
      return new Response('OK', { status: 200 });
    }

    // Text messages only from here
    if (!message.text) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "Got your message but I can't process this type yet. Try sending text, photos, documents, or voice messages.");
      return new Response('OK', { status: 200 });
    }

    const userText = message.text.trim();
    console.log('[AYN-WEBHOOK] Message received:', userText.slice(0, 100));

    // All messages go through the AI — no slash command interception

    // Gather system context for AI
    const context = await gatherSystemContext(supabase);
    const conversationHistory = await getConversationHistory(supabase);
    console.log('[AYN-MEMORY] Loaded conversation history:', conversationHistory.length, 'entries');

    // Sanitize input
    let sanitizedInput = sanitizeUserPrompt(userText);

    // Capture reply-to context from Telegram swipe-replies
    if (message.reply_to_message?.text) {
      sanitizedInput = `[Replying to AYN's message: "${message.reply_to_message.text.slice(0, 500)}"]\n\n${sanitizedInput}`;
    }
    if (detectInjectionAttempt(userText)) {
      await supabase.from('security_logs').insert({
        action: 'prompt_injection_attempt',
        details: { input_preview: userText.slice(0, 200), function: 'ayn-telegram-webhook' },
        severity: 'high',
      });
    }

    // ─── Auto-execute confirmations ───
    const confirmPatterns = /^(yes|yep|yeah|yea|go ahead|do it|confirm|send it|confirmed|approve|approved|go for it|ship it|send|sure|ok send|yes send|confirm send)/i;
    if (confirmPatterns.test(userText.trim())) {
      // Check if there's a pending action in the most recent ayn_mind entry
      const { data: recentMind } = await supabase
        .from('ayn_mind')
        .select('context, content')
        .eq('type', 'telegram_ayn')
        .order('created_at', { ascending: false })
        .limit(1);

      const pending = recentMind?.[0]?.context?.pending_action;
      if (pending && typeof pending === 'object' && pending.type === 'awaiting_confirmation' && pending.lead_id) {
        // Execute the pending action directly
        try {
          const actionResult = await executeAction(
            pending.action || 'send_outreach',
            pending.lead_id,
            supabase, supabaseUrl, supabaseKey
          );
          const confirmMsg = actionResult
            ? `✅ ${pending.summary || 'Done'} — ${actionResult}`
            : `✅ ${pending.summary || 'Executed'} — action completed.`;
          
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, confirmMsg);
          
          // Log both sides
          console.log('[AYN-MEMORY] Saving auto-confirm exchange...');
          const { error: confirmInsertErr } = await supabase.from('ayn_mind').insert([
            { type: 'telegram_admin', content: userText.slice(0, 4000), context: { source: 'telegram' }, shared_with_admin: true },
            { type: 'telegram_ayn', content: confirmMsg.slice(0, 4000), context: { source: 'telegram', actions: [actionResult], pending_action: null }, shared_with_admin: true },
          ]);
          if (confirmInsertErr) {
            console.error('[AYN-MEMORY] Batch insert failed for confirm:', confirmInsertErr.message);
            await supabase.from('ayn_mind').insert({ type: 'telegram_admin', content: userText.slice(0, 4000), context: { source: 'telegram' }, shared_with_admin: true });
            await supabase.from('ayn_mind').insert({ type: 'telegram_ayn', content: confirmMsg.slice(0, 4000), context: { source: 'telegram', actions: [actionResult], pending_action: null }, shared_with_admin: true });
          } else {
            console.log('[AYN-MEMORY] Auto-confirm exchange saved successfully');
          }
          
          return new Response('OK', { status: 200 });
        } catch (e) {
          console.error('Auto-execute confirmation failed:', e);
          // Fall through to AI if execution fails
        }
      }
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
    const salesActionLeadIds: string[] = []; // Track lead_ids from sales actions

    while ((actionMatch = actionRegex.exec(reply)) !== null) {
      const [, actionType, actionParams] = actionMatch;
      // Track lead_ids from sales-related actions
      if (['draft_outreach', 'send_outreach', 'approve_lead', 'follow_up'].includes(actionType) && actionParams) {
        salesActionLeadIds.push(actionParams);
      }
      const result = await executeAction(actionType, actionParams || '', supabase, supabaseUrl, supabaseKey);
      if (result) executedActions.push(result);
    }

    let cleanReply = reply.replace(/\[ACTION:[^\]]+\]/g, '').trim();
    if (executedActions.length > 0) {
      cleanReply += `\n\n✅ Done: ${executedActions.join(', ')}`;
    }

    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, cleanReply);

    // Log conversation + activity
    // Detect if AYN is asking for confirmation and extract actionable data
    const replyLower = cleanReply.toLowerCase();
    const isAskingConfirmation = replyLower.includes('should i go ahead') || 
      replyLower.includes('go ahead?') || 
      replyLower.includes('want me to') ||
      replyLower.includes('confirm?') ||
      replyLower.includes('shall i') ||
      replyLower.includes('want me to send') ||
      replyLower.includes('ready to send');

    let pendingAction: any = null;
    if (isAskingConfirmation) {
      // Use lead_ids captured directly from ACTION tags
      let detectedLeadId: string | null = salesActionLeadIds.length > 0 ? salesActionLeadIds[0] : null;
      let detectedAction = 'send_outreach';
      let detectedSummary = '';

      // Fallback: check executed action text and reply for UUIDs
      if (!detectedLeadId) {
        for (const action of executedActions) {
          const leadMatch = action.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
          if (leadMatch) { detectedLeadId = leadMatch[1]; break; }
        }
      }
      if (!detectedLeadId) {
        const replyLeadMatch = reply.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (replyLeadMatch) detectedLeadId = replyLeadMatch[1];
      }

      // Extract company name for summary
      const companyMatch = cleanReply.match(/(?:to|for|email(?:ing)?)\s+([A-Z][a-zA-Z0-9\s&.]+?)(?:\s*[\(\[\n,\-—]|\.?\s*(?:Here|The|I |about|regarding))/);
      detectedSummary = companyMatch ? `Send outreach to ${companyMatch[1].trim()}` : 'Send pending outreach email';

      // Detect action type from context
      if (replyLower.includes('follow-up') || replyLower.includes('follow up')) detectedAction = 'follow_up';
      if (replyLower.includes('draft')) detectedAction = 'send_outreach';

      pendingAction = {
        type: 'awaiting_confirmation',
        action: detectedAction,
        lead_id: detectedLeadId,
        summary: detectedSummary,
      };
    }

    console.log('[AYN-MEMORY] Saving conversation exchange...');
    console.log('[AYN-MEMORY] Admin msg length:', userText.length, '| AYN reply length:', cleanReply.length);
    const { error: mainInsertErr } = await supabase.from('ayn_mind').insert([
      { type: 'telegram_admin', content: userText.slice(0, 4000), context: { source: 'telegram' }, shared_with_admin: true },
      { type: 'telegram_ayn', content: cleanReply.slice(0, 4000), context: { source: 'telegram', actions: executedActions, pending_action: pendingAction }, shared_with_admin: true },
    ]);
    if (mainInsertErr) {
      console.error('[AYN-MEMORY] Batch insert FAILED:', mainInsertErr.message);
      // Fallback: try individual inserts
      const { error: e1 } = await supabase.from('ayn_mind').insert({ type: 'telegram_admin', content: userText.slice(0, 4000), context: { source: 'telegram' }, shared_with_admin: true });
      if (e1) console.error('[AYN-MEMORY] Individual admin insert failed:', e1.message);
      else console.log('[AYN-MEMORY] Individual admin insert OK');
      const { error: e2 } = await supabase.from('ayn_mind').insert({ type: 'telegram_ayn', content: cleanReply.slice(0, 4000), context: { source: 'telegram', actions: executedActions, pending_action: pendingAction }, shared_with_admin: true });
      if (e2) console.error('[AYN-MEMORY] Individual AYN insert failed:', e2.message);
      else console.log('[AYN-MEMORY] Individual AYN insert OK');
    } else {
      console.log('[AYN-MEMORY] Conversation saved successfully');
    }

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

// ─── Handle photo messages (Vision AI) ───
async function handlePhoto(
  message: any, supabase: any, botToken: string, chatId: string
): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return "⚠️ Vision not available — LOVABLE_API_KEY not configured.";

  try {
    // Get the highest resolution photo
    const photo = message.photo[message.photo.length - 1];
    const fileId = photo.file_id;

    // Get file path from Telegram
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok) return "❌ Couldn't retrieve the image from Telegram.";

    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    // Download and convert to base64
    const imageRes = await fetch(fileUrl);
    const imageBuffer = await imageRes.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    const caption = message.caption || 'What do you see in this image? Provide actionable insights.';

    // Send to Gemini vision
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{
          role: 'system',
          content: 'You are AYN, analyzing an image sent by the founder on Telegram. Be concise, insightful, and actionable. If it\'s a screenshot of the app or dashboard, comment on UX/data. If it\'s anything else, describe what you see and offer your take.',
        }, {
          role: 'user',
          content: [
            { type: 'text', text: caption },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        }],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return "🧠 Rate limited — try again in a minute.";
      if (aiRes.status === 402) return "🧠 AI credits exhausted.";
      return "❌ Vision analysis failed.";
    }

    const aiData = await aiRes.json();
    const analysis = aiData.choices?.[0]?.message?.content?.trim() || "Couldn't analyze the image.";

    // Log activity
    await logAynActivity(supabase, 'vision_analysis', `Analyzed image: "${caption.slice(0, 80)}"`, {
      target_type: 'image',
      details: { caption, analysis_preview: analysis.slice(0, 200) },
      triggered_by: 'telegram_photo',
    });

    console.log('[AYN-MEMORY] Saving photo exchange...');
    const { error: photoInsertErr } = await supabase.from('ayn_mind').insert([
      { type: 'telegram_admin', content: `[Photo] ${caption.slice(0, 4000)}`, context: { source: 'telegram', type: 'photo' }, shared_with_admin: true },
      { type: 'telegram_ayn', content: analysis.slice(0, 4000), context: { source: 'telegram', type: 'vision_response' }, shared_with_admin: true },
    ]);
    if (photoInsertErr) {
      console.error('[AYN-MEMORY] Photo batch insert failed:', photoInsertErr.message);
      await supabase.from('ayn_mind').insert({ type: 'telegram_admin', content: `[Photo] ${caption.slice(0, 4000)}`, context: { source: 'telegram', type: 'photo' }, shared_with_admin: true });
      await supabase.from('ayn_mind').insert({ type: 'telegram_ayn', content: analysis.slice(0, 4000), context: { source: 'telegram', type: 'vision_response' }, shared_with_admin: true });
    } else {
      console.log('[AYN-MEMORY] Photo exchange saved successfully');
    }

    return analysis;
  } catch (e) {
    console.error('Vision AI error:', e);
    return `❌ Vision failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}

// ─── Handle document/file messages ───
const SUPPORTED_TEXT_EXTENSIONS = ['csv', 'txt', 'json', 'xml', 'md', 'html', 'yaml', 'yml', 'log'];
const SUPPORTED_BINARY_EXTENSIONS = ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'pptx'];
const ALL_SUPPORTED = [...SUPPORTED_TEXT_EXTENSIONS, ...SUPPORTED_BINARY_EXTENSIONS];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function handleDocument(
  message: any, supabase: any, botToken: string, chatId: string
): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return "⚠️ File analysis not available — LOVABLE_API_KEY not configured.";

  try {
    const doc = message.document;
    const fileName = doc.file_name || 'unknown';
    const fileSize = doc.file_size || 0;
    const caption = message.caption || '';

    if (fileSize > MAX_FILE_SIZE) {
      return `❌ File too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Max is 10MB.`;
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (!ALL_SUPPORTED.includes(ext)) {
      return `❌ Can't read .${ext} files yet. Supported: ${ALL_SUPPORTED.join(', ')}`;
    }

    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${doc.file_id}`);
    const fileData = await fileRes.json();
    if (!fileData.ok) return "❌ Couldn't retrieve the file from Telegram.";

    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const fileResponse = await fetch(fileUrl);

    const systemPrompt = `You are AYN, analyzing a file sent by the founder on Telegram. The file is "${fileName}". ${caption ? `They said: "${caption}"` : 'Analyze the content and provide actionable insights.'} Be concise and useful.`;
    let aiMessages: any[];

    if (SUPPORTED_TEXT_EXTENSIONS.includes(ext)) {
      let textContent = await fileResponse.text();
      if (textContent.length > 50000) {
        textContent = textContent.slice(0, 50000) + '\n\n... [truncated at 50,000 chars]';
      }
      const aiPrompt = caption || `Analyze this ${ext.toUpperCase()} file and give me the key takeaways.`;
      aiMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${aiPrompt}\n\nFile content (${fileName}):\n\`\`\`\n${textContent}\n\`\`\`` },
      ];
    } else {
      const buffer = await fileResponse.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const mimeMap: Record<string, string> = {
        pdf: 'application/pdf',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        doc: 'application/msword',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };
      const mimeType = mimeMap[ext] || 'application/octet-stream';
      const aiPrompt = caption || `Extract and analyze the content of this ${ext.toUpperCase()} file. Summarize key points.`;

      aiMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: [
          { type: 'text', text: aiPrompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ]},
      ];
    }

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages: aiMessages }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return "🧠 Rate limited — try again in a minute.";
      if (aiRes.status === 402) return "🧠 AI credits exhausted.";
      console.error('Document AI error:', aiRes.status, await aiRes.text());
      return "❌ File analysis failed.";
    }

    const aiData = await aiRes.json();
    const analysis = aiData.choices?.[0]?.message?.content?.trim() || "Couldn't analyze the file.";

    await logAynActivity(supabase, 'document_analysis', `Analyzed file: "${fileName}"`, {
      target_type: 'document',
      details: { fileName, fileSize, ext, caption, analysis_preview: analysis.slice(0, 200) },
      triggered_by: 'telegram_document',
    });

    await supabase.from('ayn_mind').insert([
      { type: 'telegram_admin', content: `[Document: ${fileName}] ${caption || '(no caption)'}`.slice(0, 4000), context: { source: 'telegram', type: 'document', fileName, ext, fileSize }, shared_with_admin: true },
      { type: 'telegram_ayn', content: analysis.slice(0, 4000), context: { source: 'telegram', type: 'document_response', fileName }, shared_with_admin: true },
    ]);

    return analysis;
  } catch (e) {
    console.error('Document handler error:', e);
    return `❌ File analysis failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}

// ─── Handle voice/audio messages ───
async function handleVoice(
  message: any, supabase: any, botToken: string, chatId: string
): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return "⚠️ Voice processing not available — LOVABLE_API_KEY not configured.";

  try {
    const voiceOrAudio = message.voice || message.audio;
    const fileId = voiceOrAudio.file_id;
    const duration = voiceOrAudio.duration || 0;
    const caption = message.caption || '';

    if (duration > 300) {
      return "❌ Voice message too long (max 5 minutes). Send a shorter one.";
    }

    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok) return "❌ Couldn't retrieve the audio from Telegram.";

    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const audioRes = await fetch(fileUrl);
    const audioBuffer = await audioRes.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    const mimeType = filePath.endsWith('.oga') || filePath.endsWith('.ogg')
      ? 'audio/ogg'
      : filePath.endsWith('.mp3') ? 'audio/mpeg'
      : filePath.endsWith('.m4a') ? 'audio/mp4'
      : 'audio/ogg';

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are AYN, receiving a voice message from the founder on Telegram. First transcribe what they said, then respond naturally. Format: start with "🎙️ [transcription]" then your response below.' },
          { role: 'user', content: [
            { type: 'text', text: caption || 'Transcribe this voice message and respond to it.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Audio}` } },
          ]},
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return "🧠 Rate limited — try again in a minute.";
      if (aiRes.status === 402) return "🧠 AI credits exhausted.";
      console.error('Voice AI error:', aiRes.status, await aiRes.text());
      return "❌ Voice processing failed.";
    }

    const aiData = await aiRes.json();
    const response = aiData.choices?.[0]?.message?.content?.trim() || "Couldn't process the voice message.";

    await logAynActivity(supabase, 'voice_analysis', `Processed voice message (${duration}s)`, {
      target_type: 'voice',
      details: { duration, response_preview: response.slice(0, 200) },
      triggered_by: 'telegram_voice',
    });

    await supabase.from('ayn_mind').insert([
      { type: 'telegram_admin', content: `[Voice message: ${duration}s] ${caption || ''}`.slice(0, 4000), context: { source: 'telegram', type: 'voice', duration }, shared_with_admin: true },
      { type: 'telegram_ayn', content: response.slice(0, 4000), context: { source: 'telegram', type: 'voice_response' }, shared_with_admin: true },
    ]);

    return response;
  } catch (e) {
    console.error('Voice handler error:', e);
    return `❌ Voice processing failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}

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
  if (cmd === '/webhooks') return cmdWebhooks(supabase);
  if (cmd === '/weekly_report') return cmdWeeklyReport(supabase);
  if (cmd.startsWith('/user ')) return cmdUser(text, supabase);
  if (cmd.startsWith('/grant ')) return cmdGrant(text, supabase);
  if (cmd.startsWith('/revoke ')) return cmdRevoke(text, supabase);
  if (cmd.startsWith('/set_unlimited ')) return cmdSetUnlimited(text, supabase);
  if (cmd.startsWith('/query ')) return cmdQuery(text, supabase);
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
    .select('type, content, context, created_at')
    .in('type', ['telegram_admin', 'telegram_ayn'])
    .order('created_at', { ascending: true })
    .limit(80);

  if (!exchanges?.length) return [];

  return exchanges.map((entry: any) => {
    let content = entry.content;
    const pending = entry.context?.pending_action;
    if (pending && typeof pending === 'object' && pending.type === 'awaiting_confirmation') {
      content += `\n[PENDING: Waiting for confirmation to ${pending.summary || pending.action || 'execute action'}${pending.lead_id ? ` (lead_id: ${pending.lead_id})` : ''}]`;
    } else if (pending === 'awaiting_confirmation') {
      content += `\n[Pending action: awaiting_confirmation]`;
    }
    return { role: entry.type === 'telegram_admin' ? 'user' : 'assistant', content };
  });
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
    supabase.from('messages').select('content, sender, mode_used, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('message_ratings').select('rating, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('beta_feedback').select('overall_rating, improvement_suggestions, submitted_at').order('submitted_at', { ascending: false }).limit(3),
    supabase.from('email_logs').select('email_type, recipient_email, status, sent_at').order('sent_at', { ascending: false }).limit(5),
    supabase.from('security_logs').select('action, severity, created_at').order('created_at', { ascending: false }).limit(3),
    supabase.from('engineering_activity').select('activity_type, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

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
        return await cmdReplyApp(`/reply_app ${appId} ${msg}`, supabase, supabaseUrl, supabaseKey);
      }
      case 'reply_contact': {
        const colonIdx = params.indexOf(':');
        if (colonIdx === -1) return null;
        const contactId = params.slice(0, colonIdx);
        const msg = params.slice(colonIdx + 1);
        return await cmdReplyContact(`/reply_contact ${contactId} ${msg}`, supabase, supabaseUrl, supabaseKey);
      }
      case 'send_email': {
        const firstColon = params.indexOf(':');
        if (firstColon === -1) return null;
        const to = params.slice(0, firstColon);
        const rest = params.slice(firstColon + 1);
        const secondColon = rest.indexOf(':');
        if (secondColon === -1) return null;
        const subject = rest.slice(0, secondColon);
        const body = rest.slice(secondColon + 1);
        return await cmdEmail(`/email ${to} ${subject} | ${body}`, supabase);
      }
      case 'delete_ticket': {
        return await cmdDelete(`/delete_ticket ${params}`, supabase);
      }
      case 'clear_errors': {
        return await cmdClearErrors(`/clear_errors ${params}`, supabase);
      }
      case 'grant_access': {
        return await cmdGrant(`/grant ${params}`, supabase);
      }
      case 'revoke_access': {
        return await cmdRevoke(`/revoke ${params}`, supabase);
      }
      case 'set_unlimited': {
        return await cmdSetUnlimited(`/set_unlimited ${params}`, supabase);
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
      case 'delete_app': {
        return await cmdDelete(`/delete_app ${params}`, supabase);
      }
      case 'delete_contact': {
        return await cmdDelete(`/delete_contact ${params}`, supabase);
      }
      case 'delete_message': {
        return `🔒 User messages are protected and cannot be deleted. You can read them with [ACTION:read_messages:10] to monitor and improve AYN.`;
      }
      case 'approve_app': {
        const { data } = await supabase.from('service_applications')
          .select('id, full_name').ilike('id', `${params}%`).limit(1);
        if (!data?.length) return `No application found`;
        await supabase.from('service_applications')
          .update({ status: 'approved' }).eq('id', data[0].id);
        await logAynActivity(supabase, 'application_approved',
          `Approved application from ${data[0].full_name}`, {
          target_id: data[0].id, target_type: 'application',
          triggered_by: 'admin_chat',
        });
        return `Approved application from ${data[0].full_name}`;
      }
      case 'reject_app': {
        const { data } = await supabase.from('service_applications')
          .select('id, full_name').ilike('id', `${params}%`).limit(1);
        if (!data?.length) return `No application found`;
        await supabase.from('service_applications')
          .update({ status: 'rejected' }).eq('id', data[0].id);
        await logAynActivity(supabase, 'application_rejected',
          `Rejected application from ${data[0].full_name}`, {
          target_id: data[0].id, target_type: 'application',
          triggered_by: 'admin_chat',
        });
        return `Rejected application from ${data[0].full_name}`;
      }
      // ─── Bulk delete actions ───
      case 'delete_all_apps': {
        const { count } = await supabase.from('service_applications')
          .select('*', { count: 'exact', head: true });
        // Delete related replies first, then applications
        await supabase.from('application_replies').delete().gte('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('service_applications').delete().gte('id', '00000000-0000-0000-0000-000000000000');
        if (error) return `Failed to delete applications: ${error.message}`;
        await logAynActivity(supabase, 'bulk_delete', `Deleted all ${count || 0} applications`, {
          target_type: 'service_applications', triggered_by: 'admin_chat',
        });
        return `Deleted ${count || 0} applications`;
      }
      case 'delete_all_tickets': {
        const { count } = await supabase.from('support_tickets')
          .select('*', { count: 'exact', head: true });
        await supabase.from('support_ticket_replies').delete().gte('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('ticket_messages').delete().gte('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('support_tickets').delete().gte('id', '00000000-0000-0000-0000-000000000000');
        if (error) return `Failed to delete tickets: ${error.message}`;
        await logAynActivity(supabase, 'bulk_delete', `Deleted all ${count || 0} tickets`, {
          target_type: 'support_tickets', triggered_by: 'admin_chat',
        });
        return `Deleted ${count || 0} tickets`;
      }
      case 'delete_all_contacts': {
        const { count } = await supabase.from('contact_messages')
          .select('*', { count: 'exact', head: true });
        const { error } = await supabase.from('contact_messages').delete().gte('id', '00000000-0000-0000-0000-000000000000');
        if (error) return `Failed to delete contacts: ${error.message}`;
        await logAynActivity(supabase, 'bulk_delete', `Deleted all ${count || 0} contact messages`, {
          target_type: 'contact_messages', triggered_by: 'admin_chat',
        });
        return `Deleted ${count || 0} contact messages`;
      }
      case 'delete_all_messages': {
        return `🔒 User messages are protected and cannot be deleted. You can read them with [ACTION:read_messages:50] to monitor and improve AYN.`;
      }
      // ─── Data-fetching actions ───
      case 'list_apps': {
        return await cmdApplications(supabase);
      }
      case 'list_tickets': {
        return await cmdTickets(supabase);
      }
      case 'list_contacts': {
        return await cmdContacts(supabase);
      }
      case 'check_health': {
        return await cmdHealth(supabase);
      }
      case 'get_stats': {
        return await cmdStats(supabase);
      }
      case 'get_errors': {
        return await cmdErrors(supabase);
      }
      // ─── Sales actions ───
      case 'prospect_company': {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'prospect', url: params }),
          });
          const data = await res.json();
          if (data.success) {
            const a = data.analysis;
            return `Prospected ${a?.company_name || params}:\n• Industry: ${a?.industry || '?'}\n• Quality: ${a?.website_quality || '?'}/10\n• Pain points: ${a?.pain_points?.join(', ') || 'none'}\n• Recommended: ${a?.recommended_services?.join(', ') || 'general'}\n• Lead ID: ${data.lead_id?.slice(0, 8)}`;
          }
          return data.message || data.error || 'Prospect failed';
        } catch (e) { return `Prospect failed: ${e instanceof Error ? e.message : 'error'}`; }
      }
      case 'draft_outreach': {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'draft_email', lead_id: params }),
          });
          const data = await res.json();
          if (data.success && data.draft) {
            return `📧 Draft for review:\nSubject: ${data.draft.subject}\n\n${data.draft.plain_text || data.draft.html_body?.replace(/<[^>]*>/g, '') || 'No content'}\n\nApprove? [ACTION:approve_lead:${params}] then [ACTION:send_outreach:${params}]`;
          }
          return data.error || 'Draft failed';
        } catch (e) { return `Draft failed: ${e instanceof Error ? e.message : 'error'}`; }
      }
      case 'send_outreach': {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'send_email', lead_id: params }),
          });
          const data = await res.json();
          return data.success ? `Email sent to lead ${params.slice(0, 8)}` : (data.error || 'Send failed');
        } catch (e) { return `Send failed: ${e instanceof Error ? e.message : 'error'}`; }
      }
      case 'approve_lead': {
        await supabase.from('ayn_sales_pipeline').update({ admin_approved: true }).eq('id', params);
        await logAynActivity(supabase, 'sales_lead_approved', `Approved lead ${params.slice(0, 8)} for outreach`, {
          target_id: params, target_type: 'sales_lead', triggered_by: 'admin_chat',
        });
        return `Lead ${params.slice(0, 8)} approved for outreach`;
      }
      case 'follow_up': {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'follow_up', lead_id: params }),
          });
          const data = await res.json();
          if (data.needs_approval) {
            return `📧 Follow-up draft:\nSubject: ${data.draft?.subject}\n\n${data.draft?.plain_text || 'See draft'}\n\nApprove to send?`;
          }
          return data.success ? `Follow-up sent to lead ${params.slice(0, 8)}` : (data.error || 'Follow-up failed');
        } catch (e) { return `Follow-up failed: ${e instanceof Error ? e.message : 'error'}`; }
      }
      case 'pipeline_status': {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'pipeline_status' }),
          });
          const data = await res.json();
          if (!data.leads?.length) return '📊 Sales pipeline is empty. No leads yet.';
          let msg = `📊 Pipeline: ${data.total} leads\n`;
          for (const [status, count] of Object.entries(data.stats || {})) {
            msg += `• ${status}: ${count}\n`;
          }
          if (data.due_follow_ups > 0) msg += `\n⏰ ${data.due_follow_ups} follow-up(s) due`;
          msg += '\n\nRecent:\n';
          msg += data.leads.slice(0, 5).map((l: any) =>
            `• ${l.company} [${l.status}] ${l.emails_sent}📧 ${l.approved ? '✅' : '⏳'} ID:${l.id.slice(0, 8)}`
          ).join('\n');
          return msg;
        } catch (e) { return `Pipeline check failed: ${e instanceof Error ? e.message : 'error'}`; }
      }
      case 'search_leads': {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/ayn-sales-outreach`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'search_leads', search_query: params }),
          });
          const data = await res.json();
          if (data.success) {
            return `🔍 Found ${data.prospected?.length || 0} leads for "${params}":\n${data.prospected?.map((p: any) => `• ${p.analysis?.company_name || p.url} (ID: ${p.lead_id?.slice(0, 8)})`).join('\n') || 'None'}`;
          }
          return data.error || 'Search failed';
        } catch (e) { return `Search failed: ${e instanceof Error ? e.message : 'error'}`; }
      }
      default:
        return `Unknown action: ${type}`;
    }
  } catch (e) {
    console.error(`Action ${type} failed:`, e);
    return `Action ${type} failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}
