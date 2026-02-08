
# Fix: Remove Page-Level Scrolling from Dashboard

## Problem
The `CenterStageLayout` container has `overflow-y-auto` (line 693), allowing the entire center stage to scroll as a page. The dashboard should be a fixed app frame where only the message history scrolls internally.

## Changes

### File: `src/components/dashboard/CenterStageLayout.tsx`

**1. Lock the outer container (line 693)**
- Change `overflow-y-auto overscroll-contain` to `overflow-hidden`
- Remove the scrollbar styling classes (no longer needed since the container won't scroll)
- Remove `[-webkit-overflow-scrolling:touch]`
- Keep `min-h-0` (important for flex children to shrink properly)

This single change ensures the center stage never scrolls as a whole page. The eye, response card, and input all stay within `100dvh`. The ResponseCard/history already has its own `overflow-y-auto` for internal scrolling of messages.

### File: `src/components/Dashboard.tsx`

**2. Lock the outermost dashboard wrapper (line 167)**
- Change `min-h-screen` to `h-dvh overflow-hidden` on the root `<div>` so the page itself cannot scroll under any circumstances.

## What stays the same
- Eye shrink/grow behavior is untouched
- ResponseCard and history card internal scrolling (`overflow-y-auto`) remains
- Chat input stays fixed at the bottom (already `fixed bottom-0`)
- Footer height padding logic is preserved
