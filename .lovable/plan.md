
# Fix: History Scroll Cutoff and User Bubble Sizing

## Problems

1. **Scroll not reaching top/bottom**: The `absolute inset-0` scroll container fills the wrapper correctly, but the `py-2` padding is inside the scrollable area, meaning the top/bottom messages get clipped behind the header and reply footer. Adding a scroll padding buffer at the end (via a spacer) and ensuring the container has no padding conflict will fix this.

2. **User bubble narrower than AI bubble**: The user message row uses `flex-row-reverse` which flips the layout, but the content div still has `text-right` and the bubble uses `inline-block`. Because the user bubble is `inline-block` it only shrinks to fit content width, while AI bubbles stretch wider due to longer text. The fix is to remove `inline-block` in compact mode so both bubble types fill the available width equally.

## Changes

### 1. `src/components/transcript/TranscriptMessage.tsx`

**Make user bubbles match AI bubble width in compact mode:**

- Line 82: Remove `max-w-[95%]` for compact -- both sender types should fill the container equally. The parent already constrains width.
- Line 104: Change `inline-block` to `block` in compact mode so both user and AI bubbles stretch to fill available width instead of shrinking to content.
- Line 83: Remove `text-right` / `text-left` on the content wrapper in compact mode -- all bubble text should be left-aligned internally (matching the memory note about internal left-alignment).

```tsx
// Line 80-84 BEFORE:
"min-w-0",
compact ? "flex-1 max-w-[95%]" : "flex-1 max-w-[80%]",
isUser ? "text-right" : "text-left"

// AFTER:
"min-w-0 flex-1",
compact ? "max-w-[95%]" : "max-w-[80%]",
!compact && (isUser ? "text-right" : "text-left")
```

```tsx
// Line 103-104 BEFORE:
"inline-block rounded-[20px] text-start relative",

// AFTER:
compact ? "block rounded-[16px] text-start relative" : "inline-block rounded-[20px] text-start relative",
```

### 2. `src/components/eye/ResponseCard.tsx`

**Fix scroll not reaching full top/bottom:**

- Line 375: Add a small bottom spacer div after the last message inside the scroll container to ensure the final message isn't hidden behind the scroll-to-bottom button. Also add `scroll-padding-bottom` to the container so auto-scroll targets land above the button.

```tsx
// After the typing indicator (after line 411), add:
<div className="h-2 shrink-0" /> {/* bottom breathing room */}
```

- Line 375: Add `scroll-pb-8` to the scroll container class so programmatic scrolls leave space.

## Summary

- **User bubbles**: Switch from `inline-block` to `block` in compact mode so they stretch to match AI bubble width
- **Scroll**: Add bottom spacer inside scroll area so last message isn't obscured
