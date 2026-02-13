

# Memory Leak Fix: Timer and Listener Cleanup

## Problem

Several Zustand stores and components have timers and event listeners that are never cleaned up, causing memory leaks in a production app with active users.

---

## Fixes by File

### 1. `src/stores/emotionStore.ts` (5 untracked timers)

**Currently leaking:**
- `triggerAbsorption`: `setTimeout` on line 215 -- not tracked
- `triggerBlink`: `setTimeout` on line 220 -- not tracked
- `triggerAttentionBlink`: outer `setTimeout` on line 230 and inner `setTimeout` on line 234 -- not tracked
- `triggerEmpathyBlink`: `setTimeout` on line 274 -- not tracked

**Fix:** Add 3 new module-level timer variables (`_absorptionTimer`, `_blinkResetTimer`, `_empathyBlinkTimer`) and clear-before-set in each function. The existing `_blinkTimer`, `_surpriseTimer`, `_pulseTimer`, `_winkTimer` are already properly managed.

### 2. `src/stores/soundStore.ts` (1 leaked auth listener)

**Currently leaking:**
- Line 117: `supabase.auth.onAuthStateChange(...)` -- subscription is never stored or unsubscribed

**Fix:** Store the subscription return value in a module-level variable. Since this store lives for the app lifetime, this is a minor leak, but for correctness we should store it and expose a cleanup path. The practical fix: assign the return to a module variable so it can be cleaned up if needed, and to prevent duplicate subscriptions on HMR.

### 3. `src/stores/debugStore.ts` (2 leaked listeners)

**Currently leaking:**
- Line 129: `window.addEventListener('keydown', ...)` -- never removed
- Line 148-155 (connection change listener) -- never removed

**Fix:** Store handler references so they could be removed. Since these are module-level singletons that live for the app lifetime, wrap them in a guard to prevent duplicate registration on HMR (add a `_listenersAttached` flag).

### 4. `src/pages/ResetPassword.tsx` (1 minor leak)

**Currently leaking:**
- Line 232-234: `setTimeout(() => navigate('/'), 2000)` after password reset -- not cleaned up on unmount

**Fix:** Track this timer in a ref and clear it in the useEffect cleanup. Minor issue since it only fires after successful password change, but good practice.

---

## Technical Details

### emotionStore.ts changes

Add at line 180 (alongside existing timer vars):
```
let _absorptionTimer: ReturnType<typeof setTimeout> | null = null;
let _blinkResetTimer: ReturnType<typeof setTimeout> | null = null;
let _empathyBlinkTimer: ReturnType<typeof setTimeout> | null = null;
```

Update `triggerAbsorption`:
```
triggerAbsorption: () => {
  if (_absorptionTimer) clearTimeout(_absorptionTimer);
  set({ isAbsorbing: true });
  hapticFeedback('light');
  _absorptionTimer = setTimeout(() => {
    set({ isAbsorbing: false });
    _absorptionTimer = null;
  }, 300);
},
```

Update `triggerBlink`:
```
triggerBlink: () => {
  if (_blinkResetTimer) clearTimeout(_blinkResetTimer);
  set({ isBlinking: true });
  _blinkResetTimer = setTimeout(() => {
    set({ isBlinking: false });
    _blinkResetTimer = null;
  }, 180);
},
```

Update `triggerAttentionBlink` to track all 3 timeouts using `_blinkTimer` and `_blinkResetTimer`.

Update `triggerEmpathyBlink` to track its delayed call using `_empathyBlinkTimer`.

### soundStore.ts changes

Store the auth subscription:
```
let _authSubscription: { unsubscribe: () => void } | null = null;

// Before registering new listener, clean up old one (HMR safety)
_authSubscription?.unsubscribe();

const { data: { subscription } } = supabase.auth.onAuthStateChange(...);
_authSubscription = subscription;
```

### debugStore.ts changes

Add HMR guard for event listeners:
```
let _listenersAttached = false;

if (!import.meta.env.PROD && !_listenersAttached) {
  _listenersAttached = true;
  // ... existing keydown listener
}
```

Same pattern for the connection change listener.

### ResetPassword.tsx changes

Add a ref for the navigate timer and clear it on unmount:
```
const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// In handleResetPassword:
navigateTimerRef.current = setTimeout(() => navigate('/'), 2000);

// In cleanup:
return () => {
  if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
};
```

---

## Files Changed

| File | Changes |
|------|---------|
| `src/stores/emotionStore.ts` | Track 5 untracked timers with clear-before-set pattern |
| `src/stores/soundStore.ts` | Store auth subscription, add HMR cleanup |
| `src/stores/debugStore.ts` | Add HMR guard flag for event listeners |
| `src/pages/ResetPassword.tsx` | Track navigate timeout in ref, clear on unmount |

## What Does NOT Change
- No new dependencies
- No behavioral changes -- all timers fire the same way, they're just properly tracked now
- No API changes to any store

