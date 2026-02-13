

# Fix Three Shades of Black in Footer Area

## Problem
The footer uses `bg-card/50` (card color at 50% opacity), which creates a visible third shade of black between the page background and other sections. This breaks the seamless dark aesthetic.

## Fix
Change the footer background from `bg-card/50` to `bg-background` so it matches the page background exactly. The `border-t border-border` already provides a clean visual separator -- no extra background shade needed.

## Technical Details

**File:** `src/components/LandingPage.tsx` (line 803)

Change:
```
bg-card/50
```
To:
```
bg-background
```

This ensures the footer blends seamlessly with the rest of the page, maintaining only two visual layers: the background and the top border line.
