/**
 * Political Intelligence Layer — Layer 3
 * Peer trust, reputation, cognitive load, emotional memory, initiative,
 * system decay, and strategic doctrine loading.
 */

// ─── Types ───

export interface EmotionalEvent {
  event: string;
  intensity: number;
  timestamp: string;
  source?: string;
}

export interface DoctrineContext {
  strategic_shift: string;
  period: string;
  created_at: string;
}

// ─── Clamping Helpers ───

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Peer Trust ───

export async function updatePeerTrust(
  supabase: any,
  employeeId: string,
  peerId: string,
  delta: number
): Promise<void> {
  const { data } = await supabase
    .from('employee_states')
    .select('peer_models')
    .eq('employee_id', employeeId)
    .single();

  if (!data) return;

  const peers = data.peer_models || {};
  const currentTrust = peers[peerId] ?? 0.5;
  peers[peerId] = clamp(currentTrust + delta, 0.1, 0.9);

  await supabase
    .from('employee_states')
    .update({ peer_models: peers })
    .eq('employee_id', employeeId);
}

// ─── Cognitive Load ───

export async function adjustCognitiveLoad(
  supabase: any,
  employeeId: string,
  taskWeight: number
): Promise<void> {
  const { data } = await supabase
    .from('employee_states')
    .select('cognitive_load')
    .eq('employee_id', employeeId)
    .single();

  if (!data) return;

  const newLoad = clamp((data.cognitive_load || 0.2) + taskWeight, 0.0, 1.0);

  await supabase
    .from('employee_states')
    .update({ cognitive_load: newLoad })
    .eq('employee_id', employeeId);
}

// ─── Emotional Memory ───

export async function recordEmotionalEvent(
  supabase: any,
  employeeId: string,
  event: Omit<EmotionalEvent, 'timestamp'>
): Promise<void> {
  const { data } = await supabase
    .from('employee_states')
    .select('emotional_memory')
    .eq('employee_id', employeeId)
    .single();

  if (!data) return;

  const memories: EmotionalEvent[] = data.emotional_memory || [];
  memories.push({
    ...event,
    intensity: clamp(event.intensity, 0.0, 1.0),
    timestamp: new Date().toISOString(),
  });

  // Cap at 10 entries, evict oldest
  while (memories.length > 10) {
    memories.shift();
  }

  await supabase
    .from('employee_states')
    .update({ emotional_memory: memories })
    .eq('employee_id', employeeId);
}

// ─── Initiative Decay ───

export async function decayInitiative(
  supabase: any,
  employeeId: string
): Promise<void> {
  const { data } = await supabase
    .from('employee_states')
    .select('initiative_score')
    .eq('employee_id', employeeId)
    .single();

  if (!data) return;

  const newScore = clamp((data.initiative_score || 0.5) - 0.05, 0.1, 0.9);

  await supabase
    .from('employee_states')
    .update({ initiative_score: newScore })
    .eq('employee_id', employeeId);
}

// ─── Initiative Boost ───

export async function boostInitiative(
  supabase: any,
  employeeId: string,
  amount: number
): Promise<void> {
  const { data } = await supabase
    .from('employee_states')
    .select('initiative_score')
    .eq('employee_id', employeeId)
    .single();

  if (!data) return;

  const newScore = clamp((data.initiative_score || 0.5) + amount, 0.1, 0.9);

  await supabase
    .from('employee_states')
    .update({ initiative_score: newScore })
    .eq('employee_id', employeeId);
}

// ─── Reputation Adjustment ───

export async function adjustReputation(
  supabase: any,
  employeeId: string,
  delta: number
): Promise<void> {
  const { data } = await supabase
    .from('employee_states')
    .select('reputation_score')
    .eq('employee_id', employeeId)
    .single();

  if (!data) return;

  const newScore = clamp((data.reputation_score || 0.5) + delta, 0.1, 0.9);

  await supabase
    .from('employee_states')
    .update({ reputation_score: newScore })
    .eq('employee_id', employeeId);
}

// ─── System Decay (Called by Chief of Staff every 2h cycle) ───

export async function applySystemDecay(
  supabase: any,
  employeeId: string
): Promise<void> {
  const { data } = await supabase
    .from('employee_states')
    .select('cognitive_load, peer_models, reputation_score, emotional_memory')
    .eq('employee_id', employeeId)
    .single();

  if (!data) return;

  // 1. Cognitive load decay: -10%
  const newCognitiveLoad = clamp((data.cognitive_load || 0.2) * 0.9, 0.0, 1.0);

  // 2. Trust regression: toward 0.5 by 0.06% per cycle
  const peers = data.peer_models || {};
  for (const peerId of Object.keys(peers)) {
    const current = peers[peerId] ?? 0.5;
    peers[peerId] = current + (0.5 - current) * 0.0006;
  }

  // 3. Reputation regression: toward 0.5 by 0.12% per cycle
  const currentRep = data.reputation_score || 0.5;
  const newReputation = currentRep + (0.5 - currentRep) * 0.0012;

  // 4. Emotional intensity decay: -0.5%, evict below 0.05
  const memories: EmotionalEvent[] = (data.emotional_memory || [])
    .map((m: EmotionalEvent) => ({
      ...m,
      intensity: m.intensity * 0.995,
    }))
    .filter((m: EmotionalEvent) => m.intensity >= 0.05);

  await supabase
    .from('employee_states')
    .update({
      cognitive_load: newCognitiveLoad,
      peer_models: peers,
      reputation_score: clamp(newReputation, 0.1, 0.9),
      emotional_memory: memories,
    })
    .eq('employee_id', employeeId);
}

// ─── Strategic Doctrine Loader ───

export async function loadCurrentDoctrine(
  supabase: any
): Promise<DoctrineContext | null> {
  const { data } = await supabase
    .from('company_journal')
    .select('strategic_shift, period, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data || !data.strategic_shift) return null;

  return {
    strategic_shift: data.strategic_shift,
    period: data.period,
    created_at: data.created_at,
  };
}

// ─── Doctrine Staleness Check ───

export function isDoctrinStale(doctrine: DoctrineContext | null): boolean {
  if (!doctrine) return true;
  const ageMs = Date.now() - new Date(doctrine.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays > 100;
}
