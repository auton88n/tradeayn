
# Fix Centered Text in Chat History Bubbles

## Problem

The message text inside chat bubbles is inheriting `text-right` / `text-left` from the parent container. This causes AYN's long messages to appear visually centered/oddly aligned, and user messages to be right-aligned inside their bubble. The text inside bubbles should always be left-aligned regardless of which side the bubble is on.

## Fix in `src/components/transcript/TranscriptMessage.tsx`

### Add `text-left` to the bubble div (line 91)

Add `text-left` (or `text-start` for RTL support) directly on the bubble `<div>` so the inner text is always left-aligned, overriding the parent's `text-right`/`text-left` which is only meant for positioning the bubble itself (via `inline-block`).

**Before (line 91-97):**
```
<div className={cn(
  "inline-block rounded-[20px]",
  ...
)}>
```

**After:**
```
<div className={cn(
  "inline-block rounded-[20px] text-start",
  ...
)}>
```

This single class addition ensures bubble text is always start-aligned while the parent alignment still correctly positions the bubble on the left or right side of the chat.
