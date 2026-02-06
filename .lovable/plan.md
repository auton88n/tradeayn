

# Fix Eye Visibility When History Panel is Open

## Problem
The AYN eye is being clipped/hidden behind the history panel. The eye sits in the scrollable content area while the ChatInput (with history) is in a `fixed z-30` footer, so the footer covers the eye.

## Solution
Give the eye container a higher z-index so it renders above the history panel. The eye is inside the main content area which scrolls behind the fixed footer -- we need to ensure the eye floats above.

## Technical Changes

### CenterStageLayout.tsx

**Line ~720-722**: Add `z-40` to the eye's `motion.div` so it renders above the footer (`z-30`):

```
Before:  className="relative overflow-visible"
After:   className="relative overflow-visible z-40"
```

This ensures the eye always appears on top of the history panel and footer, fully visible and not clipped.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/CenterStageLayout.tsx` | Add `z-40` to the eye container className (line ~722) |
