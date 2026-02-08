

# Fix History Card: Text Overflow, Scroll Arrow, and Action Buttons

## Problems
1. Long text causes horizontal scrolling -- the history scroll container lacks `overflow-x-hidden`
2. The scroll-down arrow only appears after the user scrolls -- it never checks on initial render or when new messages arrive
3. Copy and Reply buttons under message bubbles are missing because the `onReply` prop is not being passed to `TranscriptMessage`

## Changes

### 1. Fix text cut-off (ResponseCard.tsx, line 346)
Add `overflow-x-hidden` to the history scroll container class and add word-break utilities to the inner content wrapper:
- Change `className` on the scroll div (line 346) to include `overflow-x-hidden`
- Add `[overflow-wrap:anywhere]` to the inner content div (line 348) to force long words to wrap

### 2. Fix scroll-down arrow not appearing (ResponseCard.tsx, lines 237-245)
The current auto-scroll `useEffect` scrolls to bottom but never updates `showHistoryScrollDown`. Add a check after scrolling and also on initial render:
- After the `requestAnimationFrame` scroll, check if the container is still scrollable and update `showHistoryScrollDown`
- This ensures the arrow appears immediately when history opens with enough content, not only after a manual scroll event

### 3. Add Copy and Reply buttons to transcript bubbles (ResponseCard.tsx, lines 357-365)
Pass the `onReply` callback to each `TranscriptMessage` component. This requires:
- Accept a new prop `onReply` on the ResponseCard (or reuse existing chat input reply mechanism)
- Pass `onReply` to each `TranscriptMessage` so the hover-revealed Copy and Reply buttons appear under each bubble
- If no reply handler is available, at minimum ensure Copy still works (it already does in `TranscriptMessage` internally -- the issue is the buttons may be clipped by `overflow-hidden` on the card)

### 4. Ensure action buttons are visible (ResponseCard.tsx, line 286)
The card has `overflow-hidden` which can clip the hover action buttons below message bubbles. Change to `overflow-visible` on the outer wrapper or ensure the scroll container handles overflow independently without clipping child hover elements. Since the scroll container already handles overflow, the outer card's `overflow-hidden` is only needed for rounded corners -- keep it but ensure the inner scroll area doesn't clip the action row.

