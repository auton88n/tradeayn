
# Show Eye at Top + Bottom-Anchored Chat + Scroll-to-Bottom Button

## Overview
Three improvements to the history panel experience:
1. **Show the eye** at the top (small) instead of hiding it completely when history is open
2. **Anchor messages to the bottom** of the history area so chat starts from the bottom (like a real chat app)
3. **Add a scroll-to-bottom arrow button** that appears when the user scrolls up, letting them jump back to the latest messages

---

## Technical Changes

### 1. CenterStageLayout.tsx -- Show eye (small) instead of hiding

Currently the eye has `opacity: 0` when `transcriptOpen` is true. Change this to keep it visible at reduced scale.

- Remove `opacity: transcriptOpen ? 0 : 1` from the animate prop
- Remove `pointer-events-none` when transcript is open (the eye should still be interactive)
- Keep the existing scale-down to 0.5 and `justify-start pt-4` positioning

### 2. ChatInput.tsx -- Bottom-anchor messages with flex layout

Change the messages container to use `flex flex-col justify-end` so messages stack from the bottom up. This means when there are few messages, they appear at the bottom of the scrollable area (like iMessage, WhatsApp, etc).

```
Before:  <div className="p-3 space-y-1">
After:   <div className="p-3 space-y-1 flex flex-col justify-end min-h-full">
```

The outer scroll container needs `min-h-0` to work with flexbox properly.

### 3. ChatInput.tsx -- Add scroll-to-bottom arrow button

Add state tracking whether the user has scrolled away from the bottom:
- `showScrollDown` state, toggled by a scroll event listener on the history container
- When the user scrolls up more than 100px from the bottom, show a floating down-arrow button
- Clicking it smooth-scrolls to the bottom
- The button sits as a small floating circle at the bottom-center of the history area

```tsx
// New state
const [showScrollDown, setShowScrollDown] = useState(false);

// Scroll listener on history container
const handleHistoryScroll = (e) => {
  const el = e.currentTarget;
  const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  setShowScrollDown(distFromBottom > 100);
};

// Scroll-to-bottom handler
const scrollHistoryToBottom = () => {
  historyScrollRef.current?.scrollTo({ top: historyScrollRef.current.scrollHeight, behavior: 'smooth' });
};
```

The button renders as a small `ChevronDown` icon inside a circular button, positioned absolutely at the bottom of the messages area.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/CenterStageLayout.tsx` | Remove `opacity: 0` and `pointer-events-none` from eye when transcript is open -- keep it visible but small |
| `src/components/dashboard/ChatInput.tsx` | Add `flex flex-col justify-end min-h-full` to messages container; add `onScroll` listener; add floating scroll-to-bottom `ChevronDown` button |
