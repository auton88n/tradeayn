/**
 * AYN Telegram Command Handlers
 * All slash commands for managing the platform via Telegram.
 */
import { logAynActivity } from "../_shared/aynLogger.ts";

type Supabase = ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.56.0").createClient>;

// ─── /help ───
export async function cmdHelp(): Promise<string> {
  return `🤖 AYN Commands:

📊 Status:
/health — System health check
/tickets — Open/pending ticket counts
/stats — User stats
/errors — Recent errors
/logs — My recent activity log

📋 Data:
/applications — Recent service applications
/contacts — Recent contact messages
/users — Recent users
/messages — Recent user chat messages
/feedback — User ratings & beta feedback
/emails — Recent system emails
/security — Recent security events
/visitors — Today's visitor analytics
/twitter — Twitter post performance

💬 Actions:
/reply_app [id] [message] — Reply to application
/reply_contact [id] [message] — Reply to contact
/email [to] [subject] | [body] — Send email

🗑️ Delete:
/delete_ticket [id]
/delete_message [id]
/delete_app [id]
/delete_contact [id]
/clear_errors [hours] — Clear old errors

🧠 AI:
/think — Force a thinking cycle
/unblock [user_id] — Unblock a user

Or just chat with me naturally!`;
}

// ─── /health ───
export async function cmdHealth(supabase: Supabase): Promise<string> {
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

// ─── /tickets ───
export async function cmdTickets(supabase: Supabase): Promise<string> {
  const [{ count: open }, { count: pending }] = await Promise.all([
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  return `🎫 Tickets\n• Open: ${open || 0}\n• Pending: ${pending || 0}`;
}

// ─── /stats ───
export async function cmdStats(supabase: Supabase): Promise<string> {
  const [{ count: total }, { count: active }] = await Promise.all([
    supabase.from('access_grants').select('*', { count: 'exact', head: true }),
    supabase.from('access_grants').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ]);
  return `👥 Users: ${active || 0} active / ${total || 0} total`;
}

// ─── /errors ───
export async function cmdErrors(supabase: Supabase): Promise<string> {
  const { data: recentErrors } = await supabase
    .from('error_logs')
    .select('error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!recentErrors?.length) return '✅ No recent errors!';

  const errorList = recentErrors.map((e: any, i: number) => {
    const ago = Math.round((Date.now() - new Date(e.created_at!).getTime()) / 60000);
    return `${i + 1}. ${e.error_message.slice(0, 80)} (${ago}m ago)`;
  }).join('\n');
  return `⚠️ Recent Errors:\n${errorList}`;
}

// ─── /logs ───
export async function cmdLogs(supabase: Supabase): Promise<string> {
  const { data: logs } = await supabase
    .from('ayn_activity_log')
    .select('action_type, summary, triggered_by, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!logs?.length) return '📝 No activity logged yet.';

  const list = logs.map((l: any, i: number) => {
    const ago = Math.round((Date.now() - new Date(l.created_at).getTime()) / 60000);
    const unit = ago >= 60 ? `${Math.round(ago / 60)}h` : `${ago}m`;
    return `${i + 1}. [${l.action_type}] ${l.summary.slice(0, 100)} (${unit} ago)`;
  }).join('\n');
  return `📝 Recent AYN Activity:\n${list}`;
}

// ─── /applications ───
export async function cmdApplications(supabase: Supabase): Promise<string> {
  const { data: apps } = await supabase
    .from('service_applications')
    .select('id, full_name, service_type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!apps?.length) return '📋 No applications found.';

  const list = apps.map((a: any, i: number) => {
    const ago = Math.round((Date.now() - new Date(a.created_at).getTime()) / 3600000);
    return `${i + 1}. ${a.full_name} — ${a.service_type} [${a.status}] (${ago}h ago)\n   ID: ${a.id.slice(0, 8)}`;
  }).join('\n');
  return `📋 Recent Applications:\n${list}\n\nReply: /reply_app [id] [message]`;
}

// ─── /contacts ───
export async function cmdContacts(supabase: Supabase): Promise<string> {
  const { data: msgs } = await supabase
    .from('contact_messages')
    .select('id, name, email, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!msgs?.length) return '📬 No contact messages found.';

  const list = msgs.map((m: any, i: number) => {
    const ago = Math.round((Date.now() - new Date(m.created_at).getTime()) / 3600000);
    return `${i + 1}. ${m.name} (${m.email.slice(0, 20)}...) [${m.status}] (${ago}h ago)\n   "${m.message.slice(0, 60)}..."\n   ID: ${m.id.slice(0, 8)}`;
  }).join('\n');
  return `📬 Contact Messages:\n${list}\n\nReply: /reply_contact [id] [message]`;
}

// ─── /users ───
export async function cmdUsers(supabase: Supabase): Promise<string> {
  const { data: users } = await supabase
    .from('profiles')
    .select('user_id, company_name, contact_person, account_status, last_login, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!users?.length) return '👥 No users found.';

  const list = users.map((u: any, i: number) => {
    const name = u.contact_person || u.company_name || 'Unknown';
    const status = u.account_status || 'active';
    return `${i + 1}. ${name} [${status}]\n   ID: ${u.user_id.slice(0, 8)}`;
  }).join('\n');
  return `👥 Recent Users:\n${list}`;
}

// ─── /messages ───
export async function cmdMessages(supabase: Supabase): Promise<string> {
  const { data: msgs } = await supabase
    .from('messages')
    .select('content, sender, mode_used, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!msgs?.length) return '💬 No recent messages.';

  const list = msgs.map((m: any, i: number) => {
    const ago = Math.round((Date.now() - new Date(m.created_at).getTime()) / 60000);
    const unit = ago >= 60 ? `${Math.round(ago / 60)}h` : `${ago}m`;
    return `${i + 1}. [${m.sender}${m.mode_used ? '/' + m.mode_used : ''}] "${m.content.slice(0, 60)}${m.content.length > 60 ? '…' : ''}" (${unit} ago)`;
  }).join('\n');
  return `💬 Recent Messages:\n${list}`;
}

// ─── /feedback ───
export async function cmdFeedback(supabase: Supabase): Promise<string> {
  const [{ data: ratings }, { data: beta }] = await Promise.all([
    supabase.from('message_ratings').select('rating, message_preview, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('beta_feedback').select('overall_rating, improvement_suggestions, submitted_at').order('submitted_at', { ascending: false }).limit(5),
  ]);

  let result = '';

  if (ratings?.length) {
    const pos = ratings.filter((r: any) => r.rating === 'positive').length;
    const neg = ratings.filter((r: any) => r.rating === 'negative').length;
    result += `👍 Ratings: ${pos} positive / ${neg} negative (last ${ratings.length})\n`;
    const recent = ratings.slice(0, 3).map((r: any) =>
      `  ${r.rating === 'positive' ? '👍' : '👎'} "${r.message_preview.slice(0, 50)}…"`
    ).join('\n');
    result += recent;
  } else {
    result += '👍 No message ratings yet.';
  }

  if (beta?.length) {
    result += `\n\n🧪 Beta Feedback:\n`;
    result += beta.map((b: any, i: number) =>
      `${i + 1}. ⭐${b.overall_rating || '?'}/5 — "${(b.improvement_suggestions || 'No suggestion').slice(0, 80)}"`
    ).join('\n');
  }

  return result;
}

// ─── /emails ───
export async function cmdEmails(supabase: Supabase): Promise<string> {
  const { data: emails } = await supabase
    .from('email_logs')
    .select('email_type, recipient_email, status, sent_at')
    .order('sent_at', { ascending: false })
    .limit(10);

  if (!emails?.length) return '📧 No recent emails.';

  const list = emails.map((e: any, i: number) => {
    const ago = e.sent_at ? Math.round((Date.now() - new Date(e.sent_at).getTime()) / 60000) : 0;
    const unit = ago >= 60 ? `${Math.round(ago / 60)}h` : `${ago}m`;
    const recipient = e.recipient_email ? e.recipient_email.slice(0, 20) + '…' : 'unknown';
    return `${i + 1}. [${e.email_type}] → ${recipient} (${e.status || '?'}, ${unit} ago)`;
  }).join('\n');
  return `📧 Recent Emails:\n${list}`;
}

// ─── /security ───
export async function cmdSecurity(supabase: Supabase): Promise<string> {
  const { data: logs } = await supabase
    .from('security_logs')
    .select('action, severity, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!logs?.length) return '🔒 No recent security events. All clear.';

  const list = logs.map((l: any, i: number) => {
    const ago = Math.round((Date.now() - new Date(l.created_at).getTime()) / 60000);
    const unit = ago >= 60 ? `${Math.round(ago / 60)}h` : `${ago}m`;
    const sev = l.severity === 'high' ? '🔴' : l.severity === 'medium' ? '🟡' : '🟢';
    return `${i + 1}. ${sev} ${l.action} (${unit} ago)`;
  }).join('\n');
  return `🔒 Security Events:\n${list}`;
}

// ─── /visitors ───
export async function cmdVisitors(supabase: Supabase): Promise<string> {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const { data: visits } = await supabase
    .from('visitor_analytics')
    .select('page_url, created_at')
    .gte('created_at', todayStart.toISOString());

  if (!visits?.length) return '👀 No visitors recorded today yet.';

  const uniquePages = new Set(visits.map((v: any) => v.page_url));
  const topPages: Record<string, number> = {};
  visits.forEach((v: any) => {
    const page = v.page_url || '/';
    topPages[page] = (topPages[page] || 0) + 1;
  });
  const sorted = Object.entries(topPages).sort((a, b) => b[1] - a[1]).slice(0, 5);

  let result = `👀 Today's Visitors:\n• ${visits.length} page views\n• ${uniquePages.size} unique pages\n\nTop pages:\n`;
  result += sorted.map(([page, count]) => `  ${page} — ${count} views`).join('\n');
  return result;
}

// ─── /twitter ───
export async function cmdTwitter(supabase: Supabase): Promise<string> {
  const { data: posts } = await supabase
    .from('twitter_posts')
    .select('content, status, engagement_score, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!posts?.length) return '🐦 No twitter posts found.';

  const list = posts.map((p: any, i: number) => {
    const ago = Math.round((Date.now() - new Date(p.created_at).getTime()) / 3600000);
    return `${i + 1}. "${p.content?.slice(0, 60)}…" [${p.status}] ${p.engagement_score ? `📈${p.engagement_score}` : ''} (${ago}h ago)`;
  }).join('\n');
  return `🐦 Recent Tweets:\n${list}`;
}

// ─── /reply_app ───
export async function cmdReplyApp(
  text: string, supabase: Supabase, supabaseUrl: string, supabaseKey: string
): Promise<string> {
  const parts = text.replace(/^\/reply_app\s+/i, '').split(/\s+/);
  const idFragment = parts[0];
  const message = parts.slice(1).join(' ');
  if (!idFragment || !message) return '❌ Usage: /reply_app [id] [message]';

  const { data: apps } = await supabase
    .from('service_applications')
    .select('id, full_name, email, service_type')
    .ilike('id', `${idFragment}%`)
    .limit(1);

  if (!apps?.length) return `❌ No application found starting with "${idFragment}"`;
  const app = apps[0];

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-reply-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicationId: app.id,
        recipientEmail: app.email,
        recipientName: app.full_name,
        subject: `Re: Your ${app.service_type} Application`,
        message,
        serviceType: app.service_type,
      }),
    });

    const result = await res.json();

    await logAynActivity(supabase, 'application_replied', `Replied to ${app.full_name}: "${message.slice(0, 80)}"`, {
      target_id: app.id,
      target_type: 'application',
      details: { recipient: app.email, message, email_sent: result.success },
      triggered_by: 'telegram_command',
    });

    return result.success
      ? `✅ Replied to ${app.full_name} (${app.email}) about their ${app.service_type} application.`
      : `⚠️ Reply saved but email failed: ${result.error}`;
  } catch (e) {
    return `❌ Failed to send reply: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}

// ─── /reply_contact ───
export async function cmdReplyContact(
  text: string, supabase: Supabase, supabaseUrl: string, supabaseKey: string
): Promise<string> {
  const parts = text.replace(/^\/reply_contact\s+/i, '').split(/\s+/);
  const idFragment = parts[0];
  const message = parts.slice(1).join(' ');
  if (!idFragment || !message) return '❌ Usage: /reply_contact [id] [message]';

  const { data: msgs } = await supabase
    .from('contact_messages')
    .select('id, name, email')
    .ilike('id', `${idFragment}%`)
    .limit(1);

  if (!msgs?.length) return `❌ No contact message found starting with "${idFragment}"`;
  const contact = msgs[0];

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return '❌ RESEND_API_KEY not configured';

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AYN <info@aynn.io>',
        to: [contact.email],
        subject: `Re: Your message to AYN`,
        html: `<p>Hi ${contact.name},</p><p>${message.replace(/\n/g, '<br>')}</p><p>Best regards,<br>The AYN Team</p>`,
      }),
    });

    const emailSent = emailRes.ok;
    await supabase.from('contact_messages').update({ status: 'replied' }).eq('id', contact.id);

    await logAynActivity(supabase, 'contact_replied', `Replied to ${contact.name}: "${message.slice(0, 80)}"`, {
      target_id: contact.id,
      target_type: 'contact_message',
      details: { recipient: contact.email, message, email_sent: emailSent },
      triggered_by: 'telegram_command',
    });

    return emailSent
      ? `✅ Replied to ${contact.name} (${contact.email}).`
      : `⚠️ Status updated but email may have failed.`;
  } catch (e) {
    return `❌ Failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}

// ─── /email ───
export async function cmdEmail(text: string, supabase: Supabase): Promise<string> {
  const afterCmd = text.replace(/^\/email\s+/i, '');
  const spaceIdx = afterCmd.indexOf(' ');
  if (spaceIdx === -1) return '❌ Usage: /email [to] [subject] | [body]';
  const to = afterCmd.slice(0, spaceIdx);
  const rest = afterCmd.slice(spaceIdx + 1);
  const pipeIdx = rest.indexOf('|');
  if (pipeIdx === -1) return '❌ Usage: /email [to] [subject] | [body]';
  const subject = rest.slice(0, pipeIdx).trim();
  const body = rest.slice(pipeIdx + 1).trim();

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return '❌ RESEND_API_KEY not configured';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AYN <info@aynn.io>',
        to: [to],
        subject,
        html: `<p>${body.replace(/\n/g, '<br>')}</p><p>— AYN Team</p>`,
      }),
    });

    await logAynActivity(supabase, 'email_sent', `Sent email to ${to}: "${subject}"`, {
      target_type: 'email',
      details: { to, subject, body, success: res.ok },
      triggered_by: 'telegram_command',
    });

    return res.ok ? `✅ Email sent to ${to}` : `❌ Email failed to send`;
  } catch (e) {
    return `❌ Failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}

// ─── Delete commands ───
export async function cmdDelete(
  text: string, supabase: Supabase
): Promise<string> {
  const cmd = text.toLowerCase();

  if (cmd.startsWith('/delete_ticket ')) {
    const id = text.slice(15).trim();
    const { data } = await supabase.from('support_tickets').select('id, subject').ilike('id', `${id}%`).limit(1);
    if (!data?.length) return `❌ No ticket found starting with "${id}"`;
    await supabase.from('support_tickets').delete().eq('id', data[0].id);
    await logAynActivity(supabase, 'ticket_deleted', `Deleted ticket: ${data[0].subject || data[0].id}`, {
      target_id: data[0].id, target_type: 'ticket',
      details: { subject: data[0].subject },
      triggered_by: 'telegram_command',
    });
    return `🗑️ Deleted ticket ${data[0].id.slice(0, 8)}`;
  }

  if (cmd.startsWith('/delete_message ')) {
    const id = text.slice(16).trim();
    const { data } = await supabase.from('messages').select('id, content').ilike('id', `${id}%`).limit(1);
    if (!data?.length) return `❌ No message found starting with "${id}"`;
    await supabase.from('messages').delete().eq('id', data[0].id);
    await logAynActivity(supabase, 'message_deleted', `Deleted message: "${data[0].content.slice(0, 50)}"`, {
      target_id: data[0].id, target_type: 'message',
      details: { content_preview: data[0].content.slice(0, 200) },
      triggered_by: 'telegram_command',
    });
    return `🗑️ Deleted message ${data[0].id.slice(0, 8)}`;
  }

  if (cmd.startsWith('/delete_app ')) {
    const id = text.slice(12).trim();
    const { data } = await supabase.from('service_applications').select('id, full_name, service_type').ilike('id', `${id}%`).limit(1);
    if (!data?.length) return `❌ No application found starting with "${id}"`;
    await supabase.from('service_applications').delete().eq('id', data[0].id);
    await logAynActivity(supabase, 'application_deleted', `Deleted application from ${data[0].full_name}`, {
      target_id: data[0].id, target_type: 'application',
      details: { full_name: data[0].full_name, service_type: data[0].service_type },
      triggered_by: 'telegram_command',
    });
    return `🗑️ Deleted application from ${data[0].full_name}`;
  }

  if (cmd.startsWith('/delete_contact ')) {
    const id = text.slice(16).trim();
    const { data } = await supabase.from('contact_messages').select('id, name, message').ilike('id', `${id}%`).limit(1);
    if (!data?.length) return `❌ No contact message found starting with "${id}"`;
    await supabase.from('contact_messages').delete().eq('id', data[0].id);
    await logAynActivity(supabase, 'contact_deleted', `Deleted contact message from ${data[0].name}`, {
      target_id: data[0].id, target_type: 'contact_message',
      details: { name: data[0].name, message_preview: data[0].message.slice(0, 200) },
      triggered_by: 'telegram_command',
    });
    return `🗑️ Deleted contact from ${data[0].name}`;
  }

  return '❌ Unknown delete command';
}

// ─── /clear_errors ───
export async function cmdClearErrors(text: string, supabase: Supabase): Promise<string> {
  const hoursStr = text.replace(/^\/clear_errors\s*/i, '').trim() || '24';
  const hours = parseInt(hoursStr);
  if (isNaN(hours) || hours < 1) return '❌ Usage: /clear_errors [hours]';
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { count } = await supabase.from('error_logs').delete().lt('created_at', cutoff).select('*', { count: 'exact', head: true });
  await logAynActivity(supabase, 'errors_cleared', `Cleared errors older than ${hours}h`, {
    target_type: 'error_log',
    details: { hours, cutoff, deleted_count: count },
    triggered_by: 'telegram_command',
  });
  return `🧹 Cleared error logs older than ${hours} hours.`;
}

// ─── /think ───
export async function cmdThink(supabaseUrl: string, supabaseKey: string): Promise<string> {
  try {
    await fetch(`${supabaseUrl}/functions/v1/ayn-proactive-loop`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return "🧠 Running a thinking cycle now... I'll message you if I find anything interesting.";
  } catch {
    return '❌ Failed to trigger thinking cycle.';
  }
}

// ─── /unblock ───
export async function cmdUnblock(text: string, supabase: Supabase): Promise<string> {
  const userId = text.slice(9).trim();
  if (!userId) return '❌ Usage: /unblock [user_id]';
  await supabase.from('api_rate_limits').update({ blocked_until: null }).eq('user_id', userId);
  await logAynActivity(supabase, 'user_unblocked', `Unblocked user ${userId.slice(0, 8)}`, {
    target_id: userId, target_type: 'user',
    triggered_by: 'telegram_command',
  });
  return `✅ Unblocked user ${userId.slice(0, 8)}...`;
}
