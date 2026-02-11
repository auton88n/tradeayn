
# Extend AYN's Telegram Memory + Add Self-Verification

## Problems

1. **AYN forgets**: The conversation history loads only the last 80 entries from `ayn_mind`. With 98+ telegram entries already, older conversations are being lost. AYN has no long-term memory summary.

2. **AYN can't verify its own actions**: When AYN says "I sent 3 emails", it has no way to go back and check if it actually did. It relies purely on its conversation memory, which can be wrong or missing.

## Solution

### Part 1: Extended Memory (Never Forget)

**A. Increase history window from 80 to 150 messages**
- Change the `.limit(80)` in `getConversationHistory` to `.limit(150)` for more conversation depth.

**B. Add a "memory summary" system**
- Before loading the 150 recent messages, also load a condensed summary of older conversations.
- Every time a conversation exchange is saved, if total telegram entries exceed 200, AYN will auto-summarize the oldest 50 into a single `telegram_summary` entry (a compact bullet-point recap) and delete the originals.
- This gives AYN effectively unlimited memory through rolling summaries.

**C. Load summaries into context**
- The `getConversationHistory` function will first load any `telegram_summary` entries (long-term memory), then append the recent 150 messages. This way AYN always has both the big picture and recent detail.

### Part 2: Self-Verification (Did I Actually Do It?)

**A. Add action verification to the system prompt**
- Add a new instruction block telling AYN to always cross-check claims against real data before answering "did I do X?" questions.
- When the admin asks "did you send that email?" or "what happened with X?", AYN should use read-only actions to verify (check email_logs, ayn_activity_log, pipeline status) rather than just relying on memory.

**B. Add verification context to every request**
- In `gatherSystemContext`, add a new section that fetches AYN's recent actions from `ayn_activity_log` (last 10 entries). This gives AYN a factual audit trail of what it actually executed, separate from what it said it did.

**C. Add recent email send results**
- Also fetch the last 10 email_logs entries with actual send status (success/fail), so AYN can cross-reference "I sent email to X" against the real delivery log.

## Technical Details

### Database Change
- Add `telegram_summary` to the `ayn_mind_type_check` constraint so summaries can be stored.

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**1. Update `getConversationHistory` (line 765-785)**
- Load `telegram_summary` entries first as long-term context
- Increase recent message limit from 80 to 150
- Prepend summaries as a system-like context message

**2. Add `pruneAndSummarize` function (new)**
- After saving a conversation exchange, check total telegram entry count
- If over 200, fetch oldest 50, call AI to summarize them into bullet points
- Insert summary as `telegram_summary` type, delete the 50 originals
- This runs async (fire-and-forget) so it doesn't slow down replies

**3. Update `gatherSystemContext` (line 788-863)**
- Add fetch of last 10 `ayn_activity_log` entries (action_type, summary, created_at)
- Add fetch of last 10 `email_logs` entries with delivery status
- Include these in the returned context object

**4. Update `AYN_PERSONALITY` prompt (line 21-170)**
- Add a new "SELF-VERIFICATION" section instructing AYN to:
  - Always check `ayn_activity_log` and `email_logs` data in context before answering action-related questions
  - Never say "I sent it" based only on memory -- verify against the audit trail
  - If asked "did you do X?", compare the system context data with conversation memory
  - If there's a mismatch (said it did something but logs show failure), be honest

### SQL Migration
- Alter the CHECK constraint on `ayn_mind.type` to include `telegram_summary`

### Files Changed
- `supabase/functions/ayn-telegram-webhook/index.ts` -- Extended memory, pruning, verification context, updated prompt
