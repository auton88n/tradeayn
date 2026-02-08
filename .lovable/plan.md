

# Fix: History Card Overflow — Simple Hard Max-Height Approach

## Problem
The flex-1/min-h-0 inheritance chain keeps failing because the parent height resolution is unreliable. Time to use a simple, guaranteed approach: hard vh-based max-heights.

## Changes

### 1. ResponseCard.tsx — Outer card wrapper (line 310)
Replace `"max-h-full"` with `"max-h-[75vh]"` so the card itself never exceeds 75% of the viewport.

### 2. ResponseCard.tsx — History wrapper (line 369)
Change `"relative flex-1 min-h-0 flex flex-col"` to `"relative flex flex-col"` — remove flex-1/min-h-0.

### 3. ResponseCard.tsx — Scroll container (line 373)
Change `"flex-1 min-h-0 overflow-y-auto overflow-x-hidden ..."` to `"max-h-[60vh] overflow-y-auto overflow-x-hidden ..."` — hard 60vh cap, no flex tricks.

### 4. CenterStageLayout.tsx
Already has `overflow-hidden` from the last edit. No changes needed.

### Resulting structure:
```text
Outer card (max-h-[75vh], overflow-hidden, flex flex-col)
  Header (flex-shrink-0)
  Scroll area (max-h-[60vh], overflow-y-auto)  <-- messages scroll here
  Footer/Reply (flex-shrink-0)
```

## Summary
- 1 file modified: `src/components/eye/ResponseCard.tsx` (3 small class changes)
- No flex-1/min-h-0 chains — just hard viewport-based max-heights
