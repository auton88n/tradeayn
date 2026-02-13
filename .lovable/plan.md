
# Fix Three Shades of Dark in Landing Page Footer Area

## Problem
In dark mode, the bottom of the landing page shows three subtly different shades of black in the area around the contact form and footer. This happens because:

1. The **services section** above uses card backgrounds (`dark:bg-card` = 6% brightness) for its bento grid cards, which are slightly lighter than the page background
2. The **contact section** has no explicit background, inheriting from the parent
3. The **footer** has `bg-background` explicitly set

When these areas meet, the visual transition between the card-tinted services area and the plain background creates visible bands.

## Fix

Make two changes in `src/components/LandingPage.tsx`:

1. **Add explicit `bg-background` to the contact section** (line 719) so it clearly defines its own background and doesn't inherit any stacking artifacts:
   - Change: `className="py-16 md:py-32 px-4 md:px-6"`
   - To: `className="py-16 md:py-32 px-4 md:px-6 bg-background"`

2. **Remove the redundant `bg-background` from the footer** (line 803) since it's now unnecessary -- the parent already provides it and having it creates a potential compositing layer:
   - Change: `className="border-t border-border bg-background pt-12 pb-6"`
   - To: `className="border-t border-border pt-12 pb-6"`

This ensures a single, uniform dark background across the entire bottom portion of the page, with only the footer's top border providing visual separation.
