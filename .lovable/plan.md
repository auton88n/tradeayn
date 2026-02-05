
# Fix Two Different Black Colors on Landing Page

## Problem Identified

In dark mode, the landing page shows two visually different black shades:
1. **Contact Section**: Background color `hsl(0 0% 4%)` = `#0a0a0a`
2. **Footer**: Same background BUT has `border-t border-border` which creates a visible line at `hsl(0 0% 15%)` = `#262626`

The border creates a visual separation that makes the two sections appear as different shades.

---

## Solution

Remove the border from the footer to create a seamless transition, and optionally add subtle visual separation that doesn't create the "two different blacks" effect.

### File: `src/components/LandingPage.tsx`

**Current code (line 801):**
```tsx
<footer className="py-6 border-t border-border">
```

**Updated code:**
```tsx
<footer className="py-6">
```

This removes the border that creates the visible separation between the contact section and footer.

---

## Alternative (if you want some separation)

If you prefer to keep some visual distinction, use a subtler approach:

```tsx
<footer className="py-6 border-t border-border/30">
```

This makes the border 30% opacity, creating a much softer transition.

---

## Technical Summary

| Location | Change |
|----------|--------|
| `src/components/LandingPage.tsx` | Remove `border-t border-border` from footer OR reduce opacity to `border-border/30` |

## Result

After this change, the footer and contact section will appear as one seamless dark background without the visible line creating two different shades.
