
# Migrate All OpenAI Calls to Lovable AI Gateway

## Problem

9 edge functions are calling `api.openai.com` directly using `OPENAI_API_KEY`, which means:
- Separate OpenAI billing you can't control from one place
- AYN has no visibility into failures (the engineering tools broke and he didn't know)
- No unified rate limit management

Plus `ai-improvement-advisor` uses a wrong Lovable URL (`api.lovable.dev` instead of `ai.gateway.lovable.dev`).

## Functions to Migrate

| Function | Current Model | New Model (Lovable Gateway) |
|----------|--------------|---------------------------|
| `generate-grading-design` | gpt-4o-mini | google/gemini-3-flash-preview |
| `generate-emotion-keywords` | gpt-4o-mini | google/gemini-3-flash-preview |
| `generate-design` | gpt-4o | google/gemini-2.5-flash |
| `engineering-ai-assistant` | gpt-4o-mini | google/gemini-3-flash-preview |
| `support-bot` | gpt-4o-mini | google/gemini-3-flash-preview |
| `ai-email-assistant` | gpt-4.1 | google/gemini-2.5-flash |
| `ai-caption-generator` | gpt-4o | google/gemini-2.5-flash |
| `analyze-autocad-design` | gpt-4o-mini | google/gemini-3-flash-preview |
| `ai-visual-tester` | gpt-4o / gpt-4o-mini | google/gemini-2.5-flash / google/gemini-3-flash-preview |
| `ai-improvement-advisor` | gpt-4o-mini (wrong URL) | google/gemini-3-flash-preview (fix URL) |

**Model mapping logic:**
- `gpt-4o-mini` / `gpt-4.1` (lighter tasks) -> `google/gemini-3-flash-preview` (fast, cheap)
- `gpt-4o` (vision/complex tasks) -> `google/gemini-2.5-flash` (stronger reasoning)

## What Changes Per Function

For each of the 9 OpenAI functions, the same 3-line change:

1. Replace `OPENAI_API_KEY` with `LOVABLE_API_KEY`
2. Replace `https://api.openai.com/v1/chat/completions` with `https://ai.gateway.lovable.dev/v1/chat/completions`
3. Update the model name to the Lovable Gateway equivalent
4. Add 402/429 error handling for rate limits and payment issues

For `ai-improvement-advisor`: fix the URL from `api.lovable.dev` to `ai.gateway.lovable.dev`.

## Error Handling

Each function will get proper error handling for Lovable Gateway responses:
- **429** (rate limited): return a friendly error instead of crashing
- **402** (payment required): return a clear message about credits

## Deployment

All 10 functions will be redeployed after the changes.

## Result

- All AI calls go through one billing system (Lovable AI credits)
- No more surprise OpenAI charges
- AYN can monitor failures since everything is in one system
- Consistent error handling across all functions
