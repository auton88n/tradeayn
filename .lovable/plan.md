

## Fix: Click Anywhere in Input Area to Focus Cursor

### Problem

The chat input container looks like one big text field, but only clicking directly on the small textarea element focuses it. Clicking the surrounding padding or empty space does nothing, making it feel like you have to find the exact right spot.

### Solution

Make the entire input row (Row 1) act as a click target that focuses the textarea. Also ensure the textarea fills the full width and height of its container so clicks register properly.

### Technical Details

**File: `src/components/dashboard/ChartCoachChat.tsx`**

Two changes:

1. **Add `onClick` to the Row 1 wrapper div** (line 338) so clicking anywhere in the input area focuses the textarea:
   ```
   <div className="flex items-end gap-2 px-4 pt-3 pb-2 cursor-text"
        onClick={() => textareaRef.current?.focus()}>
   ```

2. **Make the textarea fill its container** by adding `w-full` to ensure it spans the full width (line 350-353):
   ```
   className="resize-none pl-0.5 pr-0 py-3 min-h-[44px] max-h-[120px] w-full text-base ..."
   ```

Same fix applied to `EngineeringAIChat.tsx` for consistency.

| File | Change |
|------|--------|
| `src/components/dashboard/ChartCoachChat.tsx` | Add `cursor-text` + `onClick` to input row div, add `w-full` to textarea |
| `src/components/engineering/EngineeringAIChat.tsx` | Same fix for consistency |

