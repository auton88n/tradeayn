
# Rebuild: History Card

Replace the placeholder with a complete, bulletproof history card inside `ResponseCard.tsx`.

## Layout Strategy

The parent (`CenterStageLayout`) already constrains the card via `maxHeight: calc(...)` and `overflow-hidden`. The history card uses `flex-1 min-h-0` containers with an `absolute inset-0` scroll area -- the proven pattern from the previous fix.

## Structure

```text
ResponseCard outer (flex flex-col, overflow-hidden, constrained by parent)
  Header (flex-shrink-0) -- already exists, shows message count + Clear/Close
  History wrapper (flex-1, min-h-0, flex flex-col)
    Scroll wrapper (relative, flex-1, min-h-0)
      Scroll container (absolute inset-0, overflow-y-auto)
        Messages (TranscriptMessage components)
        Typing indicator (3-dot bounce)
      Scroll-to-bottom button (absolute bottom-3, z-10)
    Reply footer (flex-shrink-0, border-t)
```

## Changes in `src/components/eye/ResponseCard.tsx`

Replace the placeholder block (lines 366-370) with:

1. **History wrapper**: `flex-1 min-h-0 flex flex-col` -- fills all space below the header
2. **Scroll wrapper**: `relative flex-1 min-h-0` -- sized by flex, acts as positioning context
3. **Scroll container**: `absolute inset-0 overflow-y-auto overscroll-contain` -- scrolls within exact bounds, no overflow possible
4. **Messages**: Render `sortedMessages` using `TranscriptMessage` with streaming logic for the last AYN message (reuses existing `seenMessageIdsRef` logic)
5. **Typing indicator**: 3-dot CSS bounce when `historyTyping` is true, with Brain avatar
6. **Scroll-to-bottom button**: `AnimatePresence`-wrapped `ChevronDown` circle at `absolute bottom-3 left-1/2`, shown when `showHistoryScrollDown` is true
7. **Reply footer**: `flex-shrink-0` bar with a `CornerDownLeft` Reply button that calls `onHistoryClose`

Individual message bubbles already have `max-h-[40vh] overflow-y-auto` in `TranscriptMessage.tsx` -- no changes needed there.

## No Other Files Changed

- `TranscriptMessage.tsx` -- already has the `max-h-[40vh]` constraint, no changes
- `CenterStageLayout.tsx` -- already provides the outer height constraint, no changes
