

# Fix Landing Page Dark Mode to Match Dashboard Quality

## Problem

The landing page dark mode has two issues that the dashboard doesn't have:

1. **Two shades of black visible while scrolling**: The page background is `--background` (4% lightness / #0A0A0A) while service cards use `dark:bg-card` (6% lightness / #0F0F0F). The gap between cards reveals the darker page background, creating a noticeable color shift as you scroll.

2. **Remaining scroll animations cause flicker**: The "About" section (6 value prop items) and the "Contact" section still use `ScrollReveal` wrappers, which start elements at `opacity: 0` and fade them in. This makes the darker background flash through as elements appear.

The dashboard avoids both issues because it doesn't use scroll animations and has a uniform background throughout.

## Solution

### 1. Unify the landing page background with the card color

Wrap the services section in a seamless dark background so there's no visible shift between the page and the cards. Specifically, give the services section container a `bg-card` background in dark mode so the gaps between cards match the cards themselves -- eliminating the two-tone effect.

### 2. Remove remaining ScrollReveal wrappers

Remove the `ScrollReveal` wrappers from the 6 value prop items in the "About" section (lines 424-507) and the 2 wrappers in the "Contact" section (lines 708, 722). This prevents the opacity:0 flash that reveals the darker background as you scroll.

## Technical Details

### File: `src/components/LandingPage.tsx`

**Change 1 -- Services section background**: On line 513, add a dark-mode background to the services section so the space between cards is the same shade as the cards:

```tsx
// Before:
<section id="services" className="py-16 md:py-32 px-4 md:px-6 overflow-x-hidden">

// After:
<section id="services" className="py-16 md:py-32 px-4 md:px-6 overflow-x-hidden dark:bg-card">
```

**Change 2 -- Remove ScrollReveal from About section value props** (lines 424-507): Remove the 6 `<ScrollReveal>` wrappers around the value proposition items. Keep the section header's `ScrollReveal` (line 407).

**Change 3 -- Remove ScrollReveal from Contact section** (lines 708 and 722): Remove the 2 `<ScrollReveal>` wrappers in the contact section so the heading and form appear immediately.

### Files affected
- `src/components/LandingPage.tsx` -- add dark:bg-card to services section, remove 8 ScrollReveal wrappers (6 in About + 2 in Contact)
