

# Self-Host Critical Fonts via @fontsource

## Problem

The external Google Fonts CSS link is a render-blocking resource that adds network latency (DNS lookup to googleapis.com + gstatic.com, CSS download, then font file download). While `&display=swap` is already set, the progressive React render -- where "Meet AYN" appears alone before JS chunks finish -- makes the font swap visible. Self-hosting eliminates the external dependency entirely.

## Approach

Replace the Google Fonts `<link>` in `index.html` with locally bundled fonts via `@fontsource` packages. Fonts get bundled into the Vite build, served from the same origin, and load with zero extra network round-trips.

## Changes

### 1. Install @fontsource packages

```
@fontsource/syne (weights: 400, 500, 600, 700, 800)
@fontsource/inter (weights: 300, 400, 500, 600, 700)
@fontsource/jetbrains-mono (weights: 400, 500, 600)
@fontsource/playfair-display (weights: 400, 500, 600, 700)
@fontsource/noto-sans-arabic (weights: 400, 500, 600, 700)
```

### 2. Import fonts in `src/main.tsx`

Add imports for each font weight used. Only the weights actually needed are imported -- no full family bundles. Example:

```
import '@fontsource/syne/400.css';
import '@fontsource/syne/500.css';
import '@fontsource/syne/600.css';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
// ... etc for each family/weight
```

Each import is a small CSS file that references a WOFF2 file bundled in `node_modules`. Vite handles asset resolution automatically.

### 3. Remove external Google Fonts from `index.html`

Remove these lines (~63-66):

- `<link rel="preconnect" href="https://fonts.googleapis.com">`
- `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- The Google Fonts `<link href="https://fonts.googleapis.com/css2?..." rel="stylesheet">`

Keep the Supabase preconnect as-is.

### 4. No changes to CSS or Tailwind config

The `font-family` declarations in your Tailwind config / CSS already reference `'Syne'`, `'Inter'`, etc. by name. @fontsource registers the exact same family names, so everything continues to work.

## What This Fixes

- Eliminates 2 external DNS lookups (googleapis.com + gstatic.com)
- Eliminates render-blocking external CSS fetch
- Fonts are bundled and served from your own domain via Vite
- Font files are cache-busted with content hashes automatically
- No fragile hardcoded gstatic URLs
- You control `font-display` directly if needed in the future

## Files Affected

- `package.json` -- 5 new @fontsource dependencies
- `src/main.tsx` -- font CSS imports added
- `index.html` -- 3 lines removed (Google Fonts preconnect + stylesheet)

