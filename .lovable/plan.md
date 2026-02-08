
## Fix History Chat Scroll Starting from Bottom

**Problem**: When opening the chat history, it starts scrolled to the top (oldest messages) instead of the bottom (newest messages). The auto-scroll code exists but fires before the browser has finished laying out the content.

**Root Cause**: A single `requestAnimationFrame` isn't always sufficient -- the DOM content may not be fully rendered when the scroll command runs, especially with animated entry (`AnimatePresence`).

---

### Fix

**`src/components/dashboard/ChatHistoryCollapsible.tsx`**

- Double the `requestAnimationFrame` call (nested rAF) so the scroll happens after both the DOM update and the paint
- Add a fallback `setTimeout(…, 100)` to catch cases where framer-motion's animation delays the layout

Change the auto-scroll effect from:
```tsx
requestAnimationFrame(() => {
  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
});
```
To:
```tsx
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });
});
// Fallback for animation delays
setTimeout(() => {
  if (scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, 150);
```

This ensures the scroll-to-bottom fires after the content is fully rendered and the framer-motion entry animation has started.
