/**
 * Proactive Alert System
 * Allows agents to push important updates directly into the Command Center chat
 * AND send Telegram notifications — so the founder always knows what's happening.
 */

import { getAgentDisplayName, getAgentEmoji } from "./aynBrand.ts";
import { sendTelegramMessage } from "./telegramHelper.ts";

export type AlertPriority = 'info' | 'warning' | 'critical';

interface ProactiveAlertOptions {
  employee_id: string;
  message: string;
  priority?: AlertPriority;
  details?: Record<string, unknown>;
}

interface NotifyFounderOptions extends ProactiveAlertOptions {
  needs_approval?: boolean;
}

const PRIORITY_PREFIX: Record<AlertPriority, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  critical: '🚨',
};

/**
 * Push a proactive alert into the Command Center chat for all admin users.
 */
export async function pushProactiveAlert(
  supabase: any,
  opts: ProactiveAlertOptions,
): Promise<void> {
  const { employee_id, message, priority = 'info', details } = opts;

  try {
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      console.warn('[proactiveAlert] No admin users found');
      return;
    }

    const agentName = getAgentDisplayName(employee_id);
    const agentEmoji = getAgentEmoji(employee_id);
    const prefix = PRIORITY_PREFIX[priority];

    const formattedMessage = `${prefix} **${agentName}** (proactive update):\n\n${message}`;

    const inserts = admins.map((admin: { user_id: string }) => ({
      admin_id: admin.user_id,
      role: 'assistant',
      message: formattedMessage,
      context: {
        proactive: true,
        employee_id,
        priority,
        tool_results: [{
          type: 'agent_result',
          agent: employee_id,
          agent_name: agentName,
          agent_emoji: agentEmoji,
          message,
          success: true,
          result: details || null,
        }],
      },
      actions_taken: { agent: employee_id, proactive: true },
    }));

    const { error } = await supabase
      .from('admin_ai_conversations')
      .insert(inserts);

    if (error) {
      console.error('[proactiveAlert] Insert failed:', error.message);
    }
  } catch (e) {
    console.error('[proactiveAlert] Error:', e);
  }
}

/**
 * Unified notification: pushes to Command Center AND sends Telegram message.
 * Use this at the end of every agent's work cycle.
 */
export async function notifyFounder(
  supabase: any,
  opts: NotifyFounderOptions,
): Promise<void> {
  const { employee_id, message, priority = 'info', details, needs_approval } = opts;

  const agentName = getAgentDisplayName(employee_id);
  const agentEmoji = getAgentEmoji(employee_id);

  // Build the message with approval prompt if needed
  let fullMessage = message;
  if (needs_approval) {
    fullMessage += '\n\n👆 need your go-ahead on this.';
  }

  // 1. Push to Command Center
  await pushProactiveAlert(supabase, {
    employee_id,
    message: fullMessage,
    priority,
    details,
  });

  // 2. Send to Telegram
  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const prefix = PRIORITY_PREFIX[priority];
      const telegramMsg = `${prefix} ${agentEmoji} <b>${agentName}</b>\n\n${fullMessage}`;
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, telegramMsg);
    }
  } catch (e) {
    console.error('[notifyFounder] Telegram send failed:', e);
  }
}
