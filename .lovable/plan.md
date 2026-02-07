

# Fix Persistent Background Flash on Dark Mode Refresh

## Root Cause

Two issues are combining to create the flash:

1. **CSS transition on initial load**: `index.css` line 127-130 applies `transition: background-color 0.2s ease-out` to `html, body`. When the CSS bundle loads after the inline scripts have already set the background, the transition animates the "re-application" of the same color -- creating a visible flicker.

2. **CSS `background` shorthand overrides inline style**: The rules at lines 379-384 use `background:` (shorthand), which resets the inline `backgroundColor` set by the body script. The browser briefly shows the default before re-applying.

## Changes

### File: `src/index.css`

**1. Disable transition on initial page load**

Add a rule that suppresses background transitions until the page is ready. The inline `<head>` script already adds a class (`dark` or `light`) to `<html>`, so we can use a CSS approach:

```css
/* Suppress transitions on initial load - re-enable after first paint */
html:not([data-ready]),
html:not([data-ready]) body {
  transition: none !important;
}
```

**2. Add `data-ready` attribute after first paint**

### File: `index.html`

Add at the end of the `<body>` script (after setting background):

```html
<script>
  var isDark = document.documentElement.classList.contains('dark');
  document.body.style.backgroundColor = isDark ? 'hsl(0 0% 4%)' : 'hsl(0 0% 100%)';
  // Re-enable transitions after first paint
  requestAnimationFrame(function() {
    document.documentElement.setAttribute('data-ready', '');
  });
</script>
```

This ensures:
- The inline script sets the correct background instantly (no transition)
- After the first paint, `data-ready` is added, re-enabling smooth transitions for theme toggling
- No visible flash on refresh in either light or dark mode

### Files affected
- `src/index.css` -- add 4 lines (transition suppression rule)
- `index.html` -- add 3 lines to existing body script
