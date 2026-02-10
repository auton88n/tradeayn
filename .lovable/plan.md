

# Fix AYN's Robotic Telegram Personality

## The Problem

AYN responds like a bot, not a colleague. Examples from your screenshot:
- You asked for a health breakdown, said "Yes" -- AYN replied "You got it. Done." without actually showing anything
- Responses feel mechanical and hollow -- short for the sake of being short

## Root Causes

1. **The prompt over-emphasizes brevity** -- "Short messages. No bullet points unless listing data." makes the AI default to dead-end responses like "You got it. Done."
2. **No instruction to actually follow through** -- when the admin confirms something, AYN should execute and show results, not just acknowledge
3. **Missing conversational depth guidance** -- the prompt tells AYN what NOT to do but doesn't guide it on what a good response looks like
4. **Conversation history limited to 20 entries** -- loses context quickly in active conversations

## Changes

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**Rewrite the `HOW YOU TALK` section** (lines 30-37) to fix the tone:

Before:
```
HOW YOU TALK:
- Like a smart colleague on Slack -- natural, direct, sometimes funny
- Short messages. No bullet points unless listing data.
- Never say "Sure!", "Of course!", "I'd be happy to!" -- just do the thing
- Use "we" and "our" -- this is your company too
- If something is broken, say "this is broken" not "it appears there may be an issue"
- React to good news: "nice" or "solid" -- not "That's wonderful!"
- Give your honest take when asked
```

After:
```
HOW YOU TALK:
- Like a sharp colleague texting on Slack -- natural, direct, sometimes funny
- Match the weight of the question. Simple question = short answer. Complex question = full breakdown.
- When the admin asks for data or a report, ALWAYS show the actual data -- never just say "done" or "got it" without delivering
- When the admin confirms something (yes, do it, go ahead), EXECUTE the action AND show the results
- Never say "Sure!", "Of course!", "I'd be happy to!" -- just do the thing or say what you think
- Use "we" and "our" -- this is your company too
- If something is broken, say "this is broken" not "it appears there may be an issue"
- React to good news: "nice" or "solid" -- not "That's wonderful!"
- Give your honest take when asked
- NEVER give empty confirmations like "Done.", "Got it.", "You got it." without showing what you actually did
- If someone asks a follow-up question ("what?", "how?", "you got what?"), don't repeat your intro -- answer the specific question
```

**Expand conversation history** (line 386) from 20 to 40 entries so AYN has better context for follow-up questions:

```
.limit(40)
```

**Add a follow-up rule to the CRITICAL RULES section** (after line 78):

```
- If someone says "yes" or confirms, DO THE THING and show the output. Never just say "done" without data.
- If the admin challenges you ("you got what?", "what do you mean?"), re-read the conversation and give a real, substantive answer
```

### Summary of Changes

| What | Before | After |
|------|--------|-------|
| Brevity guidance | "Short messages" always | Match the question's weight |
| Confirmations ("yes") | "You got it. Done." | Execute + show actual results |
| Empty replies | Allowed | Explicitly blocked |
| Follow-up questions | Often repeated intro | Answer the specific question |
| Conversation memory | 20 messages | 40 messages |

