

## Fix Scroll-to-Bottom Arrow in Chat History

### Root Cause

The scroll-to-bottom arrow never appears because the scroll container doesn't actually overflow internally -- even though content is visually clipped.

Here's the height chain:

```text
CenterStageLayout wrapper (motion.div)
  - maxHeight: calc(100vh - footerHeight - 200px)
  - overflow: hidden  <-- clips visually but doesn't constrain child percentage heights

  ResponseCard (motion.div)
    - h-full  <-- resolves to parent's AUTO height (content height), NOT the maxHeight
    - overflow-hidden

    Scroll container (div)
      - flex-1 min-h-0 overflow-y-auto
      - BUT parent height = full content height, so scrollHeight === clientHeight
      - Therefore: showHistoryScrollDown is NEVER true
```

The `h-full` (100%) on the ResponseCard resolves against the parent's **auto/content height**, not the `maxHeight`. So the card grows to full content height (just visually clipped by the parent), the internal scroll container never overflows, and `checkScroll` always finds `scrollHeight - clientHeight = 0`.

### Fix

**File: `src/components/dashboard/CenterStageLayout.tsx`** (line 657-662)

Change the parent wrapper from `maxHeight` to also include `height` so that child `h-full` resolves correctly:

```typescript
style={{
  maxHeight: `calc(100vh - ${footerHeight + 200}px)`,
  height: transcriptOpen ? `calc(100vh - ${footerHeight + 200}px)` : undefined,
  overflow: "hidden",
}}
```

When `transcriptOpen` is true, the wrapper gets an explicit `height` equal to the `maxHeight`. This makes the ResponseCard's `h-full` resolve to a real pixel value, which cascades down to the scroll container, enabling actual overflow and making the scroll-to-bottom arrow appear.

When `transcriptOpen` is false (normal response mode), `height` remains `undefined` so the card sizes to its content as before.

**File: `src/components/eye/ResponseCard.tsx`** (no structural change needed)

The existing scroll detection and arrow button code (lines 308-327 and 483-498) is correct. Once the height chain resolves properly, `checkScroll` will detect `scrollHeight > clientHeight` and set `showHistoryScrollDown = true`.

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/CenterStageLayout.tsx` | Add explicit `height` when `transcriptOpen` so child `h-full` resolves correctly |

### What stays the same
- ResponseCard scroll detection logic (already correct)
- Arrow button component and styling (already correct)
- Multi-stage scroll-to-bottom logic (already correct)
- All other components unchanged
