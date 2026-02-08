

# Fix: History Card Overflow (Root Cause Found)

## The Real Problem

There are **two competing height constraints** that don't work together:

1. **Parent wrapper** (CenterStageLayout line 758): `maxHeight: calc(100vh - footerHeight - 240px)` -- this correctly caps the overall space available for the ResponseCard.
2. **Inner scroll div** (ResponseCard line 373): `max-h-[calc(50vh-5rem)]` -- this is a separate, independent constraint on the scroll area.

But the **ResponseCard's outer `motion.div`** (line 298-310) has NO height constraint itself (the previous edit replaced it with `false`). Without a height constraint on the card, and without `h-full` / `max-h-full` to inherit from the parent wrapper, the card ignores the parent's `maxHeight` and grows with content.

The fix: Make the ResponseCard's outer div inherit the parent constraint using `max-h-full`, and let the scroll area fill available space with `flex-1 min-h-0` (which NOW works because the parent has a definite height). Remove the hardcoded `calc` on the scroll div.

## Changes

### File: `src/components/eye/ResponseCard.tsx`

**1. Outer card div (line 310)**: Replace `false` with `"max-h-full"` so it inherits the parent wrapper's `maxHeight`.

**2. History wrapper (line 369)**: Change from `relative flex flex-col` to `relative flex-1 min-h-0 flex flex-col` so it fills available space and passes height constraint down.

**3. Scroll container (line 373)**: Change from `max-h-[calc(50vh-5rem)] sm:max-h-[calc(60vh-5rem)]` back to `flex-1 min-h-0` -- now that the parent chain has a definite height, `flex-1` correctly resolves to the remaining space after header and footer.

### File: `src/components/dashboard/CenterStageLayout.tsx`

**4. Parent wrapper (line 756)**: Add `overflow-hidden` to the wrapper div so `max-h-full` on the child correctly clips. Change class to `"w-full flex justify-center mt-2 overflow-hidden"`.

## Why This Works

```text
CenterStageLayout wrapper (maxHeight: calc(100vh - footer - 240px), overflow-hidden)
  --> ResponseCard outer div (max-h-full, flex col, overflow-hidden)
    --> Header (flex-shrink-0, ~40px)
    --> History wrapper (flex-1 min-h-0)
      --> Scroll div (flex-1 min-h-0, overflow-y-auto)  <-- scrolls here
      --> Reply footer (flex-shrink-0, ~40px)
```

Each layer passes a definite height to the next, so `flex-1` resolves correctly and scrolling kicks in.

## Summary
- 2 files modified
- `ResponseCard.tsx`: Fix outer card to inherit parent height, restore flex-based inner layout
- `CenterStageLayout.tsx`: Add `overflow-hidden` to parent wrapper

