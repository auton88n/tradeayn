

# Fix: History Card Fitting (for real this time)

## Root Cause

The previous fix used `max-h-[50vh]` on the outer card + `flex-1 min-h-0` on inner containers. This doesn't work reliably because `max-height` alone doesn't give flex children a definite reference height to resolve `flex-1` against -- the content still expands unconstrained.

## Fix

### File: `src/components/eye/ResponseCard.tsx`

**1. Scroll container -- direct height constraint instead of flex-1 chain**

Replace the `flex-1 min-h-0` approach on the scroll container (line 373) with an explicit `max-h-[calc(50vh-5rem)]` (subtracting ~80px for header + footer). This guarantees the scroll area is bounded regardless of content size.

Change line 369 (history wrapper):
- From: `relative flex-1 min-h-0 flex flex-col`
- To: `relative flex flex-col`

Change line 373 (scroll div):
- From: `flex-1 min-h-0 overflow-y-auto overflow-x-hidden`
- To: `max-h-[calc(50vh-5rem)] sm:max-h-[calc(60vh-5rem)] overflow-y-auto overflow-x-hidden`

Remove `max-h-[50vh] sm:max-h-[60vh]` from the outer motion.div (line 310) since the constraint is now directly on the scroll area.

**2. Scroll-to-bottom button -- account for Reply footer**

Move the button's bottom offset from `bottom-3` to `bottom-14` so it sits above the Reply footer instead of overlapping it.

## Summary
- 1 file modified: `src/components/eye/ResponseCard.tsx`
- Direct height cap on scroll container instead of unreliable flex-1 chain
- Scroll button repositioned above Reply footer
