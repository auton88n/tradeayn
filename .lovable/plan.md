

# Disable Debug Mode Keyboard Toggle in Production

## Problem

The debug mode keyboard listener (press "D" to toggle) is active in production. Any user accidentally pressing D sees debug overlays with FPS counters, CLS scores, and re-render counts.

## Solution

Add `if (import.meta.env.PROD) return;` as the first line inside the keyboard listener `useEffect` (around line 85 of `src/contexts/DebugContext.tsx`). This early-returns in production builds, so the listener is never registered.

### File: `src/contexts/DebugContext.tsx`

Add one line at the top of the existing `useEffect`:

```typescript
useEffect(() => {
  if (import.meta.env.PROD) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    // ... existing handler unchanged
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

No other files affected. No behavioral change in development.

