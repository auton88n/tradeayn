
# Plan: Soften Banner Colors + Auto-Hide After 5 Seconds

## What We're Fixing

1. **Red/destructive styling** feels too alarming and negative
2. **Banner stays visible** until manually dismissed - should auto-disappear after 5 seconds

---

## Technical Changes

### File: `src/components/dashboard/SystemNotificationBanner.tsx`

**Change 1: Add useEffect for auto-dismiss timer**

Add a `useEffect` hook that automatically sets `isDismissed` to `true` after 5 seconds:

```tsx
import { useState, useEffect } from 'react';

// Inside the component, add:
useEffect(() => {
  // Auto-dismiss usage warning after 5 seconds
  if (!isDismissed && !isUnlimited && dailyLimit !== null) {
    const timer = setTimeout(() => {
      setIsDismissed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }
}, [isDismissed, isUnlimited, dailyLimit]);
```

**Change 2: Replace red styling with soft amber/muted tones (lines 155-157)**

```tsx
// Before:
isUrgent && "bg-destructive/10 border-destructive/30 text-destructive",
isWarning && "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",

// After - Use softer, neutral tones:
isUrgent && "bg-muted/60 border-border text-muted-foreground",
isWarning && "bg-muted/50 border-border/80 text-muted-foreground",
```

**Change 3: Remove the pulsing animation (lines 161-164)**

```tsx
// Before:
<AlertCircle className={cn(
  "w-4 h-4 shrink-0",
  isUrgent && "animate-pulse"
)} />

// After - No animation:
<AlertCircle className="w-4 h-4 shrink-0" />
```

---

## Summary

| Change | Before | After |
|--------|--------|-------|
| Color (urgent) | Red/destructive | Soft muted gray |
| Color (warning) | Amber | Soft muted gray |
| Animation | Pulsing icon | No animation |
| Duration | Stays until dismissed | Auto-hides after 5 seconds |

---

## Result

- Banner appears briefly (5 seconds) then fades away
- Neutral, non-alarming colors
- Users are informed without feeling punished
- Still has X button for immediate dismiss if needed
