
Goal: Restore the ResponseCard display reliably (no “snag”, no missing card) by fixing the new race condition introduced by updating `lastProcessedMessageContent` state inside the same `useEffect` that schedules the response emission.

What’s actually broken right now
- In `src/components/dashboard/CenterStageLayout.tsx`, the “Process AYN responses” effect does this sequence:
  1) Detects a new AYN message
  2) Calls `setLastProcessedMessageContent(lastMessage.content)` (state update)
  3) Schedules `setTimeout(...emitResponseBubble...)`
  4) Returns a cleanup that `clearTimeout(timeoutId)`
- Because `lastProcessedMessageContent` is in the effect dependency array, step (2) immediately causes the effect to re-run.
- React runs the cleanup from the previous run before running the new one, so the scheduled timeout is cleared before it fires.
- Result: `emitResponseBubble(...)` never runs → `responseBubbles` stays empty → ResponseCard never appears.

High-confidence fix approach
Replace the “already processed” tracking from state (which triggers re-renders/effect restarts) to a ref keyed on message identity (which does not trigger re-renders). This prevents the “cleanup clears timeout before it runs” loop.

Implementation steps (code changes)
1) CenterStageLayout: Replace `lastProcessedMessageContent` state with a ref-based guard
   - Add a ref, for example:
     - `const lastProcessedAynMessageIdRef = useRef<string | null>(null);`
   - Remove:
     - `const [lastProcessedMessageContent, setLastProcessedMessageContent] = useState<string | null>(null);`
   - Update all resets that currently call `setLastProcessedMessageContent(null)` to instead set:
     - `lastProcessedAynMessageIdRef.current = null;`
     - (These resets exist in the “messages cleared” effect and “currentSessionId changed” effect.)

2) CenterStageLayout: Update the processing condition to compare message IDs (not content)
   - Current:
     - `if (lastMessage.sender === 'ayn' && lastMessage.content !== lastProcessedMessageContent) { ... }`
   - Change to:
     - `if (lastMessage.sender === 'ayn' && lastMessage.id !== lastProcessedAynMessageIdRef.current) { ... }`
   - Then set the ref immediately when you decide to process:
     - `lastProcessedAynMessageIdRef.current = lastMessage.id;`
   - Important: do NOT call any state setter that is included in this effect’s dependency list before the timeout executes.

3) CenterStageLayout: Remove `lastProcessedMessageContent` from the effect dependency array
   - Because it will no longer exist.
   - This prevents the immediate effect restart cycle.

4) CenterStageLayout: Keep timeout cleanup, but ensure it only cancels real superseded work
   - With the state update removed, the effect should not re-run immediately anymore, so clearing the timeout in cleanup becomes safe again.
   - Optional safety improvement:
     - Store a `processingToken` in a ref (incrementing number) and only allow the timeout callback to emit if it matches the latest token. This avoids edge cases where multiple message updates happen quickly.

5) CenterStageLayout: Make `responseProcessingRef` lifecycle robust (prevents stale suggestions)
   - Set `responseProcessingRef.current.active = false` at the start of sending a new message (in `handleSendWithAnimation`) and when switching sessions (currentSessionId effect).
   - This ensures old delayed suggestion fetches don’t fire after a new message/session.

6) Add minimal DEV-only logs to confirm the fix (optional but recommended while stabilizing)
   - Log when:
     - gate is active
     - lastMessage isTyping transitions
     - processing starts (message id)
     - emitResponseBubble is called
   - This makes it immediately visible if the app is skipping processing due to gate/id checks.

Files to change
- src/components/dashboard/CenterStageLayout.tsx
  - Replace `lastProcessedMessageContent` state with `lastProcessedAynMessageIdRef`
  - Update processing condition and resets
  - Update effect dependencies
  - Optionally harden `responseProcessingRef` reset

Testing checklist (end-to-end)
1) Send a message, wait for AYN to finish streaming:
   - ResponseCard should appear consistently.
2) Send multiple messages quickly:
   - Each should produce a ResponseCard.
3) Switch chats while AYN is responding:
   - No ErrorBoundary crash; old ResponseCard should not “auto-show” in the new chat.
4) Verify the original “rzan” scenario:
   - No “Oops! snag” and ResponseCard visible every time.

Why this will work
- The root cause is the effect restarting itself via a dependency-changing state update; moving “processed tracking” to a ref removes that trigger.
- With no immediate restart, the scheduled timeout is not cleared before it fires, so `emitResponseBubble` executes and the ResponseCard renders as designed.
