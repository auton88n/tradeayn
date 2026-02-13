

# Professional Footer -- Like the Reference Image

## What Changes

Replace the current minimal footer (just a centered logo) with a professional 4-column footer inspired by the reference image.

## Layout

```text
+------------------------------------------------------------------------+
|                                                                        |
|  [Brain] AYN          Explore        Services         Contact          |
|  AI-Powered           Home           Structural       info@ayn.ca      |
|  Engineering          About          Estimation       Nova Scotia, CA  |
|                       Services       Code Compliance  Get Directions   |
|                       Contact        Terrain                           |
|                                      Event Planning                    |
|                                                                        |
|  -------------------------------------------------------------------   |
|  (c) 2026 AYN Inc. All rights reserved.                                |
+------------------------------------------------------------------------+
```

- On mobile: stacks into a single column
- Subtle top border on footer, separator before copyright
- Muted colors, theme-aware tokens

## Technical Details

**File:** `src/components/LandingPage.tsx` (lines 801-811)

- **Column 1**: AYN logo + Brain icon + tagline
- **Column 2 "Explore"**: Home, About, Services, Contact -- scroll links
- **Column 3 "Services"**: Lists the 5 service names from the cards above
- **Column 4 "Contact"**: Email (with Mail icon), location (with MapPin icon), "Get Directions" link
- **Bottom bar**: Copyright line with year and "AYN Inc."
- Full multi-language support (EN/AR/FR) matching existing patterns
- Uses `lucide-react` icons: `Mail`, `MapPin`, `Navigation`

