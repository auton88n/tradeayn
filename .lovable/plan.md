

# Fix User Message Bubble Width (Root Cause)

## What's Actually Wrong

The previous fix added `inline-block` and `text-right`, but user bubbles are **still stretching wide**. Here's why:

The `MessageFormatter` component renders markdown content with block-level HTML elements (like `<p>` tags). Even though the outer bubble div is `inline-block`, the inner `<p>` tag is `display: block` by default and expands to fill the available space, making the bubble stretch.

Additionally, `flex-1` on the content wrapper (line 82) forces it to take the full row width, giving the block-level inner elements plenty of room to expand.

## The Fix (2 changes in 1 file)

### `src/components/transcript/TranscriptMessage.tsx`

**Change 1 — Line 82**: Remove `flex-1` from the content wrapper for user messages in compact mode. Replace with a width that fits content:

```
BEFORE:
"min-w-0 flex-1"

AFTER:
"min-w-0", isUser && compact ? "" : "flex-1"
```

This stops the content column from stretching to fill the row for user messages in compact mode.

**Change 2 — Line 101**: Add `w-fit` to the bubble div so it shrink-wraps even when children are block-level elements:

```
BEFORE:
"inline-block text-start relative px-4 py-2.5"

AFTER:
"inline-block text-start relative px-4 py-2.5 w-fit max-w-full"
```

`w-fit` forces the bubble to match its content width. `max-w-full` prevents it from overflowing the container.

## Why This Works

- `w-fit` on the bubble overrides the default block-level expansion of inner `<p>` elements
- Removing `flex-1` for compact user messages stops the parent from stretching
- `max-w-full` ensures long messages still wrap properly
- AI messages keep `flex-1` so they can use the full width as intended

## Result
- Short user messages like "hello" will have a small, snug bubble on the right
- Long AI responses still expand naturally
- No layout breakage for other modes

