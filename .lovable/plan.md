

# Fix Background Shift Between Service Cards on Scroll

## Problem

When scrolling between service cards (e.g., "Smart Ticketing System" to "Custom AI Agents"), you see the background shift from a lighter dark shade to a darker shade and back. This happens because:

- Each service card has a `dark:bg-card` background (6% lightness -- slightly lighter black)
- The page background is `bg-background` (4% lightness -- darker black)
- The `ScrollReveal` wrapper starts each card at **opacity: 0** (fully invisible)
- As you scroll, the invisible card reveals the darker page background underneath
- When the card fades in, it shifts from dark black (4%) to light black (6%)

This creates the "two shades of black" flicker you see between cards.

## Solution

Remove the `ScrollReveal` animation wrappers from the 6 service cards in the bento grid. The cards will simply be visible immediately -- no fade-in, no background shift. The section header ("Six Ways We Help") keeps its animation.

### File: `src/components/LandingPage.tsx`

For each of the 6 service cards (around lines 532, 560, 592, 624, 655, 685), replace `<ScrollReveal>` and `</ScrollReveal>` wrappers with plain fragments or remove them entirely.

**Before** (repeated 6 times with different content):
```tsx
<ScrollReveal>
  <Link to="/services/...">
    <motion.div className="... dark:bg-card ...">
      ...
    </motion.div>
  </Link>
</ScrollReveal>
```

**After**:
```tsx
<Link to="/services/...">
  <motion.div className="... dark:bg-card ...">
    ...
  </motion.div>
</Link>
```

The cards still keep their hover lift animation (`whileHover: { y: -4 }`), just without the scroll-triggered fade-in that causes the background color shift.

### Files affected
- `src/components/LandingPage.tsx` -- remove `ScrollReveal` from 6 service card wrappers
