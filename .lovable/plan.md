
# Fix Plan: Intermittent ResponseCard Display

## Problem Identified

The ResponseCard appears inconsistently (sometimes shows, sometimes doesn't) due to a **cleanup timing issue** in the response processing `useEffect`.

### Root Cause

The effect has many dependencies beyond just `messages`:

```javascript
[
  messages,              // ← this is the trigger
  isLoadingFromHistory,
  lastSuggestedEmotion,  // ← changes during streaming!
  setEmotion,
  setIsResponding,
  emitResponseBubble,
  triggerBlink,
  detectExcitement,
  debouncedFetchAndEmitSuggestions,
  lastUserMessage,       // ← changes when user sends
  selectedMode,
  orchestrateEmotionChange,
  playSound,
  bumpActivity,
]
```

When **any** of these dependencies change after the timeout is scheduled but before it fires, React:
1. Runs the cleanup function → `clearTimeout(timeoutId)` cancels the pending emission
2. Re-runs the effect → but now `lastProcessedAynMessageIdRef.current` already equals the message ID
3. The ID check fails → processing block is skipped
4. **Result: `emitResponseBubble` never called**

### Why It's Intermittent

- **Works**: Dependencies stay stable for the 50ms window → timeout fires → card appears
- **Fails**: `lastSuggestedEmotion` or another dependency updates within 50ms → timeout canceled → no card

---

## Solution

**Move the timeout logic outside the effect's cleanup scope** by using a ref to track the timeout ID and only clearing it when we intentionally want to cancel (session change, messages cleared), not on every effect re-run.

### Technical Changes

**File: `src/components/dashboard/CenterStageLayout.tsx`**

1. **Add a persistent timeout ref** (near line 167):
   ```tsx
   const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   ```

2. **Store timeout in ref instead of local variable** (around line 557):
   ```tsx
   // Before:
   const timeoutId = setTimeout(() => { ... }, 50);
   return () => { clearTimeout(timeoutId); ... };
   
   // After:
   responseTimeoutRef.current = setTimeout(() => { ... }, 50);
   // No cleanup that clears this timeout on dependency changes
   ```

3. **Remove the cleanup function that clears the timeout** from this effect:
   - The current cleanup cancels legitimate pending emissions
   - Instead, only clear the timeout in explicit reset scenarios

4. **Clear timeout only in intentional reset locations**:
   - Messages cleared effect (line 236-245)
   - Session change effect (line 249-256)
   - Start of `handleSendWithAnimation` (line 406)
   
   Add to each:
   ```tsx
   if (responseTimeoutRef.current) {
     clearTimeout(responseTimeoutRef.current);
     responseTimeoutRef.current = null;
   }
   ```

5. **Keep `responseProcessingRef.active = false`** in the timeout callback after emission completes (not in cleanup):
   ```tsx
   setTimeout(() => {
     try {
       // ... emit bubble ...
       emitResponseBubble(response, bubbleType, attachment);
       
       // Mark processing complete AFTER emission
       responseProcessingRef.current.active = false;
       
       // ... suggestion fetch ...
     } catch (error) { ... }
   }, 50);
   ```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Line ~167 | Add `responseTimeoutRef = useRef<NodeJS.Timeout \| null>(null)` |
| Line ~240 | Add timeout clear in "messages cleared" effect |
| Line ~253 | Add timeout clear in "session change" effect |
| Line ~406 | Add timeout clear in `handleSendWithAnimation` |
| Line ~557 | Use `responseTimeoutRef.current = setTimeout(...)` |
| Line ~595 | Move `responseProcessingRef.current.active = false` after bubble emission |
| Line ~613-616 | Remove the cleanup function entirely from this effect |

---

## Why This Will Work

1. **Timeout persists across dependency changes**: Using a ref means React's cleanup doesn't cancel the emission
2. **Intentional cancellation only**: Timeout is only cleared when we truly want to reset (new send, session switch, messages cleared)
3. **ID-based deduplication still works**: The `lastProcessedAynMessageIdRef` prevents duplicate processing
4. **No race conditions**: The 50ms timeout will always complete unless explicitly canceled
