

# Fix: ThemeProvider Class Removal Causing Background Flash

## Root Cause

The `ThemeProvider` component (`src/components/shared/theme-provider.tsx`) has a `useEffect` that runs on mount and does this:

```
root.classList.remove("light", "dark")   // <-- removes BOTH classes
root.classList.add(theme)                // <-- adds correct one back
```

The inline script in `index.html` already sets the correct class (`dark` or `light`) on `<html>` before React loads. But when React hydrates and ThemeProvider mounts, the `useEffect` strips both classes for one frame, then re-adds the same class. During that frame:

- CSS variables defined under `.dark { ... }` disappear
- `html:not(.light):not(.dark) #root { visibility: hidden }` kicks in
- The background flashes to the browser default

## Fix

### File: `src/components/shared/theme-provider.tsx`

Update the `useEffect` to skip the class swap when the correct class is already present:

```typescript
useEffect(() => {
  const root = window.document.documentElement;
  const resolvedTheme = theme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : theme;

  // Skip if the correct class is already set (e.g., by the inline head script)
  if (root.classList.contains(resolvedTheme)) return;

  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
}, [theme]);
```

This way:
- On initial load, the inline script has already set the class, so the effect is a no-op (no flash)
- On theme toggle, the class changes, so the effect runs normally
- System theme is resolved before checking

### Files affected
- `src/components/shared/theme-provider.tsx` -- update the `useEffect` (lines 33-49)

