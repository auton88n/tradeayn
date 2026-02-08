

# Rebuild: History Card with Bulletproof Layout

## Root Cause

The history card has accumulated conflicting height constraints across multiple layers:

1. **CenterStageLayout wrapper**: `maxHeight: calc(100vh - footerHeight - 240px)` + `overflow-hidden`
2. **ResponseCard outer**: `max-h-[75vh]` + `overflow-hidden`
3. **Scroll container**: `max-h-[55vh]`
4. **Individual messages**: `max-h-[40vh]`

These all compete. The outer `calc()` wrapper might be smaller than `75vh`, the `55vh` scroll container plus header/footer might exceed `75vh`, and `inline-block` on message bubbles can still push content outside bounds. The `min-h-0` was removed but is actually needed for flex children to shrink below their content size.

## The Fix

Use a single, clean height strategy: **the outer card fills its parent, and the scroll area takes all remaining space using `flex-1 min-h-0`** (the correct flex pattern). No competing vh values.

### File: `src/components/eye/ResponseCard.tsx`

**Change 1 — Outer card (line 301-311)**
- Remove `max-h-[75vh]`. The parent in CenterStageLayout already constrains height via `maxHeight: calc(...)`.
- Keep `overflow-hidden flex flex-col`.

**Change 2 — History wrapper (line 369)**
- Change from `flex flex-col min-h-0` to `flex flex-col flex-1 min-h-0` so it actually fills and is constrained by the outer card.

**Change 3 — Scroll area wrapper (line 371)**
- Change from `relative min-h-0` to `relative flex-1 min-h-0` so it grows to fill remaining space after header/footer.

**Change 4 — Scroll container (line 375)**
- Remove `max-h-[55vh]`.
- Add `flex-1` and keep `overflow-y-auto overscroll-contain`.
- Change the wrapper div (line 371) to be a flex column so `flex-1` works on the scroll container.
- Actually, simpler: make the scroll container use `h-full` or just let it be `overflow-y-auto` with `position: absolute; inset: 0` inside the `relative flex-1 min-h-0` wrapper. This is the most reliable pattern.

**Change 5 — Individual messages (TranscriptMessage.tsx line 115)**
- Keep `max-h-[40vh] overflow-y-auto overscroll-contain` — this is correct and prevents single messages from dominating.

### File: `src/components/dashboard/CenterStageLayout.tsx`

No changes needed. The existing `maxHeight: calc(100vh - footerHeight - 240px)` with `overflow-hidden` is the single source of truth for the card's maximum size.

### Final Structure

```text
CenterStageLayout wrapper
  maxHeight: calc(100vh - footer - 240px), overflow-hidden
  
  ResponseCard outer (overflow-hidden, flex flex-col) -- NO max-h-[75vh]
    Header (flex-shrink-0)
    History wrapper (flex-1, min-h-0, flex flex-col)
      Scroll wrapper (relative, flex-1, min-h-0)
        Scroll container (absolute inset-0, overflow-y-auto)
          Messages...
        Scroll-to-bottom button (absolute)
      Reply footer (flex-shrink-0)
```

### Why This Works

- Only ONE height constraint exists: the CenterStageLayout `calc()` wrapper
- `flex-1 min-h-0` on intermediate containers lets them shrink to fit
- `absolute inset-0` on the scroll container means it exactly fills its `relative` parent — guaranteed no overflow
- No competing `max-h-[55vh]` or `max-h-[75vh]` values

## Summary

- 2 files modified: `ResponseCard.tsx` (4 class changes), `TranscriptMessage.tsx` (no changes needed)
- Strategy: single height source + flex shrink + absolute positioned scroll container
