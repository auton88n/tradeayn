

# Fix Memory Leak in AYNEmotionContext

## Problem

The `AYNEmotionProvider` in `src/contexts/AYNEmotionContext.tsx` creates multiple `setTimeout` calls stored in refs (`activityDecayRef`, `blinkTimeoutRef`, `surpriseTimeoutRef`, `pulseTimeoutRef`, `winkTimeoutRef`) but never clears them on unmount. The recursive `activityDecayRef` setTimeout is especially problematic -- it keeps scheduling itself indefinitely even after the component unmounts.

## Solution

Add a single cleanup `useEffect` that clears all five timeout refs on unmount.

### File: `src/contexts/AYNEmotionContext.tsx`

Add this `useEffect` inside `AYNEmotionProvider`, after the existing ref declarations (around line 155, after `winkTimeoutRef`):

```typescript
useEffect(() => {
  return () => {
    if (activityDecayRef.current) clearTimeout(activityDecayRef.current);
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    if (surpriseTimeoutRef.current) clearTimeout(surpriseTimeoutRef.current);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    if (winkTimeoutRef.current) clearTimeout(winkTimeoutRef.current);
  };
}, []);
```

This is a single `useEffect` with an empty dependency array, so it runs once on mount and the cleanup runs on unmount -- clearing any outstanding timers.

### Files changed

| File | Change |
|------|--------|
| `src/contexts/AYNEmotionContext.tsx` | Add cleanup `useEffect` for all 5 timeout refs |

No other files are affected. No behavioral change -- this only prevents timers from firing after unmount.

