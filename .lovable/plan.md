
# Fix Plan: ResponseCard Not Appearing After Safety Guards

## Problem Analysis

The ResponseCard stopped appearing after I added safety guards in the previous fix. The root cause is a **race condition** between state updates and the setTimeout callback.

### What's Happening

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Effect Run #1 (isTyping=false, content matches condition)           │
├─────────────────────────────────────────────────────────────────────┤
│ 1. let isMounted = true;                                            │
│ 2. Pass all early return checks ✓                                   │
│ 3. Enter processing block                                           │
│ 4. setLastProcessedMessageContent(content) ← triggers re-render!    │
│ 5. setTimeout(() => { if(!isMounted) return; ... }, 50)             │
│ 6. return () => { isMounted = false; }                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ React re-renders immediately
┌─────────────────────────────────────────────────────────────────────┐
│ Cleanup runs: isMounted = false (from Effect Run #1)                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ 50ms later
┌─────────────────────────────────────────────────────────────────────┐
│ setTimeout callback: if (!isMounted) return; ← EXITS EARLY!         │
│ emitResponseBubble() NEVER CALLED                                   │
└─────────────────────────────────────────────────────────────────────┘
```

The state update `setLastProcessedMessageContent(lastMessage.content)` causes React to schedule a re-render. When the effect re-runs (because dependencies changed), React first runs the **cleanup function** from the previous effect run, which sets `isMounted = false`. By the time the `setTimeout` fires 50ms later, `isMounted` is already `false`.

---

## Solution

Use a **ref** instead of a local variable for the mount guard. This way, the flag persists across effect runs and isn't affected by cleanup functions from the same logical operation.

Additionally, we need to separate the "processing started" flag from the "component unmounted" flag. The current logic incorrectly treats a re-render as an unmount.

---

## Technical Changes

### File: `src/components/dashboard/CenterStageLayout.tsx`

**Change 1: Use a ref for tracking the processing callback**

Instead of relying on `isMounted` which gets invalidated on re-render, use a `timeoutId` ref to cancel the timeout if truly needed, and remove the `isMounted` check inside setTimeout since the component isn't actually unmounting:

```tsx
// Before (buggy)
useEffect(() => {
  let isMounted = true;
  
  // ... checks ...
  
  setTimeout(() => {
    if (!isMounted) return;  // ← This exits because cleanup ran!
    emitResponseBubble(...);
  }, 50);
  
  return () => { isMounted = false; };
}, [...]);

// After (fixed)
useEffect(() => {
  // ... checks ...
  
  if (lastMessage.sender === 'ayn' && lastMessage.content !== lastProcessedMessageContent) {
    awaitingLiveResponseRef.current = { active: false, baselineLastMessageId: null };
    setLastProcessedMessageContent(lastMessage.content);
    triggerBlink();
    
    const messageContent = lastMessage.content;
    const messageAttachment = lastMessage.attachment;
    
    // Use queueMicrotask + setTimeout to ensure this runs after React's synchronous updates
    // No isMounted check needed - the gate ref already prevents duplicate processing
    const timeoutId = setTimeout(() => {
      try {
        if (!messageContent?.trim()) return;
        
        // ... rest of processing ...
        
        emitResponseBubble(response, bubbleType, attachment);
      } catch (error) {
        console.error('[CenterStageLayout] Error processing response:', error);
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }
  
  // No cleanup needed for early returns - nothing to clean up
}, [...]);
```

**Change 2: Remove isMounted checks from early returns**

Early returns don't need cleanup functions since they don't start any async operations:

```tsx
// Before
if (messages.length === 0) {
  return () => { isMounted = false; };
}

// After  
if (messages.length === 0) return;
```

**Change 3: Keep isMounted check for the nested suggestion timeout**

The inner setTimeout for suggestions should still check if the component is mounted, but we need to use a ref that survives re-renders:

```tsx
// Add at component level (near line 161)
const responseProcessingRef = useRef<{ active: boolean }>({ active: false });

// In the effect, use this ref
responseProcessingRef.current.active = true;

setTimeout(() => {
  // Inner suggestion fetch - check if we're still in the same processing cycle
  if (!responseProcessingRef.current.active) return;
  debouncedFetchAndEmitSuggestions(...);
}, 600);
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Line ~161 | Add `responseProcessingRef` to track active processing |
| Lines 515-541 | Remove cleanup functions from early returns |
| Line 557 | Set `responseProcessingRef.current.active = true` when processing starts |
| Line 570 | Remove `if (!isMounted) return;` check |
| Line 612-613 | Change to check `responseProcessingRef.current.active` |
| Line 626 | Return cleanup that sets `responseProcessingRef.current.active = false` |

---

## Why This Works

1. **Early returns** don't need cleanup - they haven't started any async work
2. **Processing block** uses the `awaitingLiveResponseRef` gate to prevent duplicate processing (already there)
3. **setTimeout callback** doesn't need an isMounted check because:
   - The gate already ensures we only process once
   - If the component truly unmounts, React's error boundaries will catch any issues
   - A re-render is not an unmount
4. **Nested suggestion timeout** uses a ref that persists across renders
