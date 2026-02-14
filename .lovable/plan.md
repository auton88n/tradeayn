
# Make AYN Talk Like a Teammate, Not a Report Generator

## The Problem

The long structured responses with bold labels like **"Status:"**, **"Alerts:"**, **"Pass Rate:"**, `[ACTION:run_tests:calculator]` come from the `admin-ai-assistant` edge function's system prompt. It explicitly tells AYN to use "markdown formatting for clarity (tables, lists, code blocks)" and embed `[ACTION:]` tags. That's why you get a wall of structured data instead of a normal conversation.

## The Fix

### 1. Rewrite the System Prompt (`supabase/functions/admin-ai-assistant/index.ts`)

Replace the current report-style instructions with a conversational directive:

**Current prompt says:**
- "Use markdown formatting for clarity (tables, lists, code blocks)"
- "Include specific numbers and percentages"
- "Be proactive: suggest actions when issues are detected"
- Uses `[ACTION:...]` tags inline in responses

**New prompt will say:**
- Talk like a teammate in a chat -- 1-3 sentences max
- No headers, no bold labels, no structured sections
- Mention key numbers naturally ("5 tests are failing" not "Pass Rate: 0.0%")
- Actions become simple suggestions ("want me to run the calculator tests?" instead of `[ACTION:run_tests:calculator]`)
- Only use detail if the user asks for more

### 2. Keep Actions Working Behind the Scenes

The `[ACTION:]` tags are parsed by the frontend to create clickable buttons. Instead of removing them entirely, hide them at the end of the message so the UI can still parse them but they don't clutter the conversation.

### 3. Reduce max_tokens

The current function likely allows long responses. Cap it to encourage brevity.

## Example: Before vs After

**Before (current):**
```
Security & Access
Status: 3 High-severity alerts detected.
Alerts: Unusual access to admin_contact_messages and rate limit violations.
Rate Limits: User 0000... has 10 violations.
Users: 14 Total (9 Active).
Engineering Check (CRITICAL FAILURE)
Pass Rate: 0.0% (0/5 tests passed).
Affected Suite: api_health.
...
[ACTION:run_tests:calculator]
[ACTION:scan_health:full]
```

**After (new):**
```
Heads up -- all 5 engineering calculators are down right now. Also seeing 3 security alerts, one user with 10 rate limit violations. Want me to run diagnostics on the calculators?
```

## Technical Details

### File: `supabase/functions/admin-ai-assistant/index.ts`

1. Replace `ADMIN_SYSTEM_PROMPT` (lines 12-57) with a conversational version:
   - Remove "Use markdown formatting" instruction
   - Add "Talk in 1-3 sentences like a real colleague. No headers, no bold labels, no structured reports."
   - Keep `[ACTION:]` tags but instruct the LLM to place them on the last line only, not inline
   - Change response guidelines to prioritize brevity

2. Reduce `max_tokens` in the LLM call to ~300 to discourage lengthy responses

### File: `src/components/admin/AdminAIAssistant.tsx`

1. Update the action tag parsing to strip them from the displayed message (so they only power buttons, not clutter the chat)
2. If action tags exist, render them as small suggestion chips below the message instead of inline text
