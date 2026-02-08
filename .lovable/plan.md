

# Fix: History Card Sizing, Scroll, and Bubble Layout

## Root Cause

The history card's layout is broken because of **conflicting height constraints** in the parent chain:

```text
eyeStageRef (overflow-y-auto, flex-1)
  motion.div wrapper (maxHeight: calc(100vh - footer - 240px), overflow-hidden)
    ResponseCard motion.div (h-[50vh] max-h-[50vh])  <-- CONFLICT
      flex-1 min-h-0 flex-col
        relative flex-1 min-h-0
          absolute inset-0 (scroll container)
```

The `h-[50vh]` on the ResponseCard fights with the parent's `maxHeight: calc(...)`. The card tries to be 50vh tall regardless of available space, and the parent clips it. Meanwhile the `absolute inset-0` scroll container depends on its grandparent having a resolved height — but the conflicting constraints mean the height sometimes resolves to 0 or collapses.

## Fix Strategy

Remove the hardcoded `h-[50vh]` from ResponseCard and instead make it fill its parent naturally. The parent wrapper in CenterStageLayout already provides the correct max-height constraint.

## Changes

### 1. `src/components/eye/ResponseCard.tsx`

**Line 310** -- Remove `h-[50vh] max-h-[50vh]` and replace with `flex-1` so the card fills its parent wrapper:

```tsx
// BEFORE:
transcriptOpen && "h-[50vh] max-h-[50vh]"

// AFTER:
transcriptOpen && "h-full"
```

### 2. `src/components/dashboard/CenterStageLayout.tsx`

**Lines 755-758** -- The parent wrapper needs a fixed height (not just maxHeight) when history is open, so the card and its `absolute inset-0` children can resolve their dimensions. Also remove `overflow-hidden` since the card handles its own overflow internally:

```tsx
// BEFORE:
<motion.div
  className="w-full flex justify-center mt-2 overflow-hidden"
  style={{
    maxHeight: `calc(100vh - ${footerHeight + 240}px)`,
  }}

// AFTER:
<motion.div
  className="w-full flex justify-center mt-2"
  style={{
    height: transcriptOpen
      ? `calc(100vh - ${footerHeight + 240}px)`
      : undefined,
    maxHeight: `calc(100vh - ${footerHeight + 240}px)`,
    overflow: transcriptOpen ? 'visible' : 'hidden',
  }}
```

This gives the wrapper a **resolved height** when history is open, so the entire chain (flex-1 -> relative -> absolute inset-0) can compute real pixel values.

### 3. `src/components/transcript/TranscriptMessage.tsx`

Remove the `max-w-[92%]` cap on compact bubbles. The bubbles should naturally fill the available width, with only their container padding limiting them:

```tsx
// BEFORE:
compact ? "flex-1 max-w-[92%]" : "flex-1 max-w-[80%]"

// AFTER:
compact ? "flex-1 max-w-[95%]" : "flex-1 max-w-[80%]"
```

### 4. `src/components/eye/ResponseCard.tsx` -- Scroll button threshold

Lower the scroll-to-bottom visibility threshold from 100px to 50px so it appears sooner:

```tsx
// Lines 247, 261 -- change > 100 to > 50
el.scrollHeight - el.scrollTop - el.clientHeight > 50
```

## Summary of Root Fix

The core fix is giving the parent wrapper a **resolved `height`** (not just `maxHeight`) when history mode is active, so the chain of `flex-1 min-h-0` + `relative` + `absolute inset-0` can compute actual pixel dimensions. Without a resolved height, `absolute inset-0` collapses to zero.

## Files Changed

- `src/components/dashboard/CenterStageLayout.tsx` -- set explicit height for history wrapper
- `src/components/eye/ResponseCard.tsx` -- use `h-full` instead of `h-[50vh]`, lower scroll threshold
- `src/components/transcript/TranscriptMessage.tsx` -- widen compact bubble max-width to 95%
