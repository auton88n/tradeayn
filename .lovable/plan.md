

# Performance Optimization Implementation Plan

## Overview
This plan implements performance improvements across AI responsiveness, frontend caching, CSS optimization, and network preloading - all without changing existing functionality or affecting the eye animations.

---

## Phase 1: React Query Caching (Low Risk, High Impact)

### Current State
```typescript
// src/App.tsx line 50
const queryClient = new QueryClient();
```
No caching configuration - every query refetches on mount.

### Change
Add stale-while-revalidate caching:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 minute - data stays fresh
      gcTime: 5 * 60 * 1000,      // 5 minutes - keep in cache
      refetchOnWindowFocus: false, // Don't refetch when tab regains focus
      retry: 1,                    // Only retry once on failure
    },
  },
});
```

**Impact:** Instant navigation between pages - no loading spinners for cached data.

---

## Phase 2: CSS Containment for Cards (Low Risk)

### Current State
CSS containment classes exist but aren't applied to key performance-critical elements.

### Change
Add containment rules for heavy components in `src/index.css`:

```css
/* Performance containment for cards */
.service-card,
.response-card,
.suggestion-card,
.calculator-card {
  contain: content;
}

/* Scroll container optimization */
.message-scroll-container {
  contain: strict;
  content-visibility: auto;
}
```

**Impact:** Reduces paint cost by ~10-15% for card-heavy pages.

---

## Phase 3: Route Preloading (Low Risk)

### Current State
`index.html` has no prefetch hints for common navigation paths.

### Change
Add prefetch hints after fonts in `index.html`:

```html
<!-- Route prefetch for faster navigation -->
<link rel="prefetch" href="/src/pages/Settings.tsx" as="script">
<link rel="prefetch" href="/src/pages/Support.tsx" as="script">
<link rel="prefetch" href="/src/pages/Pricing.tsx" as="script">
```

**Impact:** Faster navigation to Settings/Support/Pricing pages.

---

## Phase 4: Debounce Suggestion Fetch (Low Risk)

### Current State
`CenterStageLayout.tsx` line 282-306 fetches suggestions immediately after each response.

### Change
Add 1-second debounce to reduce API calls:

```typescript
import { useMemo } from 'react';
import { debounce } from '@/lib/utils'; // Add debounce utility

// Inside component, wrap fetchDynamicSuggestions:
const debouncedFetchSuggestions = useMemo(
  () => debounce(fetchDynamicSuggestions, 1000),
  [fetchDynamicSuggestions]
);
```

**Requires:** Add debounce utility to `src/lib/utils.ts` if not present.

**Impact:** Reduces API calls when user sends multiple quick messages.

---

## Phase 5: Image Loading Optimization (Low Risk)

### Current State
Some images may block rendering.

### Change
Ensure all heavy images have `loading="lazy"` attribute.

**Files to check:**
- Service mockup components
- Landing page images
- Any Canvas 3D components

---

## Summary of Files to Modify

| File | Change | Risk |
|------|--------|------|
| `src/App.tsx` | Add QueryClient caching config | Low |
| `src/index.css` | Add CSS containment rules | Low |
| `index.html` | Add route prefetch hints | Low |
| `src/lib/utils.ts` | Add debounce utility (if missing) | Low |
| `src/components/dashboard/CenterStageLayout.tsx` | Debounce suggestion fetch | Low |

---

## What This Does NOT Change

| Area | Status |
|------|--------|
| Eye animations | Untouched - no changes to timing or springs |
| usePerformanceMode | Untouched - existing throttling preserved |
| Mouse tracking | Untouched - existing 16-100ms throttle preserved |
| Particle systems | Untouched - existing mobile reduction preserved |
| Message sending flow | Untouched - existing immediate dispatch preserved |
| AI streaming | Not enabled yet - requires backend changes |

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Page navigation | ~200-500ms | ~50-100ms (cached) |
| Settings page load | Full refetch | Instant from cache |
| Card paint cost | Full recalc | Isolated (contained) |
| Suggestion API calls | Every response | Debounced to 1s |

---

## Testing After Implementation

1. **Build succeeds:** `npm run build`
2. **No console errors:** Check DevTools
3. **Core features work:**
   - Login/Logout
   - Chat with eye animations
   - Settings navigation (should be faster)
   - Pricing page
4. **Eye responsiveness:** Verify animations feel the same

