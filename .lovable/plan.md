
# Fix ScrollArea Height Issue in Chat History

## Problem
When opening the chat history, the input area shrinks because the Radix `ScrollArea` component's internal `Viewport` uses `h-full w-full` which doesn't work properly with `max-h-64` on the parent. The viewport needs an explicit height to calculate "100%" from.

## Root Cause
In `scroll-area.tsx` (line 14):
```tsx
<ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
```

When the parent `ScrollArea` has `max-h-64`, the viewport's `h-full` (100% height) has no explicit height to reference, causing layout issues.

## Solution
Instead of modifying the shared `ScrollArea` component (which could break other usages), wrap the messages in a container with explicit max-height constraints.

**Change in `ChatInput.tsx`:**

Replace:
```tsx
<ScrollArea className="max-h-64" ref={historyScrollRef}>
  <div className="p-3 space-y-1">
    {/* messages */}
  </div>
</ScrollArea>
```

With:
```tsx
<div className="max-h-64 overflow-y-auto" ref={historyScrollRef}>
  <div className="p-3 space-y-1">
    {/* messages */}
  </div>
</div>
```

This uses native overflow scrolling which works correctly with `max-height` and will shrink to fit content naturally.

## File to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/ChatInput.tsx` | Replace `ScrollArea` with a native scrollable `div` for the history messages |

## Benefits
- Works correctly with `max-height` for dynamic sizing
- Shrinks to fit content when few messages
- Scrolls when content exceeds 256px
- No impact on other components using `ScrollArea`
