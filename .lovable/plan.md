
# Fix Chat History Gap Issue

## Problem
The chat history panel has a fixed height of 256px (`h-64`) which creates a large empty gap when there are only a few messages.

## Solution
Change the ScrollArea from fixed height to maximum height so it only takes up as much space as needed:
- Change `h-64` to `max-h-64`
- This allows the panel to shrink when there are few messages and expand up to 256px when there are many

## File to Modify

**`src/components/dashboard/ChatInput.tsx`** (line 477)

Change:
```tsx
<ScrollArea className="h-64" ref={historyScrollRef}>
```

To:
```tsx
<ScrollArea className="max-h-64" ref={historyScrollRef}>
```

## Visual Result

**Before (fixed height):**
```text
+---------------------------------------------------+
| AYN Engineering                      [Clear] [X]  |
+---------------------------------------------------+
| [AYN message]                                     |
|                                                   |
|          (large empty gap - 256px fixed)          |
|                                                   |
+---------------------------------------------------+
| [Text input area]                                 |
+---------------------------------------------------+
```

**After (max height):**
```text
+---------------------------------------------------+
| AYN Engineering                      [Clear] [X]  |
+---------------------------------------------------+
| [AYN message]                                     |
+---------------------------------------------------+
| [Text input area]                                 |
+---------------------------------------------------+
```

When more messages are added, the panel will expand up to 256px, then become scrollable.
