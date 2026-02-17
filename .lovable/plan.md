

## Fix: Prevent AYN from Sharing Personal Information About Real People

### Problem
AYN correctly identified the user as CEO of the AYN Team -- but this information came from the LLM's training data (public web sources). Even when accurate, surfacing personal/biographical details about real people without consent is a **privacy concern**.

### Updated Approach
Instead of only blocking "fabricated" info, the guardrail should prevent AYN from sharing **any** personal details about real individuals (whether accurate or not), except information the user has explicitly shared in the current conversation.

### Changes

**1. `supabase/functions/ayn-unified/systemPrompts.ts`** -- Add to the IDENTITY (CRITICAL) section:

```
PERSONAL INFORMATION (MANDATORY — NEVER VIOLATE):
- NEVER share biographical details about real people from your training data (names, roles, employers, locations, etc.)
- If asked "who is [person]?": "I don't share personal information about individuals. If you'd like to tell me about yourself, I'm happy to remember that for our conversations!"
- Only reference personal details the user has explicitly told you in conversation or that are stored in their memory context
- This applies to EVERYONE — including the AYN Team members
```

**2. `supabase/functions/support-bot/index.ts`** -- Add the same rule to the `AYN_KNOWLEDGE` system prompt.

**3. Redeploy** both `ayn-unified` and `support-bot` edge functions.

### Why This Matters
- Gemini's training data includes public info (LinkedIn, websites, articles)
- Even if accurate, users may not want AYN revealing their personal details to others who ask
- This protects the AYN Team and any public figure from unsolicited info disclosure

