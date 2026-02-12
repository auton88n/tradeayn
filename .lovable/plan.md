

# Fix: More Agents + Concise Replies in War Room

## Problem 1: Only 3 Agents Show Up
The keyword matching is too narrow. For messages like "hello", "where is the rest", none of the keywords trigger, so the fallback always gives the same 3: AYN, Chief of Staff, and Advisor.

**Fix**: Change the fallback logic. When fewer than 4 agents are matched by keywords, randomly pull from the full roster to fill up to 5-6 agents. This ensures every discussion feels like a real team meeting.

## Problem 2: Replies Are Too Long
The prompt says "2-4 sentences" but the LLM ignores it and writes full paragraphs. 

**Fix**: 
- Change prompt to say "Reply in 1-2 SHORT sentences. Maximum 30 words. Be punchy, not verbose."
- Add `max_tokens: 80` to the API call to hard-cap response length
- For the first speaker (AYN), allow slightly more: "2-3 sentences max"

## Technical Changes

### File: `supabase/functions/admin-war-room/index.ts`

1. **Expand agent selection** (lines 11-31):
   - Define the full roster: `system`, `chief_of_staff`, `advisor`, `sales`, `marketing`, `security_guard`, `lawyer`, `innovation`, `customer_success`, `qa_watchdog`
   - Keep keyword matching for relevance
   - When fewer than 5 agents selected, randomly fill from remaining roster up to 5-6 agents
   - Remove the `.slice(0, 5)` cap or raise it to 6

2. **Make replies concise** (lines 101-116):
   - Change prompt from "Keep it SHORT (2-4 sentences)" to "Reply in 1-2 sentences MAX. Be punchy and direct. No fluff."
   - For the first speaker: "Set the direction in 2 sentences max."
   - Add `max_tokens: 80` to the API request body (line 122-125)

3. **Redeploy** the `admin-war-room` edge function

### No UI changes needed
The `WarRoomPanel.tsx` already handles any number of agents and message lengths correctly.
