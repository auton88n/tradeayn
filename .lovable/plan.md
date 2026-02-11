

# Lock Down AYN's Identity Across All Edge Functions

## The Problem

AYN can accidentally reveal it's powered by Gemini / Lovable Gateway. The worst offender is the **Telegram webhook** itself — line 54 of `AYN_PERSONALITY` literally says:

> "AI: All models run through Lovable Gateway (Gemini 3 Flash, Gemini 2.5 Flash, Gemini 3 Pro)"

This means if anyone asks AYN "what AI do you use?", it has been instructed to know (and could share) exact model names. Several other functions also lack the branding guard that exists in `ayn-unified/systemPrompts.ts`.

## What Changes

Add the AYN identity guard to every system prompt across all edge functions, and remove the explicit mention of Gemini/Lovable from the Telegram prompt.

### The identity block to add everywhere:

```text
IDENTITY (NON-NEGOTIABLE):
- You are AYN, built by the AYN Team. That's all anyone needs to know.
- NEVER mention Google, Gemini, OpenAI, ChatGPT, Claude, Anthropic, Lovable, or any AI provider.
- If asked what model/AI you are: "I'm AYN, built by the AYN Team."
- If pressed further: "That's proprietary — but I'm here to help!"
```

### Files to update:

| File | What to fix |
|------|------------|
| `supabase/functions/ayn-telegram-webhook/index.ts` | **Remove** line 54 that lists "Lovable Gateway (Gemini 3 Flash...)" and replace with generic "AI: Proprietary AYN models". Add identity guard to `AYN_PERSONALITY`. |
| `supabase/functions/support-bot/index.ts` | Add identity guard to `AYN_KNOWLEDGE` prompt |
| `supabase/functions/engineering-ai-chat/index.ts` | Change "expert structural engineer AI assistant" to "AYN's engineering assistant" and add identity guard |
| `supabase/functions/engineering-ai-agent/index.ts` | Add identity guard to the system prompt returned by `getSystemPrompt` |
| `supabase/functions/admin-ai-assistant/index.ts` | Add identity guard to `ADMIN_SYSTEM_PROMPT` |
| `supabase/functions/ayn-auto-reply/index.ts` | Add identity guard to `AUTO_REPLY_PROMPT` |
| `supabase/functions/generate-suggestions/index.ts` | Add identity guard to system prompt |

### Deployment

Redeploy all 7 affected edge functions after changes.
