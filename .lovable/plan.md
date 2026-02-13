

# Part A + B: Event-Driven Agent Reactions + Lean Prompt Redesign

## Overview

Two parallel fixes that solve two different problems:
- **Part A**: Agents react immediately when you message (event-driven triggering)
- **Part B**: Agents sound human (lean prompts, 1-3 sentences, no bloat)

---

## Part A: Event-Driven Agent Triggering

### What changes

After AYN generates its reply (line 380 in the webhook), we add an **agent reaction layer** that:

1. Selects 2-4 relevant agents based on message keywords
2. Fires them in parallel with **extremely lean** LLM calls
3. Appends their 1-sentence reactions to the Telegram response

### New file: `supabase/functions/_shared/agentOrchestrator.ts`

This module contains three functions:

**`selectRelevantAgents(message)`** -- keyword mapping, returns max 4 agent IDs:
- leads/sales/pipeline/outreach -- sales, investigator, follow_up
- security/threats/attacks/blocked -- security_guard
- strategy/growth/direction -- advisor, innovation
- team/performance/employees -- hr_manager, chief_of_staff
- legal/compliance/GDPR -- lawyer
- health/uptime/errors/bugs -- qa_watchdog
- marketing/content/brand -- marketing
- customers/churn/retention -- customer_success
- casual greetings (hi/hey/morning) -- no agents (AYN solo)

**`invokeAgentsParallel(agents, founderMessage, aynTake, apiKey)`** -- for each agent, makes ONE lean LLM call with this exact system prompt structure:

```text
You are {AgentName}.

React in 1-3 sentences max.
No formatting. No headers. No bullet points.
Speak conversationally.
You may disagree.
You may ask one short question.
Never mention being an AI.
```

User message:
```text
Founder said: "{message}"
AYN said: "{aynTake}"

Your reaction?
```

That's the entire payload per agent. No services list, no economic framework, no multi-section personality.

**`formatAgentReactions(reactions)`** -- formats into clean Telegram output:
```
{AYN's response}

Sales: "one-liner"
Security: "one-liner"
```

### Changes to `supabase/functions/ayn-telegram-webhook/index.ts`

After line 494 (where `sendTelegramMessage` is called with `cleanReply`), replace with:

1. Import `agentOrchestrator`
2. Call `selectRelevantAgents(userText)`
3. If agents selected, call `invokeAgentsParallel(...)` with the lean prompts
4. Append reactions to `cleanReply`
5. Send combined message

Cron jobs keep running for background maintenance but stop sending Telegram notifications for routine status updates.

---

## Part B: Lean Prompt Redesign

### Changes to `supabase/functions/_shared/aynBrand.ts`

**Rewrite all 13 agent personalities** from verbose multi-paragraph descriptions to tight 2-3 sentence directives.

Example rewrites:

| Agent | Before (verbose) | After (lean) |
|-------|------------------|--------------|
| Sales | "You are AYN's Sales Hunter -- sharp, opportunistic..." (5 lines + 6 subsections) | "You're Sales. You find deals and close them. Short, direct, opinionated. If a lead looks weak, say so. Never more than 3 sentences." |
| Security | "You are AYN's Security Guard -- vigilant and direct..." (5 lines + 6 subsections) | "You're Security. If everything's fine, say 'all clear.' If something's wrong, be blunt and specific. Push back on ideas that open attack surfaces. 1-3 sentences." |
| Advisor | "You are AYN's Strategic Advisor -- analytical, bold..." (5 lines + 6 subsections) | "You're the Advisor. Big-picture thinking, honest takes. Say 'I think we should...' not 'analysis suggests.' Disagree when you disagree. 1-3 sentences." |

All 13 agents get the same treatment -- personality distilled to essence.

**Simplify `getEmployeePersonality()` function** from:
```
personality + Core motivation: + Uncertainty handling: + Disagreement protocol: + Economic awareness: + Company state reactivity: + identity protection + full services list + brand voice rules
```
To:
```
personality (already contains everything needed) + one-line identity protection
```

Remove: services list dump, brand voice rules list, labeled subsections. These add ~500 tokens of noise per agent call.

**Add new export: `getAgentReactionPrompt(agentId)`** -- returns the ultra-lean prompt for the orchestrator (the 6-line version shown above). This is separate from the full personality used in cron/deliberation contexts.

### Changes to `buildAynSystemPrompt()` in webhook

Trim the system prompt. Specifically:
- Keep: execution rules, identity, actions list, greeting behavior, conversation continuity
- Add: "Your team will react after you. Keep your response to 2-4 sentences unless the topic requires depth."
- Remove: redundant rules that repeat personality content

---

## Files Changed

| File | Type | What |
|------|------|------|
| `supabase/functions/_shared/agentOrchestrator.ts` | NEW | Agent selection, parallel lean LLM calls, formatting |
| `supabase/functions/_shared/aynBrand.ts` | EDIT | Rewrite 13 personalities to lean versions, simplify `getEmployeePersonality()`, add `getAgentReactionPrompt()` |
| `supabase/functions/ayn-telegram-webhook/index.ts` | EDIT | Add orchestrator call after AYN reply, trim system prompt |

## What Does NOT Change

- No new tables
- No new cron jobs
- No new scoring systems
- Deliberation engine untouched (still works for explicit "ask the team")
- Decay/political intelligence untouched
- Admin dashboard unchanged
- Existing cron jobs keep running for background state updates

## Deployment

Redeploy `ayn-telegram-webhook` after changes.

## End Result

When you message on Telegram:
1. AYN responds in 2-4 sentences
2. 2-4 relevant agents chime in with 1 sentence each
3. Total response feels like a team thread, not a system log
4. Arrives in seconds (parallel calls), not hours (cron)
5. Agents can disagree, ask questions, show personality

