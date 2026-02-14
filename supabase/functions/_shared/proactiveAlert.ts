/**
 * Proactive Alert System
 * Allows agents to push important updates directly into the Command Center chat.
 * Messages appear as assistant messages from the specific agent.
 */

import { getAgentDisplayName, getAgentEmoji } from "./aynBrand.ts";

export type AlertPriority = 'info' | 'warning' | 'critical';

interface ProactiveAlertOptions {
  employee_id: string;
  message: string;
  priority?: AlertPriority;
  details?: Record<string, unknown>;
}

const PRIORITY_PREFIX: Record<AlertPriority, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  critical: '🚨',
};

/**
 * Push a proactive alert into the Command Center chat for all admin users.
 * The message will appear as an assistant message from the specified agent.
 */
export async function pushProactiveAlert(
  supabase: any,
  opts: ProactiveAlertOptions,
): Promise<void> {
  const { employee_id, message, priority = 'info', details } = opts;

  try {
    // Get all admin user IDs
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

    // Format the message with agent identity
    const formattedMessage = `${prefix} **${agentName}** (proactive update):\n\n${message}`;

    // Insert a message for each admin
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
