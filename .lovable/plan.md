

# Fix: Replace Lovable Icon with AYN Brain in Google Search

## Problem

Google Search is showing the Lovable heart icon instead of your AYN brain favicon because:

1. **`index.html` line 18** points to an external Google Storage URL for the favicon - this external file is the Lovable heart icon
2. Your correct brain favicon already exists at `public/favicon.png` but isn't being used
3. Google has cached the old Lovable favicon

## Solution

### 1. Update index.html favicon references

Change the favicon link from the external URL to your local file:

```html
<!-- FROM (line 18): -->
<link rel="icon" type="image/png" href="https://storage.googleapis.com/gpt-engineer-file-uploads/...">

<!-- TO: -->
<link rel="icon" type="image/png" href="/favicon.png">
```

Also add a standard `.ico` format favicon for broader compatibility:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon.png">
```

### 2. Add favicon.ico file

Create a standard `favicon.ico` in the public folder (convert from your existing PNG) for maximum browser/search engine compatibility.

### 3. Update JSON-LD logo references

Line 110 references a non-existent file:
```json
"logo": "https://aynn.io/ayn-logo.png"
```

Change to:
```json
"logo": "https://aynn.io/favicon.png"
```

## After Publishing

Google takes **days to weeks** to update cached favicons. To speed this up:

1. Use [Google Search Console](https://search.google.com/search-console) to request re-indexing of your homepage
2. Optionally submit a manual favicon update request

## Files to modify

| File | Change |
|------|--------|
| `index.html` | Update favicon `<link>` tags to use `/favicon.png` |
| `index.html` | Fix JSON-LD logo URL |
| `public/` | Add `favicon.ico` (converted from PNG) |

