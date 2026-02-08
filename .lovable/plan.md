

# Clean Up index.html Meta Tags and Invalid Prefetch Links

## Overview

Remove duplicate and non-functional tags from `index.html`.

## Changes (index.html only)

### 1. Remove duplicate meta tags (lines 129-132)

These four tags at the bottom of `<head>` duplicate the Open Graph and Twitter tags already defined above:

- `<meta property="og:title" content="AYN">`
- `<meta name="twitter:title" content="AYN">`
- `<meta property="og:description" content="AYN AI learns your habits...">`
- `<meta name="twitter:description" content="AYN AI learns your habits...">`

### 2. Remove invalid prefetch links (lines 68-70)

These reference raw `.tsx` source files which don't exist in production builds -- Vite compiles them into hashed chunks:

- `<link rel="prefetch" href="/src/pages/Settings.tsx" as="script">`
- `<link rel="prefetch" href="/src/pages/Support.tsx" as="script">`
- `<link rel="prefetch" href="/src/pages/Pricing.tsx" as="script">`

