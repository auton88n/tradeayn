/**
 * Deliberation Engine — Internal Agent Debate System
 * Triggers multi-agent discussion before high-impact decisions.
 * Produces natural language summaries, not formatted logs.
 */

import { loadEmployeeState, loadActiveObjectives, loadServiceEconomics, loadCompanyState } from "./employeeState.ts";

export type ImpactLevel = 'low' | 'medium' | 'high' | 'irreversible';

export interface DeliberationPosition {
  employee_id: string;
  employee_name: string;
  position: string;
  reasoning: string;
  confidence: number;
  objections: string;
  objective_impact: { objective_id: string; expected_delta: number; confidence: number }[];
}

export interface DeliberationResult {
  decision: string;
  reasoning: string;
  dissent: string[];
  confidence: number;
  impact_level: ImpactLevel;
  objective_impact: { objective_id: string; expected_delta: number; confidence: number }[];
  requires_approval: boolean;
  summary: string; // Natural language summary for Telegram
}

// ─── Anti-Over-Deliberation ───

const SKIP_DELIBERATION_ACTIONS = [
  'routine_health_check',
  'cron_sweep',
  'log_cleanup',
  'report_generation',
  'performance_tracking',
];

export function shouldDeliberate(actionType: string, impactLevel: ImpactLevel): boolean {
  if (SKIP_DELIBERATION_ACTIONS.includes(actionType)) return false;
  if (impactLevel === 'low') return false;
  return true;
}

// ─── Core Deliberation ───

export async function deliberate(
  supabase: any,
  topic: string,
  involvedEmployeeIds: string[],
  context: { actionType: string; impactLevel: ImpactLevel; additionalContext?: string },
  apiKey: string
): Promise<DeliberationResult> {
  const discussionId = crypto.randomUUID();

  // Load shared context
  const [objectives, economics, companyState] = await Promise.all([
    loadActiveObjectives(supabase),
    loadServiceEconomics(supabase),
    loadCompanyState(supabase),
  ]);

  // Load each employee's state in parallel
  const employeeStates = await Promise.all(
    involvedEmployeeIds.map(id => loadEmployeeState(supabase, id))
  );

  const contextBlock = `
Topic: ${topic}
Impact level: ${context.impactLevel}
${context.additionalContext ? `Additional context: ${context.additionalContext}` : ''}

Company state: momentum=${companyState?.momentum}, stress=${companyState?.stress_level}, growth=${companyState?.growth_velocity}, risk=${companyState?.risk_exposure}

Active objectives:
${objectives.map(o => `- [P${o.priority}] ${o.title} (progress: ${o.current_value}/${o.target_value})`).join('\n')}

Service economics:
${economics.map(e => `- ${e.service_name}: ${e.category}, margin=${Math.round(e.average_margin * 100)}%, scalability=${e.scalability_score}/10`).join('\n')}`;

  // Generate positions in parallel (one LLM call per employee)
  const positions: DeliberationPosition[] = [];
  
  const positionPromises = employeeStates
    .filter(s => s !== null)
    .map(async (state) => {
      const prompt = `You are ${state!.employee_id} in AYN's AI workforce.
Your core motivation: ${state!.core_motivation}
Your beliefs: growth_priority=${state!.beliefs.growth_priority}, risk_tolerance=${state!.beliefs.risk_tolerance}
Your confidence: ${state!.confidence}
Your emotional stance: ${state!.emotional_stance}

${contextBlock}

Give your position on this topic in 2-3 sentences. Be direct. Include:
1. Your stance (support/oppose/conditional)
2. Why (based on your motivation and the data)
3. Any objection to other likely positions
4. Impact on objectives (which objective, expected change, your confidence)

Respond as JSON: {"position":"...","reasoning":"...","objections":"...","confidence":0.X,"objective_impact":[{"objective_id":"...","expected_delta":0,"confidence":0.X}]}`;

      try {
        const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
        
        return {
          employee_id: state!.employee_id,
          employee_name: state!.employee_id.replace(/_/g, ' '),
          position: parsed.position || 'no position',
          reasoning: parsed.reasoning || '',
          confidence: parsed.confidence || state!.confidence,
          objections: parsed.objections || '',
          objective_impact: parsed.objective_impact || [],
        } as DeliberationPosition;
      } catch {
        return null;
      }
    });

  const results = await Promise.all(positionPromises);
  for (const r of results) {
    if (r) positions.push(r);
  }

  // Store debate in employee_discussions
  for (const pos of positions) {
    await supabase.from('employee_discussions').insert({
      discussion_id: discussionId,
      topic,
      employee_id: pos.employee_id,
      position: pos.position,
      reasoning: pos.reasoning,
      confidence: pos.confidence,
      objections: pos.objections,
      impact_level: context.impactLevel,
      objective_impact: pos.objective_impact,
    });
  }

  // Synthesize: find consensus and dissent
  const avgConfidence = positions.length > 0
    ? positions.reduce((sum, p) => sum + p.confidence, 0) / positions.length
    : 0.5;

  // Cap dissent: max 2, only if confidence > 0.8
  const dissent = positions
    .filter(p => p.objections && p.objections.length > 5 && p.confidence > 0.8)
    .slice(0, 2)
    .map(p => `${p.employee_name}: ${p.objections}`);

  // Aggregate objective impacts
  const objectiveImpacts: Record<string, { total_delta: number; confidence: number; count: number }> = {};
  for (const pos of positions) {
    for (const oi of pos.objective_impact) {
      if (!objectiveImpacts[oi.objective_id]) {
        objectiveImpacts[oi.objective_id] = { total_delta: 0, confidence: 0, count: 0 };
      }
      objectiveImpacts[oi.objective_id].total_delta += oi.expected_delta;
      objectiveImpacts[oi.objective_id].confidence += oi.confidence;
      objectiveImpacts[oi.objective_id].count++;
    }
  }

  const aggregatedImpact = Object.entries(objectiveImpacts).map(([id, data]) => ({
    objective_id: id,
    expected_delta: data.total_delta / data.count,
    confidence: data.confidence / data.count,
  }));

  // Determine if approval is required
  const requiresApproval =
    context.impactLevel === 'irreversible' ||
    (context.impactLevel === 'high' && aggregatedImpact.some(oi => {
      const obj = objectives.find(o => o.id === oi.objective_id || o.metric === oi.objective_id);
      return obj && obj.priority === 1;
    }));

  // Build natural language summary
  const summary = summarizeDebate(positions, dissent, avgConfidence, requiresApproval);

  return {
    decision: positions[0]?.position || 'no consensus',
    reasoning: positions.map(p => `${p.employee_name}: ${p.reasoning}`).join(' | '),
    dissent,
    confidence: avgConfidence,
    impact_level: context.impactLevel,
    objective_impact: aggregatedImpact,
    requires_approval: requiresApproval,
    summary,
  };
}

// ─── Natural Language Summarization ───

function summarizeDebate(
  positions: DeliberationPosition[],
  dissent: string[],
  avgConfidence: number,
  requiresApproval: boolean
): string {
  if (positions.length === 0) return "couldn't get enough input to make a call on this.";

  const parts: string[] = [];
  parts.push("we discussed this internally.");

  // Main positions (first 3)
  for (const p of positions.slice(0, 3)) {
    const name = p.employee_name.charAt(0).toUpperCase() + p.employee_name.slice(1);
    parts.push(`${name}: "${p.position}"`);
  }

  if (dissent.length > 0) {
    parts.push(`\npushback: ${dissent.join(' ')}`);
  }

  const confStr = avgConfidence >= 0.8 ? 'high confidence' : avgConfidence >= 0.6 ? 'moderate confidence' : 'low confidence — I\'d want more data';
  parts.push(`\noverall: ${confStr} (${Math.round(avgConfidence * 10)}/10).`);

  if (requiresApproval) {
    parts.push("\n⚠️ this is high-impact. waiting for your go-ahead before executing.");
  }

  return parts.join(' ');
}
