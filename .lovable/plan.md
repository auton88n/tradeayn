
# Add Service Worker for Offline App Shell Caching

## Overview

Add a basic service worker that caches the app shell (HTML, JS, CSS) so users see the cached app instead of a blank page when they lose internet. API/Supabase requests are excluded from caching.

## Changes

### 1. New file: `public/sw.js`

A service worker with a network-first strategy for static assets:

- **Install**: Pre-caches `/` and `/index.html`
- **Activate**: Cleans up old cache versions
- **Fetch**: For GET requests to static assets (.js, .css, `/`), tries network first, falls back to cache. API calls (Supabase, Google Analytics) are never cached.

The cache name includes a version (`ayn-v1`) so future updates can bust the cache by incrementing.

### 2. Update: `src/main.tsx`

Register the service worker in production only:

```typescript
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
```

The registration is deferred to `load` event to avoid competing with critical resources during initial page load.

## What gets cached

| Resource | Cached? |
|----------|---------|
| App shell HTML (`/`, `/index.html`) | Yes (pre-cached) |
| JS bundles (`.js`) | Yes (on first visit) |
| CSS files (`.css`) | Yes (on first visit) |
| Supabase API calls | No |
| Google Analytics | No |
| Edge function calls | No |
| Images, fonts | No (keeps cache small) |

## What this does NOT do

- No background sync or push notifications
- No offline data persistence (that's handled by the existing `offlineQueue`)
- No precaching of all routes -- only what the user has visited

## Files changed

| File | Change |
|------|--------|
| `public/sw.js` | New service worker |
| `src/main.tsx` | Register service worker in production |
