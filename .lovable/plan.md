
# Performance Optimization: Settings & Pricing Pages

## Problem Analysis

After analyzing the codebase, I've identified several performance bottlenecks causing the laggy feeling on Settings and Pricing pages:

### Root Causes

| Issue | Location | Impact |
|-------|----------|--------|
| **Edge function call on mount** | `SubscriptionContext.tsx` | `check-subscription` calls Stripe API on every page load |
| **AnimatePresence + PageTransition** | `App.tsx` | Framer Motion runs exit/enter animations on every route change |
| **Cascading loading states** | Settings components | Each tab shows its own loader, causing visual jumpiness |
| **Multiple API calls** | `useUserSettings.ts` | Settings + Sessions fetched sequentially |
| **No caching for subscription data** | `SubscriptionContext` | Re-fetches subscription every navigation |

---

## Solution Overview

Implement a multi-layer optimization strategy:

1. **Cache subscription status** to prevent redundant edge function calls
2. **Skip page transition animations** for Settings and Pricing routes
3. **Parallelize all Settings data fetching** into a single loading state
4. **Add skeleton loaders** instead of spinner-only loading states
5. **Use `startTransition`** for non-urgent state updates

---

## Implementation Details

### 1. Cache Subscription Status (SubscriptionContext.tsx)

**Problem**: `checkSubscription()` calls the edge function on every mount and every 60 seconds.

**Solution**: 
- Cache subscription data in `sessionStorage` for 5 minutes
- Only call edge function if cache is stale
- Show cached data immediately while refreshing in background

```typescript
// On checkSubscription:
const cached = sessionStorage.getItem('subscription_cache');
if (cached) {
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < 5 * 60 * 1000) {
    // Use cached data immediately
    setState({ ...data, isLoading: false });
    return; // Skip API call
  }
}
```

**Files**: `src/contexts/SubscriptionContext.tsx`

---

### 2. Optimize Page Transitions (App.tsx)

**Problem**: AnimatePresence with `mode="wait"` blocks rendering until exit animation completes (~250ms delay).

**Solution**: 
- Remove AnimatePresence for faster routes
- Use CSS transitions instead of Framer Motion for basic pages
- Keep animations only for landing/marketing pages

```typescript
// Before
<AnimatePresence mode="wait">
  <Routes>...</Routes>
</AnimatePresence>

// After: Remove AnimatePresence wrapper
<Routes>
  <Route path="/settings" element={<Settings />} />  {/* No animation */}
  <Route path="/pricing" element={<Pricing />} />     {/* No animation */}
  {/* Other routes keep PageTransition */}
</Routes>
```

**Files**: `src/App.tsx`

---

### 3. Unified Settings Loading (Settings.tsx)

**Problem**: Each settings tab has its own loading spinner, causing visual jumping.

**Solution**:
- Pre-fetch all settings data in the parent component
- Pass ready data to children
- Show single skeleton loader while all data loads

```text
Current Flow:
├── Settings.tsx (auth check) → loading...
│   ├── AccountPreferences → loading...
│   ├── NotificationSettings → loading...
│   ├── PrivacySettings → loading...
│   └── SessionManagement → loading...

Optimized Flow:
├── Settings.tsx (fetch ALL data in parallel) → single skeleton
│   ├── AccountPreferences (receives pre-loaded data)
│   ├── NotificationSettings (receives pre-loaded data)
│   ├── PrivacySettings (receives pre-loaded data)
│   └── SessionManagement (receives pre-loaded data)
```

**Files**: 
- `src/pages/Settings.tsx` 
- `src/hooks/useUserSettings.ts` (fetch all at once)

---

### 4. Replace Spinner with Skeleton (SettingsLayout.tsx, Pricing.tsx)

**Problem**: Single spinning loader gives no sense of progress.

**Solution**: Use skeleton UI that matches the final layout.

```typescript
// Settings skeleton
<div className="space-y-6">
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-48 w-full rounded-xl" />
  <Skeleton className="h-32 w-full rounded-xl" />
</div>

// Pricing skeleton
<div className="grid grid-cols-5 gap-5">
  {[...Array(5)].map((_, i) => (
    <Skeleton key={i} className="h-[420px] rounded-3xl" />
  ))}
</div>
```

**Files**:
- `src/components/settings/SettingsLayout.tsx`
- `src/pages/Pricing.tsx`

---

### 5. Remove Redundant Animations (Pricing.tsx)

**Problem**: `animate-fade-in` on cards with staggered delays adds ~500ms total.

**Solution**: Remove stagger animations, keep only hover effects.

```typescript
// Before
<div className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>

// After
<div className="transition-transform duration-200 hover:scale-[1.02]">
```

**Files**: `src/pages/Pricing.tsx`

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/SubscriptionContext.tsx` | Add sessionStorage caching |
| `src/App.tsx` | Remove AnimatePresence for /settings and /pricing |
| `src/pages/Settings.tsx` | Pre-fetch all data, single loading state |
| `src/pages/Pricing.tsx` | Remove stagger animations, add skeleton |
| `src/hooks/useUserSettings.ts` | Fetch settings + sessions in parallel |
| `src/components/settings/SettingsLayout.tsx` | Add skeleton fallback |

---

## Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| Time to Interactive (Settings) | ~1.5-2s | ~400-600ms |
| Time to Interactive (Pricing) | ~1-1.5s | ~300-400ms |
| Visual stability (CLS) | Spinner jumps | Smooth skeleton → content |
| Edge function calls | Every navigation | Once per 5 minutes |
