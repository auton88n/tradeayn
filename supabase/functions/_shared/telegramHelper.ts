/**
 * Shared Telegram messaging helper with HTML formatting.
 */

function markdownToTelegramHtml(text: string): string {
  let html = text;

  // 0. Strip horizontal rules (---, ___, ***)
  html = html.replace(/^[\-_\*]{3,}\s*$/gm, '');

  // 1. Strip empty bold/italic markers: ****, ***, **, *
  html = html.replace(/\*{4,}/g, '');        // **** or more
  html = html.replace(/\*{2,3}(?=\s|$)/g, ''); // trailing ** or ***
  html = html.replace(/(?:^|\s)\*{2,3}/g, (m) => m.replace(/\*/g, '')); // leading ** or ***

  // 2. Escape HTML special chars
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 3. Convert ***bold italic*** to <b><i>text</i></b>
  html = html.replace(/\*{3}(.+?)\*{3}/g, '<b><i>$1</i></b>');

  // 4. Convert **bold** to <b>bold</b>
  html = html.replace(/\*{2}(.+?)\*{2}/g, '<b>$1</b>');

  // 5. Convert *italic* to <i>italic</i>
  html = html.replace(/\*([^\s*][^*]*?)\*/g, '<i>$1</i>');

  // 6. Convert markdown headers (### Header) to bold
  html = html.replace(/^#{1,4}\s+(.+)$/gm, '<b>$1</b>');

  // 7. Strip any remaining stray asterisks (not inside tags)
  html = html.replace(/(?<![<\/\w])\*+(?![>\w])/g, '');

  // 8. Ensure paragraph spacing
  html = html.replace(/\n{3,}/g, '\n\n');

  // 9. Clean up extra whitespace from removals
  html = html.replace(/^ +$/gm, '');
  html = html.replace(/\n{3,}/g, '\n\n');

  return html.trim();
}

// ─── Deliberation Broadcast Helpers ───

import { getAgentEmoji, getAgentDisplayName } from "./aynBrand.ts";
import type { DeliberationPosition, DeliberationResult, ImpactLevel } from "./deliberation.ts";

export function formatDebateOpener(topic: string, impactLevel: ImpactLevel, agentCount: number): string {
  const impactEmoji = impactLevel === 'irreversible' ? '🔴' : impactLevel === 'high' ? '🟠' : '🟡';
  return `🏢 <b>INTERNAL DEBATE</b>\n"${topic}"\n${impactEmoji} Impact: ${impactLevel.toUpperCase()} | Agents: ${agentCount}`;
}

export function formatAgentPosition(pos: DeliberationPosition): string {
  const emoji = getAgentEmoji(pos.employee_id);
  const name = getAgentDisplayName(pos.employee_id);
  const lines: string[] = [];

  lines.push(`${emoji} <b>${name}</b> (rep: ${pos.reputation_score.toFixed(2)}, confidence: ${pos.confidence.toFixed(2)})`);
  lines.push(`"${pos.position}"`);

  if (pos.doctrine_aligned) lines.push('[doctrine-aligned]');
  if (pos.objections && pos.objections.length > 5) lines.push(`Objection: "${pos.objections}"`);
  if (pos.cognitive_load > 0.6) lines.push(`⚡ cognitive load: ${pos.cognitive_load.toFixed(2)}`);

  return lines.join('\n');
}

export function formatDecisionMessage(
  result: DeliberationResult,
  topAgent: { employee_id: string; finalWeight: number } | null,
  currentDoctrine?: string,
): string {
  const lines: string[] = [];
  lines.push('🧠 <b>AYN — DECISION</b>');

  if (topAgent) {
    lines.push(`Winner: ${getAgentDisplayName(topAgent.employee_id)} (weight: ${topAgent.finalWeight.toFixed(2)})`);
  }
  lines.push(`Decision: "${result.decision}"`);

  if (currentDoctrine) {
    lines.push(`Doctrine: "${currentDoctrine}" — ${result.decision.toLowerCase().includes(currentDoctrine.toLowerCase().slice(0, 10)) ? 'aligned' : 'referenced'}`);
  }

  if (result.dissent.length > 0) {
    lines.push(`Dissent: ${result.dissent.join('; ')}`);
  }

  lines.push(`Confidence: ${Math.round(result.confidence * 10)}/10`);

  if (result.requires_approval) {
    lines.push('\n⚠️ High-impact — waiting for your go-ahead.');
  }

  return lines.join('\n');
}

const BROADCAST_DELAY_MS = 800;

// ─── Multi-Bot Group Chat Broadcast ───

interface AgentBotToken {
  employee_id: string;
  bot_token: string;
}

async function loadAgentBotTokens(supabase: any): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('agent_telegram_bots')
    .select('employee_id, bot_token')
    .eq('is_active', true);
  
  const map: Record<string, string> = {};
  if (data) {
    for (const row of data as AgentBotToken[]) {
      map[row.employee_id] = row.bot_token;
    }
  }
  return map;
}

export async function broadcastDeliberation(
  supabase: any,
  chatId: string,
  topic: string,
  impactLevel: ImpactLevel,
  positions: DeliberationPosition[],
  result: DeliberationResult,
  topAgent: { employee_id: string; finalWeight: number } | null,
  currentDoctrine?: string,
  fallbackToken?: string,
): Promise<void> {
  // Load per-agent bot tokens from DB
  const botTokens = await loadAgentBotTokens(supabase);
  const systemToken = botTokens['system'] || fallbackToken || '';

  if (!systemToken) {
    console.error('[BROADCAST] No system/fallback bot token available');
    return;
  }

  // Opening message — sent by AYN (system bot)
  await sendTelegramMessage(systemToken, chatId, formatDebateOpener(topic, impactLevel, positions.length));
  await delay(BROADCAST_DELAY_MS);

  // Each agent's position — sent by that agent's bot (or fallback to system)
  for (const pos of positions) {
    const agentToken = botTokens[pos.employee_id] || systemToken;
    await sendTelegramMessage(agentToken, chatId, formatAgentPosition(pos));
    await delay(BROADCAST_DELAY_MS);
  }

  // Final decision — sent by AYN (system bot)
  await sendTelegramMessage(systemToken, chatId, formatDecisionMessage(result, topAgent, currentDoctrine));
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendTelegramMessage(token: string, chatId: string, text: string, rawHtml = false) {
  const formatted = rawHtml ? text : markdownToTelegramHtml(text);
  const truncated = formatted.length > 4000 ? formatted.slice(0, 3990) + '\n...truncated' : formatted;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: truncated, parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Telegram send failed (HTML mode):', err);
    // Fallback: retry without parse_mode
    const fallback = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text.length > 4000 ? text.slice(0, 3990) + '\n...truncated' : text }),
    });
    if (!fallback.ok) {
      console.error('Telegram fallback also failed:', await fallback.text());
    }
  }
}
