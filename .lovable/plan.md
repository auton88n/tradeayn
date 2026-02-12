

# Layer 3: Political Intelligence + Strategic Doctrine — Combined Implementation

## Overview

This combines both approved plans into a single implementation pass: the **Realism & Political Intelligence Layer** (peer trust, reputation, cognitive load, emotional memory, founder psychology) and the **Strategic Doctrine Memory** (coherence bonus in deliberations).

## Phase 1: Database Migration

Add 5 columns to `employee_states`:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| peer_models | jsonb | `{}` | Trust map per peer, auto-decays toward 0.5 |
| initiative_score | float | 0.5 | Proactive behavior, decays when idle |
| reputation_score | float | 0.5 | Influence weight, regresses toward 0.5, floored at 0.25 |
| cognitive_load | float | 0.2 | Bandwidth realism, decays 10% per cycle |
| emotional_memory | jsonb | `[]` | Emotional events with decaying intensity |

Seed initial values for all 13 agents (neutral peer trust at 0.5, initiative/reputation at 0.5, cognitive_load at 0.2, empty emotional_memory). Update `founder_model` jsonb for the system agent to include `current_mood`, `trust_trajectory`, `recent_overrides`, `delegation_comfort`, `attention_patterns`, `frustration_signals`.

## Phase 2: Shared Modules

### `employeeState.ts`

- Extend `EmployeeState` interface with 5 new fields
- Add `updatePeerTrust(supabase, employeeId, peerId, delta)` -- clamped 0.1-0.9
- Add `adjustCognitiveLoad(supabase, employeeId, taskWeight)` -- increases on action
- Add `recordEmotionalEvent(supabase, employeeId, event)` -- caps at 10, evicts oldest
- Add `decayInitiative(supabase, employeeId)` -- drops 0.05 when idle
- Add `applySystemDecay(supabase, employeeId)` -- per Chief of Staff cycle:
  - Cognitive load: -10%
  - Trust regression: toward 0.5 by 0.06% per cycle
  - Reputation regression: toward 0.5 by 0.12% per cycle
  - Emotional intensity: -0.5%, evict below 0.05
- Add `loadCurrentDoctrine(supabase)` -- fetches latest `company_journal` entry for strategic_shift
- Update `buildEmployeeContext()` to include peer trust summary, reputation, cognitive load, and current doctrine

### `deliberation.ts`

- **60/40 + Doctrine scoring**: `final_weight = (0.6 * objective_economic_score) + (0.4 * reputation_adjusted_confidence) + doctrine_bonus`
- Reputation-adjusted confidence uses `max(reputation_score, 0.25)` as floor
- Doctrine bonus: +0.1 if position aligns with current `strategic_shift` from company_journal, 0.0 otherwise
- Trust-filtered objections: only raise objections against peers with trust < 0.5
- Cognitive load gating: exclude agents with `cognitive_load > 0.8` from non-critical deliberations
- Post-debate trust update: aligned agents +0.05 peer trust, opposing agents -0.03

## Phase 3: Edge Functions

### Outcome Evaluator (every 6h)
- Reputation: +0.05 if prediction accurate, -0.08 if wrong
- Peer trust: agents who backed a wrong prediction lose -0.02 trust from dissenters
- Initiative: +0.1 for proactively flagging issues before escalation

### Chief of Staff (every 2h)
- Call `applySystemDecay()` for all 13 agents each cycle
- Founder psychology: analyze recent Telegram messages to update `founder_model` dynamic fields (current_mood, frustration_signals, delegation_comfort)
- Flag agents with reputation below 0.3 to HR Manager
- Rank agents by `initiative_score * reputation_score` in briefings
- Doctrine staleness check: flag if company_journal older than 100 days

### HR Manager (daily)
- Reputation trend: compare 7-day trajectory, flag declining agents
- Emotional health: 3+ negative memories with intensity > 0.3 triggers personality softening suggestion
- Cognitive overload: average `cognitive_load > 0.7` over 24h triggers task redistribution recommendation

### Telegram Webhook
- Read `founder_model.current_mood` for response tone
- `frustration_signals > 0.6`: more concise, suppress unsolicited chime-ins
- `delegation_comfort > 0.8`: auto-execute medium-impact actions
- Chime-in priority: `initiative_score * reputation_score` instead of confidence alone

## Implementation Order

1. Database migration (add columns + seed values)
2. Update `employeeState.ts` (interface, new functions, decay, doctrine loader)
3. Update `deliberation.ts` (60/40 + doctrine scoring, trust filtering, cognitive gating)
4. Update Outcome Evaluator
5. Update Chief of Staff
6. Update HR Manager
7. Update Telegram Webhook
8. Deploy all functions

## Stability Safeguards (Built In)

- **No caste systems**: Reputation regresses toward 0.5 baseline, minimum influence floor at 0.25
- **No permanent factions**: Trust auto-decays toward 0.5 neutral
- **No permanent defensiveness**: Emotional intensity decays, memories below 0.05 evicted
- **No strategic whiplash**: Doctrine bonus (+0.1) preserves directional coherence without overriding economics
- **Rational ceiling**: 60% of every decision grounded in objectives + economics, regardless of politics

