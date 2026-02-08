

# Fix: History Card Overflow — Final Tweaks

The last edit got 90% of the way there. Two small remaining fixes in `src/components/eye/ResponseCard.tsx`:

## Changes

### 1. Scroll container — add `overscroll-contain` (line 373)
Add `overscroll-contain` to the scroll container's classes to prevent scroll chaining (where scrolling inside the card accidentally scrolls the page).

Current: `max-h-[60vh] overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch]`
New: `max-h-[60vh] overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch]`

### 2. Scroll-to-bottom button — fix position (line 422)
Move from `bottom-14` to `bottom-2` as specified. The button should float just above the bottom of the scroll area, not high up in the card. It uses `absolute` positioning within the history wrapper, so `bottom-2` places it correctly above the reply footer since it's inside the scroll area's sibling container.

Current: `absolute bottom-14 left-1/2 ...`
New: `absolute bottom-2 left-1/2 ...`

Also reduce size to 36px (`h-9 w-9`) per the spec.

## Summary
- 1 file modified: `src/components/eye/ResponseCard.tsx`
- 2 small class changes: add overscroll-contain, fix button position
