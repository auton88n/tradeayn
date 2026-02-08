
# Fix: Remove Internal Bubble Scroll and Restore Card Scrolling

## Two Clear Problems

### Problem 1: Bubbles have their own scrollbar
Line 115 in `TranscriptMessage.tsx` applies `max-h-[40vh] overflow-y-auto` to every message bubble's inner text div. This caps each bubble at 40% of the viewport and adds a scrollbar inside the bubble itself. In compact/history mode, this is wrong -- bubbles should show their full content and let the parent card handle scrolling.

### Problem 2: Card scroll is broken
The root card was changed to `overflow-visible` which breaks the `absolute inset-0` scroll container inside it. The `absolute inset-0` pattern requires a positioned ancestor with `overflow: hidden` (or at least not `visible`) to establish the containing block. The fix from the last edit broke this.

The real issue was never the root card's overflow -- it was that the scroll container's parent chain didn't have a resolved height. But the earlier CenterStageLayout fix already gives it a resolved height. So we should revert the root card back to `overflow-hidden` and instead ensure the flex-1 chain resolves correctly.

## Changes

### 1. `src/components/transcript/TranscriptMessage.tsx` (Line 115)

Remove `max-h-[40vh] overflow-y-auto overscroll-contain` in compact mode. Bubbles should show full height; only the card scrolls.

```
BEFORE:  "max-h-[40vh] overflow-y-auto overscroll-contain"
AFTER:   compact ? "" : "max-h-[40vh] overflow-y-auto overscroll-contain"
```

### 2. `src/components/eye/ResponseCard.tsx` (Line 309)

Revert back to always `overflow-hidden` on the root card. The absolute scroll container needs this to work.

```
BEFORE:  transcriptOpen ? "overflow-visible" : "overflow-hidden"
AFTER:   "overflow-hidden"
```

### 3. `src/components/eye/ResponseCard.tsx` (Line 369-375)

The flex-1 chain needs the history content wrapper to also specify `overflow-hidden` so the absolute child is contained:

```
BEFORE:
<div className="flex-1 min-h-0 flex flex-col">
  <div className="relative flex-1 min-h-0">

AFTER:
<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
  <div className="relative flex-1 min-h-0 overflow-hidden">
```

This ensures the height resolves through the flex chain AND the absolute scroll container has a proper containing block.

## Summary

- Bubble text div: remove height cap and internal scroll in compact mode so content shows fully
- Root card: revert to `overflow-hidden` (required for absolute positioning)
- History flex wrappers: add `overflow-hidden` so the flex-1 height resolves and the absolute scroll container works
