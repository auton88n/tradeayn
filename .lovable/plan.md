

# Remove Fabricated aggregateRating from JSON-LD

## Problem

The `SoftwareApplication` JSON-LD in `index.html` contains a fabricated `aggregateRating` block claiming 30,000 ratings at 4.8 stars. Google can issue a manual action penalty for fake structured data, removing rich snippets or demoting the site.

## Change

**File: `index.html`** -- Remove the `aggregateRating` block (lines ~92-96) from the first JSON-LD script. Everything else in the JSON-LD stays unchanged.

**Before:**
```json
"offers": { ... },
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.8",
  "ratingCount": "30000"
},
"inLanguage": ["en", "ar", "fr"],
```

**After:**
```json
"offers": { ... },
"inLanguage": ["en", "ar", "fr"],
```

One file, one deletion. The rating can be re-added later with verified review data.

