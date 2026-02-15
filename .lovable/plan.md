

## Fix Persistent Chat History Bugs - Root Cause Solutions

### Bug 1: Message Order Scrambled

**Root cause**: Both user and AYN messages are saved in a single batch `POST` to the `messages` table (line 773-810 of `useMessages.ts`). Since neither has an explicit `created_at`, the database assigns `now()` to both -- giving them identical timestamps. When loaded back from the DB, `sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())` produces undefined order for equal timestamps.

**Fix in `src/hooks/useMessages.ts`**: Add explicit `created_at` values when saving, with the AYN message 1 millisecond after the user message:

```text
body: JSON.stringify([
  { ..., created_at: userMessage.timestamp.toISOString() },           // user timestamp
  { ..., created_at: new Date(Date.now() + 1).toISOString() }        // AYN = user + 1ms
])
```

Also update `mapDbMessages` sort (line 181) to add a secondary sort by `sender` -- `user` before `ayn` -- as a safety net for any existing same-timestamp messages:

```text
.sort((a, b) => {
  const timeDiff = a.timestamp.getTime() - b.timestamp.getTime();
  if (timeDiff !== 0) return timeDiff;
  // Same timestamp: user messages come before ayn
  if (a.sender === 'user' && b.sender === 'ayn') return -1;
  if (a.sender === 'ayn' && b.sender === 'user') return 1;
  return 0;
});
```

Apply the same sender tiebreaker to `sortedMessages` in `ResponseCard.tsx` (line 146-155).

### Bug 2: No Scroll-to-Bottom Arrow

**Root cause**: The scroll container (`historyScrollRef`) uses `flex-1 min-h-0` inside the card, but the parent `motion.div` wrapper in `CenterStageLayout.tsx` (line 657-682) has a calculated `maxHeight` and `overflow: "hidden"`. This means the inner scroll container may not report the correct `scrollHeight` vs `clientHeight` difference because its own height is constrained by CSS flex, not an explicit pixel value.

**Fix in `src/components/eye/ResponseCard.tsx`**: Add a `300ms` delayed scroll check after `transcriptOpen` changes to `true`, since the Framer Motion animation takes 300ms to complete and the container dimensions aren't final until then:

```text
// In the existing useEffect at line 298-314, add a delayed re-check:
useEffect(() => {
  if (!transcriptOpen) return;
  const el = historyScrollRef.current;
  if (!el) return;
  // ... existing code ...
  // Delayed re-check after animation completes
  const timer = setTimeout(() => {
    if (el) {
      setShowHistoryScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 50);
    }
  }, 350);
  return () => { /* existing cleanup */ clearTimeout(timer); };
}, [transcriptOpen]);
```

### Bug 3: Scroll Starts at Top

**Root cause**: The auto-scroll effect (line 281-296) uses a single `requestAnimationFrame`, but the Framer Motion `motion.div` wrapping the entire card animates for 300ms. During this animation, the scroll container's `scrollHeight` is still changing as the card grows. The RAF fires before the animation completes, so `el.scrollTop = el.scrollHeight` sets an incomplete value.

**Fix in `src/components/eye/ResponseCard.tsx`**: Use the proven multi-stage scroll approach (nested RAF + setTimeout fallback):

```text
useEffect(() => {
  if (!transcriptOpen) return;
  if (!historyScrollRef.current) return;
  
  const scrollToEnd = () => {
    const el = historyScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };
  
  // Stage 1: Immediate
  scrollToEnd();
  
  // Stage 2: After paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollToEnd());
  });
  
  // Stage 3: After Framer Motion animation completes
  const timer = setTimeout(scrollToEnd, 350);
  
  return () => clearTimeout(timer);
}, [transcriptMessages.length, transcriptOpen]);
```

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/useMessages.ts` | Add explicit `created_at` to batch insert; add sender tiebreaker to `mapDbMessages` sort |
| `src/components/eye/ResponseCard.tsx` | Add sender tiebreaker to `sortedMessages`; multi-stage scroll-to-bottom; delayed scroll-arrow check after animation |

### What Stays the Same

- Database schema unchanged (no migrations needed)
- `ChatHistoryCollapsible.tsx` unchanged (it's an orphan component, not rendered anywhere)
- `CenterStageLayout.tsx` unchanged
- All other components unchanged

