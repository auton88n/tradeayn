

# Core Web Vitals Reporting (with Sampling)

## Overview

Add client-side performance monitoring that captures real navigation timing metrics and reports them to a new lightweight edge function. Includes a 10% session sampling rate to keep database writes manageable at scale.

## Sampling Math

At 30,000 users with ~1 page load each:
- Without sampling: 90,000 rows/day (3 metrics per load)
- With 10% sampling: ~9,000 rows/day -- statistically meaningful, far fewer writes

## Changes

### 1. New file: `src/lib/performanceMonitor.ts`

Client-side module that:
- Exits early in dev mode (`import.meta.env.DEV`)
- **Exits early 90% of the time** (`if (Math.random() > 0.1) return`)
- Waits for `window.load` + 3s delay for accurate final metrics
- Collects TTFB, DCL, full load time, page path, connection type via Navigation Timing API
- Sends via `navigator.sendBeacon` (non-blocking, fire-and-forget)
- Uses `SUPABASE_URL` from `src/config.ts`
- All errors silently caught

```typescript
export function initPerformanceMonitoring() {
  if (import.meta.env.DEV) return;
  if (Math.random() > 0.1) return; // 10% sampling

  window.addEventListener('load', () => {
    setTimeout(() => {
      try {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (!nav) return;
        const metrics = {
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          dcl: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          load: Math.round(nav.loadEventEnd - nav.startTime),
          url: window.location.pathname,
          connection: (navigator as any).connection?.effectiveType || 'unknown',
        };
        navigator.sendBeacon?.(
          `${SUPABASE_URL}/functions/v1/report-vitals`,
          JSON.stringify(metrics)
        );
      } catch { /* silent */ }
    }, 3000);
  });
}
```

### 2. New edge function: `supabase/functions/report-vitals/index.ts`

Minimal function that:
- Accepts POST with JSON body (`ttfb`, `dcl`, `load`, `url`, `connection`)
- Validates payload, rejects malformed data
- Inserts 3 rows into existing `performance_metrics` table (one per metric type)
- Returns 204 No Content
- Handles CORS preflight

### 3. Update: `src/main.tsx`

Add import and call after `createRoot`:
```typescript
import { initPerformanceMonitoring } from '@/lib/performanceMonitor';
initPerformanceMonitoring();
```

### 4. Update: `supabase/config.toml`

```toml
[functions.report-vitals]
verify_jwt = false
```

## Data stored in `performance_metrics`

Each sampled page load inserts 3 rows:

| metric_type | metric_value | details |
|------------|-------------|---------|
| `web_vital_ttfb` | 120 | `{"url": "/", "connection": "4g"}` |
| `web_vital_dcl` | 450 | `{"url": "/", "connection": "4g"}` |
| `web_vital_load` | 1200 | `{"url": "/", "connection": "4g"}` |

## Files changed

| File | Change |
|------|--------|
| `src/lib/performanceMonitor.ts` | New -- client metrics with 10% sampling |
| `supabase/functions/report-vitals/index.ts` | New -- stores vitals in DB |
| `src/main.tsx` | Call `initPerformanceMonitoring()` |
| `supabase/config.toml` | Add `report-vitals` config |

