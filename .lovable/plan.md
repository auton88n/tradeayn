

# Fix Dark Background Flash on Light Mode Refresh

## Problem

The `<body>` tag in `index.html` has a hardcoded dark background: `style="background-color: hsl(0 0% 4%);"`. This is always dark regardless of theme. The inline theme script in `<head>` tries to fix it with `if (document.body) document.body.style.backgroundColor = bgColor`, but `document.body` doesn't exist yet when the script runs in `<head>`, so the fix never applies.

**Result**: On every refresh in light mode, the dark body background is visible for a split second before React/CSS takes over.

## Changes

### File: `index.html`

**1. Remove the hardcoded dark background from `<body>` (line 174)**

Change:
```html
<body style="background-color: hsl(0 0% 4%);">
```
To:
```html
<body>
```

**2. Update the inline theme script (line 138-154) to set background on `<html>` only (which it already does) and also add a small `<script>` right after `<body>` opens to set the body background immediately when body exists.**

Move body background assignment into a tiny inline script right after the `<body>` tag:
```html
<body>
  <script>
    // Apply theme background to body (runs immediately when body exists)
    var isDark = document.documentElement.classList.contains('dark');
    document.body.style.backgroundColor = isDark ? 'hsl(0 0% 4%)' : 'hsl(0 0% 100%)';
  </script>
  <div id="root" ...>
```

This way:
- The `<head>` script determines theme and sets it on `<html>` (already works)
- The `<body>` script runs immediately when body is created and reads the class from `<html>` to apply the correct background
- No more hardcoded dark-only background

### Files affected
- `index.html` only (2 small edits)
