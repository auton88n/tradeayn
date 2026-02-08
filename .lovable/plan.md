

# Remove Duplicate soundGenerator.setEnabled() in toggleEnabled

## Problem

In `src/contexts/SoundContext.tsx`, the `toggleEnabled` function manually calls `soundGenerator.setEnabled(newValue)` inside the state updater. A separate `useEffect` already syncs the `enabled` state to `soundGenerator` whenever it changes. This results in the sound generator being called twice per toggle, which can cause audio glitches.

## Change

**File: `src/contexts/SoundContext.tsx`** -- Remove the `soundGenerator.setEnabled(newValue)` line from `toggleEnabled`, and remove `soundGenerator` from its dependency array since it's no longer referenced.

**Before:**
```typescript
const toggleEnabled = useCallback(() => {
  setEnabledState(prev => {
    const newValue = !prev;
    // Sync to sound generator immediately
    soundGenerator.setEnabled(newValue);
    // Sync to database if logged in
    if (userId && accessToken) {
      ...
    }
    return newValue;
  });
}, [soundGenerator, userId, accessToken]);
```

**After:**
```typescript
const toggleEnabled = useCallback(() => {
  setEnabledState(prev => {
    const newValue = !prev;
    // Sync to database if logged in
    if (userId && accessToken) {
      ...
    }
    return newValue;
  });
}, [userId, accessToken]);
```

One file, two small removals (one line + one dependency).

