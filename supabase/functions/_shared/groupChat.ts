/**
 * Group Chat AI Conversation — Multi-Agent Discussion
 * When the founder messages in the group chat, relevant agents respond
 * using their own bot identities with 800ms delays.
 */

import { getEmployeePersonality, getAgentEmoji, getAgentDisplayName } from "./aynBrand.ts";
import { loadCompanyState, loadActiveObjectives, loadEmployeeState } from "./employeeState.ts";
import { sendTelegramMessage } from "./telegramHelper.ts";
import { logAynActivity } from "./aynLogger.ts";

const RESPONSE_DELAY_MS = 800;

// Agents who participate in group conversations (subset to avoid noise)
const GROUP_CONVERSATION_AGENTS = [
  'system',       // AYN — always responds as moderator
  'chief_of_staff',
  'sales',
  'marketing',
  'advisor',
  'security_guard',
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Pick 3-5 relevant agents for the topic (always includes system)
 */
function selectRelevantAgents(userMessage: string): string[] {
  const msg = userMessage.toLowerCase();
  const selected = new Set<string>(['system']); // AYN always participates

  // Keyword-based agent selection
  if (msg.includes('sale') || msg.includes('lead') || msg.includes('revenue') || msg.includes('client') || msg.includes('pipeline') || msg.includes('deal')) {
    selected.add('sales');
  }
  if (msg.includes('market') || msg.includes('brand') || msg.includes('content') || msg.includes('campaign') || msg.includes('social') || msg.includes('competitor')) {
    selected.add('marketing');
  }
  if (msg.includes('security') || msg.includes('attack') || msg.includes('threat') || msg.includes('breach') || msg.includes('hack')) {
    selected.add('security_guard');
  }
  if (msg.includes('strategy') || msg.includes('growth') || msg.includes('plan') || msg.includes('direction') || msg.includes('objective') || msg.includes('vision')) {
    selected.add('advisor');
  }
  if (msg.includes('team') || msg.includes('align') || msg.includes('priority') || msg.includes('objective') || msg.includes('doctrine') || msg.includes('focus')) {
    selected.add('chief_of_staff');
  }
  if (msg.includes('legal') || msg.includes('compliance') || msg.includes('gdpr') || msg.includes('contract') || msg.includes('risk')) {
    selected.add('lawyer');
  }
  if (msg.includes('innovat') || msg.includes('idea') || msg.includes('experiment') || msg.includes('new feature') || msg.includes('build')) {
    selected.add('innovation');
  }
  if (msg.includes('customer') || msg.includes('churn') || msg.includes('retention') || msg.includes('user') || msg.includes('onboard')) {
    selected.add('customer_success');
  }

  // If fewer than 3 agents selected, add chief_of_staff and advisor
  if (selected.size < 3) {
    selected.add('chief_of_staff');
    selected.add('advisor');
  }

  // Cap at 5 agents to avoid spam
  const agents = Array.from(selected);
  return agents.slice(0, 5);
}

export async function handleGroupConversation(
  supabase: any,
  userMessage: string,
  chatId: string,
  apiKey: string,
): Promise<void> {
  // Rate limit: max 1 group conversation per 2 minutes
  const { data: recentConvos } = await supabase
    .from('ayn_activity_log')
    .select('id')
    .eq('action_type', 'group_conversation')
    .gte('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString())
    .limit(1);

  if (recentConvos && recentConvos.length > 0) {
    // Silently skip to avoid spam
    console.log('[GROUP-CHAT] Rate limited — skipping');
    return;
  }

  // Load bot tokens
  const { data: bots } = await supabase
    .from('agent_telegram_bots')
    .select('employee_id, bot_token')
    .eq('is_active', true);

  const botTokens: Record<string, string> = {};
  if (bots) {
    for (const b of bots) botTokens[b.employee_id] = b.bot_token;
  }

  const systemToken = botTokens['system'];
  if (!systemToken) {
    console.error('[GROUP-CHAT] No system bot token');
    return;
  }

  const selectedAgents = selectRelevantAgents(userMessage);

  // Only include agents that have their own bot token (no fallback to AYN identity)
  const agentsWithBots = selectedAgents.filter(id => botTokens[id]);
  // Always ensure system (AYN) is included
  if (!agentsWithBots.includes('system') && systemToken) {
    agentsWithBots.unshift('system');
  }

  // Load shared context
  const [companyState, objectives] = await Promise.all([
    loadCompanyState(supabase),
    loadActiveObjectives(supabase),
  ]);

  const contextBlock = `Company: momentum=${companyState?.momentum}, stress=${companyState?.stress_level}
Active objectives: ${objectives.slice(0, 3).map(o => `${o.title} (P${o.priority})`).join(', ')}`;

  // Generate agent responses in parallel
  const responsePromises = agentsWithBots.map(async (agentId) => {
    const state = await loadEmployeeState(supabase, agentId);
    const personality = getEmployeePersonality(agentId);
    const emoji = getAgentEmoji(agentId);
    const name = getAgentDisplayName(agentId);

    const prompt = `You are ${name} in AYN's AI workforce group chat.
${personality}

${contextBlock}

The founder just said in the group chat: "${userMessage}"

Respond naturally as ${name}. Keep it SHORT (1-3 sentences max). Be conversational, like you're in a team Slack channel. Don't repeat what others might say. Stay in character.
${agentId === 'system' ? 'As AYN, you can acknowledge, synthesize, or set direction.' : `Focus on your expertise as ${name}.`}
${state?.confidence ? `Your current confidence: ${state.confidence}` : ''}

Reply with ONLY your message text. No prefixes, no emoji, no name tag.`;

    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) return null;

      return { agentId, reply, emoji, name, token: botTokens[agentId] };
    } catch {
      return null;
    }
  });

  const responses = (await Promise.all(responsePromises)).filter(Boolean);

  // Send responses sequentially with delays (system first)
  const systemResponse = responses.find(r => r!.agentId === 'system');
  const otherResponses = responses.filter(r => r!.agentId !== 'system');

  if (systemResponse) {
    const msg = `${systemResponse.emoji} ${systemResponse.reply}`;
    await sendTelegramMessage(systemResponse.token, chatId, msg, true);
    await delay(RESPONSE_DELAY_MS);
  }

  for (const r of otherResponses) {
    if (!r) continue;
    const msg = `${r.emoji} ${r.reply}`;
    await sendTelegramMessage(r.token, chatId, msg, true);
    await delay(RESPONSE_DELAY_MS);
  }

  // Log the conversation
  await logAynActivity(supabase, 'group_conversation', `Group discussion: ${userMessage.slice(0, 80)}`, {
    details: { agents: selectedAgents, message_preview: userMessage.slice(0, 200) },
  }).catch(() => {});
}
