
Root causes found:
1. `src/hooks/useChartCoach.ts` sends stale history (`messages.slice(-10)`) and does not include the current user input in `messages` payload.
2. `supabase/functions/ayn-unified/index.ts` reads only `messages` (not the top-level `message`), so the backend often receives an assistant message as the last turn.
3. With an assistant-last payload, the backend returns `intent: "chat"` and can return `content: ""`; frontend then shows the fallback: “I couldn't process that. Try asking about your chart setup.”

Implementation steps:
1. In `useChartCoach.ts`, send `conversationMessages` (already built) in the invoke body so the latest user message is always the final message sent to `ayn-unified`.
2. In `ayn-unified/index.ts`, add a defensive normalization step: if request has `message` and `messages` is empty or last role is not `user`, append `{ role: 'user', content: message }` before intent detection.
3. Keep `mode: 'trading-coach'` and `stream: false` as-is; add a frontend guard for empty `data.content` to surface backend metadata (`intent`, `model`) for debugging instead of silent generic fallback.
4. Validate on Preview (as confirmed): send “hello” in a fresh chat and verify request body last item is the user message, response has non-empty `content`, and `intent` is `trading-coach`.
5. Run one regression pass for image+text flow in `ChartUnifiedChat.tsx` to confirm chart upload still returns assistant analysis.
