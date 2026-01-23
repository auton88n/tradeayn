

# Remove Auto-dismiss Timer from ResponseCard

## Overview
Remove the 5-minute automatic dismissal timer while keeping all other ResponseCard functionality intact, including the manual dismiss button.

## Technical Change

### File: `src/hooks/useBubbleAnimation.ts`

**Current Code (lines 118-125):**
```typescript
// Auto-dismiss after 5 minutes
setTimeout(() => {
  setResponseBubbles((prev) =>
    prev.map((b) => (b.id === id ? { ...b, isVisible: false } : b))
  );
}, 300000);
```

**Change:** Remove these 7 lines from the `emitResponseBubble` function.

## Result
- Response card remains visible indefinitely
- Manual X dismiss button still works
- Card clears when sending a new message (existing behavior)
- No other functionality affected

