

# Fix: Creative Editor Buttons Cut Off + Height Constraint

## Problem

The Creative Editor dialog has `min-h-[540px]` on its inner grid but no `max-h` constraint. On smaller viewports, the action buttons (Generate Creative / Download) are pushed below the visible area. The right panel's ScrollArea works correctly in isolation, but the overall dialog is not constrained to the viewport.

## Fix

A single targeted change to `src/components/admin/marketing/CreativeEditor.tsx`:

1. Add `max-h-[85vh]` to the `DialogContent` so the entire dialog never exceeds the viewport
2. Change `min-h-[540px]` to `h-[85vh] max-h-[700px]` on the grid so it fills available space but caps out
3. Add `overflow-hidden` to the right column so the ScrollArea properly constrains
4. Ensure the action buttons div has `shrink-0` so it never gets compressed by flex

### Technical Change

```
File: src/components/admin/marketing/CreativeEditor.tsx

Line 62: DialogContent
- Before: className="max-w-5xl p-0 overflow-hidden"
- After:  className="max-w-5xl max-h-[85vh] p-0 overflow-hidden"

Line 63: Grid container
- Before: className="grid grid-cols-1 md:grid-cols-5 min-h-[540px]"
- After:  className="grid grid-cols-1 md:grid-cols-5 h-[85vh] max-h-[700px]"

Line 91: Right column
- Before: className="md:col-span-2 flex flex-col"
- After:  className="md:col-span-2 flex flex-col overflow-hidden"

Line 197: Action buttons container
- Before: className="p-5 border-t space-y-2"
- After:  className="p-5 border-t space-y-2 shrink-0"
```

These 4 small class changes will ensure the dialog fits within the viewport and the Generate/Download buttons are always visible at the bottom.

