
# Fix User Message Bubble Width in History

## Problem
In the screenshot, the user's "hello" message stretches across the entire card width. This is because compact mode forces `block` display on all bubbles (line 105 of TranscriptMessage.tsx), making them fill 95% of the container regardless of content length.

AI messages benefit from this because they tend to have longer text, but user messages (often short) look unnaturally wide.

## Solution

### `src/components/transcript/TranscriptMessage.tsx`

**Line 105**: Change the compact bubble display from always `block` to `inline-block` for all messages, matching the non-compact behavior. This lets bubbles shrink-wrap to their content.

```
BEFORE:
compact ? "block rounded-[16px] text-start relative px-4 py-2.5" : "inline-block rounded-[20px] text-start relative",

AFTER:
"inline-block rounded-[16px] text-start relative px-4 py-2.5",
compact ? "" : "rounded-[20px]",
```

Simplified: just always use `inline-block` with the compact rounding, and apply `rounded-[20px]` override for non-compact.

**Line 80-83**: Remove `flex-1` from the content wrapper so `inline-block` bubbles don't stretch. Instead, use a simple max-width container. Also add `text-right` for user messages in compact mode so the inline-block bubble aligns right.

```
BEFORE:
"min-w-0 flex-1",
compact ? "max-w-[95%]" : "max-w-[80%]",
!compact && (isUser ? "text-right" : "text-left")

AFTER:
"min-w-0 flex-1",
compact ? "max-w-[95%]" : "max-w-[80%]",
isUser ? "text-right" : "text-left"
```

This ensures `text-right` applies in compact mode too, so the `inline-block` bubble floats to the right side for user messages.

## Result
- Short user messages like "hello" will have a small, snug bubble
- Long AI responses will still expand naturally up to the max-width
- Both bubble types shrink-wrap to their content like a real chat app
