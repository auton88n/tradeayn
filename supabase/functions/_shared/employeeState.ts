/**
 * Employee State Management — The Intelligence Layer
 * Provides persistent state, belief drift guards, and company context for all AI employees.
 */

// Clamp belief values to safe ranges (prevents paralysis or recklessness)
function clampBelief(value: number, min = 0.1, max = 0.9): number {
  return Math.max(min, Math.min(max, value));
}

function clampBeliefs(beliefs: Record<string, number>): Record<string, number> {
  const clamped: Record<string, number> = {};
  for (const [key, value] of Object.entries(beliefs)) {
    clamped[key] = clampBelief(value);
  }
  return clamped;
}

export interface EmployeeState {
  id: string;
  employee_id: string;
  beliefs: Record<string, number>;
  emotional_stance: string;
  confidence: number;
  core_motivation: string;
  active_objectives: string[];
  recent_decisions: any[];
  performance_metrics: Record<string, number>;
  founder_model: Record<string, any>;
  chime_in_threshold: number;
}

export interface CompanyState {
  momentum: string;
  stress_level: number;
  growth_velocity: string;
  risk_exposure: string;
  morale: string;
  context: Record<string, any>;
}

export interface CompanyObjective {
  id: string;
  title: string;
  metric: string;
  target_value: number;
  current_value: number;
  deadline: string;
  priority: number;
  status: string;
}

export interface ServiceEconomics {
  service_id: string;
  service_name: string;
  acquisition_difficulty: number;
  scalability_score: number;
  average_margin: number;
  time_to_deploy: string;
  retention_probability: number;
  operational_complexity: number;
  category: string;
  notes: string;
}

export interface Reflection {
  employee_id: string;
  action_ref: string;
  reasoning: string;
  expected_outcome: string;
  confidence: number;
  what_would_change_mind: string;
}

// ─── Load Functions ───

export async function loadEmployeeState(supabase: any, employeeId: string): Promise<EmployeeState | null> {
  const { data } = await supabase
    .from('employee_states')
    .select('*')
    .eq('employee_id', employeeId)
    .single();
  return data;
}

export async function loadCompanyState(supabase: any): Promise<CompanyState | null> {
  const { data } = await supabase
    .from('company_state')
    .select('*')
    .limit(1)
    .single();
  return data;
}

export async function loadActiveObjectives(supabase: any): Promise<CompanyObjective[]> {
  const { data } = await supabase
    .from('company_objectives')
    .select('*')
    .eq('status', 'active')
    .order('priority', { ascending: true });
  return data || [];
}

export async function loadServiceEconomics(supabase: any): Promise<ServiceEconomics[]> {
  const { data } = await supabase
    .from('service_economics')
    .select('*')
    .order('scalability_score', { ascending: false });
  return data || [];
}

export async function loadFounderModel(supabase: any): Promise<Record<string, any>> {
  // All employees share the same founder_model — load from system (AYN)
  const { data } = await supabase
    .from('employee_states')
    .select('founder_model')
    .eq('employee_id', 'system')
    .single();
  return data?.founder_model || {};
}

// ─── Update Functions ───

export async function updateEmployeeState(
  supabase: any,
  employeeId: string,
  updates: Partial<Pick<EmployeeState, 'beliefs' | 'emotional_stance' | 'confidence' | 'performance_metrics' | 'active_objectives' | 'recent_decisions'>>
): Promise<void> {
  const toUpdate: any = { ...updates };
  
  // Apply belief drift guard
  if (toUpdate.beliefs) {
    toUpdate.beliefs = clampBeliefs(toUpdate.beliefs);
  }
  
  // Clamp confidence
  if (toUpdate.confidence !== undefined) {
    toUpdate.confidence = clampBelief(toUpdate.confidence);
  }

  await supabase
    .from('employee_states')
    .update(toUpdate)
    .eq('employee_id', employeeId);
}

export async function logReflection(supabase: any, reflection: Reflection): Promise<void> {
  await supabase.from('employee_reflections').insert({
    employee_id: reflection.employee_id,
    action_ref: reflection.action_ref,
    reasoning: reflection.reasoning,
    expected_outcome: reflection.expected_outcome,
    confidence: clampBelief(reflection.confidence),
    what_would_change_mind: reflection.what_would_change_mind,
  });
}

// ─── Context Builders ───

/**
 * Build a compact context string for injecting into employee system prompts.
 * Includes company state, objectives, economics summary, and founder preferences.
 */
export async function buildEmployeeContext(supabase: any, employeeId: string): Promise<string> {
  const [state, companyState, objectives, economics, founderModel] = await Promise.all([
    loadEmployeeState(supabase, employeeId),
    loadCompanyState(supabase),
    loadActiveObjectives(supabase),
    loadServiceEconomics(supabase),
    loadFounderModel(supabase),
  ]);

  const parts: string[] = [];

  if (state) {
    parts.push(`Your current state:
- Confidence: ${state.confidence}
- Emotional stance: ${state.emotional_stance}
- Core motivation: ${state.core_motivation}
- Beliefs: growth=${state.beliefs.growth_priority}, risk_tolerance=${state.beliefs.risk_tolerance}, speed_vs_quality=${state.beliefs.speed_vs_quality}`);
  }

  if (companyState) {
    parts.push(`Company temperature:
- Momentum: ${companyState.momentum}
- Stress: ${companyState.stress_level}
- Growth: ${companyState.growth_velocity}
- Risk exposure: ${companyState.risk_exposure}
- Morale: ${companyState.morale}`);
  }

  if (objectives.length > 0) {
    parts.push(`Active objectives (prioritize these):
${objectives.map(o => `- [P${o.priority}] ${o.title} (${o.current_value}/${o.target_value})`).join('\n')}`);
  }

  if (economics.length > 0) {
    const saas = economics.filter(e => e.category === 'saas');
    const services = economics.filter(e => e.category === 'service');
    parts.push(`Service economics:
SaaS (scalable): ${saas.map(e => `${e.service_name} (margin: ${Math.round(e.average_margin * 100)}%, scale: ${e.scalability_score}/10)`).join(', ')}
Services (cash flow): ${services.map(e => `${e.service_name} (margin: ${Math.round(e.average_margin * 100)}%, complexity: ${e.operational_complexity}/10)`).join(', ')}`);
  }

  if (founderModel) {
    parts.push(`Founder preferences:
- Risk tolerance: ${founderModel.risk_tolerance || 'high'}
- Communication: ${founderModel.communication_style || 'casual'}
- Prefers brevity: ${founderModel.prefers_brevity ?? true}`);
  }

  return parts.join('\n\n');
}
