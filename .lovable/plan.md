

# Fix: History Card Scroll-to-Bottom Button

## Problem
The scroll-to-bottom button exists in the code (lines 408-421 of ResponseCard.tsx) but is not appearing. The root cause is a combination of issues:

1. **Auto-scroll on open** (lines 237-247) scrolls to bottom immediately, so the button correctly hides -- but when the user scrolls UP, the button should appear and it doesn't reliably do so.
2. **The `relative` wrapper** (line 362) may not have an explicit height, causing the `absolute bottom-4` positioning to misplace the button or have it clipped by the card's `overflow-hidden`.
3. **Race condition**: The ResizeObserver and auto-scroll effects both run on `transcriptOpen` change, and the scroll check may run before the DOM has fully laid out.

## Fix

### ResponseCard.tsx -- Scroll Button Positioning (lines 362-422)

**A. Make the wrapper a proper positioning context with constrained height:**
- Change the outer `<div className="relative">` to also carry the height constraints currently on the scroll div, so the absolute button has a correctly-sized parent.
- Move `max-h-[50vh] sm:max-h-[60vh]` to the outer relative wrapper, and make the inner scroll div `h-full overflow-y-auto`.

**B. Add a delayed initial check:**
- After auto-scrolling on open, schedule a 100ms delayed check of the scroll position to correctly set `showHistoryScrollDown`. This handles the race condition where the ResizeObserver fires before layout is complete.

**C. Make the button more visible:**
- Increase size to `h-10 w-10` with `shadow-xl` 
- Use `bg-primary text-primary-foreground` for better contrast
- Position at `bottom-3 left-1/2 -translate-x-1/2` (bottom-center) for discoverability
- Add a subtle bounce animation on appear

**D. Lower the scroll threshold:**
- Change the threshold from `> 50` to `> 100` so the button appears sooner when the user scrolls even slightly away from the bottom.

### Summary of Changes
- **1 file modified**: `src/components/eye/ResponseCard.tsx`
- Fix positioning context so absolute button renders correctly
- Add delayed initial scroll check to handle race condition
- Restyle button for better visibility (centered, larger, primary color, shadow)

