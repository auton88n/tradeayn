

# AYN Workforce V2: The AI Company Brain

## Overview

Transform 10 stateless edge functions into 13 intelligent AI agents with persistent state, internal deliberation, economic awareness, objective alignment, and natural conversation -- making AYN feel like a living company, not a dashboard.

## What Gets Built

### Phase 1: Database Schema (8 New Tables)

**1. `employee_states`** -- Persistent intelligence per agent
- employee_id (text, unique), beliefs (jsonb: growth_priority, risk_tolerance, speed_vs_quality -- all clamped 0.1-0.9), emotional_stance (text), confidence (float), core_motivation (text), active_objectives (text[]), recent_decisions (jsonb), performance_metrics (jsonb), founder_model (jsonb), chime_in_threshold (float, default 0.75)

**2. `employee_reflections`** -- Post-action learning
- employee_id, action_ref, reasoning, expected_outcome, confidence, what_would_change_mind, actual_outcome (nullable), outcome_evaluated (boolean, default false)

**3. `employee_discussions`** -- Internal debate records
- discussion_id (uuid), topic, employee_id, position, reasoning, confidence, objections, impact_level (low/medium/high/irreversible), objective_impact (jsonb[]: objective_id + expected_delta + confidence)

**4. `company_objectives`** -- Shared mission alignment
- title, metric, target_value, current_value, deadline, priority (1-5), status (active/completed/paused)

**5. `service_economics`** -- Economic intelligence model
- service_id, service_name, acquisition_difficulty (1-10), scalability_score (1-10), average_margin (float), time_to_deploy (text), retention_probability (float), operational_complexity (1-10), category (saas/service), notes

**6. `company_state`** -- Organizational temperature (single row)
- momentum (low/stable/high), stress_level (0-1), growth_velocity (declining/flat/growing/accelerating), risk_exposure (low/moderate/high/critical), morale (low/stable/high), context (jsonb), updated_by (text)

**7. `company_journal`** -- Quarterly narrative memory
- period (text, e.g. "2026-Q1"), summary, key_wins (jsonb[]), key_losses (jsonb[]), strategic_shift (text), created_by (text, default "chief_of_staff")

**8. No changes to `ayn_sales_pipeline`** -- No caller columns added. Pipeline stays email + research driven.

All tables get RLS: service role full access + admin SELECT.

### Phase 2: Seed Data

**company_objectives** (3 initial):
- "Close 5 AI Agent clients this quarter" (priority 1)
- "Increase engineering SaaS retention to 40%" (priority 2)
- "Reduce LLM failure rate below 1%" (priority 3)

**service_economics** (6 services):
| Service | Category | Scalability | Margin | Complexity |
|---------|----------|-------------|--------|------------|
| Engineering Tools | saas | 10 | 0.8 | 3 |
| Smart Ticketing | saas | 9 | 0.7 | 5 |
| AI Employees | service | 7 | 0.6 | 8 |
| AI Support | saas | 8 | 0.65 | 6 |
| Business Automation | service | 5 | 0.5 | 7 |
| Websites | service | 4 | 0.4 | 6 |

**company_state** (1 row): momentum=stable, stress=0.2, growth=growing, risk=low, morale=high

**employee_states** (13 rows): One per employee with initial beliefs, motivations, and default founder_model

### Phase 3: Shared Intelligence Modules (2 new files)

**`supabase/functions/_shared/employeeState.ts`**
- `loadEmployeeState(supabase, id)` -- fetch beliefs, confidence, objectives
- `updateEmployeeState(supabase, id, updates)` -- persist changes with belief drift guard (clamp all values to safe ranges: 0.1-0.9)
- `logReflection(supabase, id, reflection)` -- save post-action reflection
- `loadCompanyState(supabase)` -- fetch organizational temperature
- `loadFounderModel(supabase)` -- fetch shared founder preferences
- `loadActiveObjectives(supabase)` -- active objectives
- `loadServiceEconomics(supabase)` -- all service data

**`supabase/functions/_shared/deliberation.ts`**
- `shouldDeliberate(actionType, impactLevel)` -- returns false for low-impact, routine cron, repetitive tasks (anti-over-deliberation)
- `deliberate(supabase, topic, employees[], context)`:
  1. Load each employee's state + active objectives + service economics + company state
  2. Parallel LLM calls (one per employee) for private position
  3. Each position includes: stance, reasoning, confidence, objective_impact scoring
  4. Detect conflicts
  5. Synthesize with decision weight: `impact_level` (low/medium/high/irreversible)
  6. Cap dissent at max 2 opinions, only if confidence > 0.8
  7. Return: `{ decision, reasoning, dissent[], confidence, impact_level, objective_impact[], requires_approval }`
  8. `requires_approval = true` if irreversible, high financial impact, or affects priority-1 objectives
  9. Store full debate in `employee_discussions`
- `summarizeDebate(positions[])` -- natural language: "we discussed this internally. Sales wants X because..."

### Phase 4: Rewrite `aynBrand.ts`

**Kill rigid formatting entirely.** Remove `formatEmployeeReport()` and its bordered boxes.

**Replace with `formatNatural(employeeId, content, context)`**:
- `casual`: short, texty ("all clear. no threats in 6h.")
- `incident`: urgent, direct ("heads up -- injection attempts from user X. blocked them.")
- `strategic`: deeper but conversational ("honestly, I think we should push engineering tools harder. here's why...")
- `report`: only when founder explicitly requests formal output

**Rewrite all 10 existing personalities** to include:
- Core motivation (what they advocate for)
- Uncertainty modeling ("say 'I may be wrong' when confidence below 0.7")
- Disagreement protocol ("disagree briefly and explain why")
- Objective awareness ("reference active company objectives")
- Economic awareness ("understand SaaS vs service, margins, scalability")
- Company state reactivity ("adjust emotional stance based on company temperature")

**Add 3 new personalities**:
- **Chief of Staff** (id: `chief_of_staff`): alignment-obsessed orchestrator, gates chime-ins, tracks objectives, prevents chaos
- **HR Manager** (id: `hr_manager`): performance-focused, constructive, tracks effectiveness, suggests retraining
- **Innovation Lead** (id: `innovation`): ambitious, questioning, challenges existing architecture, proposes experiments

### Phase 5: Update All 8 Existing Employee Edge Functions

Every existing employee function (advisor, security_guard, sales, investigator, follow_up, customer_success, qa_watchdog, marketing, lawyer) gets updated to:

1. Import and use `employeeState.ts` -- load state at start, update after execution
2. Import and use `formatNatural()` instead of `formatEmployeeReport()`
3. Load `company_objectives` and weigh decisions against them
4. Load `company_state` and adjust emotional stance (e.g., Security more aggressive during high stress)
5. Load `service_economics` when making business recommendations
6. Log a reflection after every major action (reasoning, expected outcome, confidence, what would change mind)
7. Remove rigid "exactly 5 insights" style instructions from prompts

Specific per-employee additions:
- **QA Watchdog**: track engineering calculator error patterns, most-used tools
- **Customer Success**: detect abandoned calculations, suggest engineering onboarding improvements
- **Sales**: prioritize high-margin scalable services from economics data
- **Investigator**: score leads against service economics
- **Advisor**: reference objectives and economics in strategic recommendations, remove rigid 5-point format

### Phase 6: New Edge Functions (4)

**1. `ayn-chief-of-staff/index.ts`** (cron: every 2h)
- Reads all employee reports from last cycle
- Checks alignment against `company_objectives`
- Updates `company_state` (momentum, stress, morale) based on signals
- Detects idle employees (no activity 24h+)
- Detects misalignment between employees
- Gates chime-in permissions
- Applies **Founder Override Layer**: flags irreversible/high-risk decisions for approval
- Updates `company_journal` quarterly

**2. `ayn-hr-manager/index.ts`** (cron: daily)
- Counts actions per employee from `ayn_activity_log`
- Measures success rate (outcomes vs attempts via reflections)
- Detects underperforming agents
- Suggests prompt/personality adjustments
- Updates `performance_metrics` in `employee_states`

**3. `ayn-innovation/index.ts`** (cron: every 12h)
- Reviews activity patterns and service usage
- References `service_economics` to identify scaling opportunities
- Proposes new features, calculators, experiments
- Questions existing workflows
- Stores ideas in `ayn_mind` as type `innovation_proposal`

**4. `ayn-outcome-evaluator/index.ts`** (cron: every 6h) -- Failure Memory
- Scans `employee_reflections` where `outcome_evaluated = false`
- Compares `expected_outcome` vs actual data (pipeline status, email replies, system health)
- Adjusts employee `confidence` and `beliefs` in `employee_states` (with drift guard: clamp to 0.1-0.9)
- Example: Sales aggressively pushed low-quality leads that never convert -- risk_tolerance drops
- Marks reflections as evaluated

### Phase 7: Telegram Webhook Overhaul

**System prompt rewrite** (replace `AYN_PERSONALITY`):
- Remove all rigid formatting instructions
- Add: "respond like you're in an AI executive room"
- Add: "match the founder's energy -- short question gets short answer"
- Add deliberation awareness: before major ACTION executions, check if deliberation is needed
- Add chime-in logic: employees can speak when confidence > 0.75, strong disagreement, or objective risk -- max 2 chime-ins per response, gated by Chief of Staff
- Add founder override: for irreversible/high-risk, present recommendation + confidence + risk + objective impact, wait for approval
- Load `company_state` and `company_objectives` into context

**Context gathering** updates:
- Load `company_state` into system context
- Load top 3 active `company_objectives`
- Load `service_economics` summary

### Phase 8: Frontend Update

**`src/components/admin/workforce/types.ts`** -- Add 3 new employees:

| Employee | ID | Emoji | Reports To | Gradient |
|----------|-----|-------|-----------|----------|
| Chief of Staff | chief_of_staff | 📋 | Founder | from-indigo-600 to-violet-600 |
| HR Manager | hr_manager | 👥 | Chief of Staff | from-fuchsia-600 to-pink-600 |
| Innovation Lead | innovation | 🚀 | Chief of Staff | from-lime-600 to-green-600 |

Total workforce: 13 employees.

### Phase 9: Cron Schedules

| Function | Interval | Purpose |
|----------|----------|---------|
| Chief of Staff | Every 2h | Alignment, company state, conflict detection |
| HR Manager | Daily | Performance tracking, drift detection |
| Innovation Lead | Every 12h | R&D proposals, efficiency analysis |
| Outcome Evaluator | Every 6h | Failure memory, belief adjustment |

## Implementation Sequence

1. Database migration: create 8 tables with RLS
2. Seed data: objectives, economics, company state, 13 employee states
3. Create `employeeState.ts` shared module
4. Create `deliberation.ts` shared module
5. Rewrite `aynBrand.ts` (natural tone, new personalities, kill formatting)
6. Update all existing employee edge functions (state + reflections + natural tone)
7. Create Chief of Staff edge function
8. Create HR Manager edge function
9. Create Innovation Lead edge function
10. Create Outcome Evaluator edge function
11. Update `ayn-telegram-webhook` (system prompt + deliberation + chime-in)
12. Update frontend `types.ts` with 3 new employees
13. Deploy all edge functions
14. Test via Telegram

## What This Achieves

The system goes from stateless report generators to a living company brain where employees have beliefs that evolve based on outcomes, debate before major decisions, understand the economics of each service, align every action to shared objectives, adapt tone to context, and remember what worked and what failed. The founder feels like they're inside an AI boardroom -- not reading server logs.

