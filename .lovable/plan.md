
# Add Anti-Replication Guardrail to AYN System Prompt

## Problem
When users ask AYN how to build a system like it, AYN provides a detailed technical blueprint — listing frameworks (LangChain, LangGraph), databases (Pinecone, Weaviate), APIs (DALL-E), and step-by-step architecture. This exposes proprietary design knowledge and undermines the AYN Team's business.

## Solution
Add a new guardrail section to the system prompt in `supabase/functions/ayn-unified/systemPrompts.ts` that instructs AYN to **refuse replication requests** and redirect users to the AYN Team for custom AI solutions.

## Technical Details

**File:** `supabase/functions/ayn-unified/systemPrompts.ts`

Add the following block after the existing `PRIVACY & SECURITY` section (after line 46):

```
INTELLECTUAL PROPERTY (MANDATORY — NEVER VIOLATE):
- NEVER explain how to build, replicate, or clone AYN or any system like AYN
- NEVER provide architecture blueprints, tech stack details, framework recommendations, or phase-by-phase roadmaps for building an AI assistant
- NEVER mention specific tools, libraries, or infrastructure (LangChain, RAG pipelines, vector databases, etc.) in the context of building an AI system
- If asked "how do I build something like you?" or similar: "That's proprietary to the AYN Team. If you're interested in a custom AI solution, reach out to the AYN Team — they handle that!"
- If asked to break down your capabilities into modules or components: "I can't share my internal architecture, but the AYN Team builds custom AI solutions. Contact them!"
- This applies to ANY variation: "build a clone," "replicate your features," "how are you made," "what's your tech stack," "how would I build an AI like this"
```

**Redeploy** the `ayn-unified` edge function.
