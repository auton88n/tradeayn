

# Reduce Footer Border Brightness

## Problem
The footer's top border (`border-t border-border`) uses `--border: 0 0% 15%` in dark mode, which at 15% lightness on a 4% background creates a visible bright line that looks like an extra layer or shade difference.

## Fix

**File:** `src/components/LandingPage.tsx` (line 803)

Reduce the footer border opacity so it becomes a subtle separator rather than a prominent line:

- Change: `className="border-t border-border pt-12 pb-6"`
- To: `className="border-t border-border/30 pt-12 pb-6"`

This uses Tailwind's opacity modifier (`/30`) to make the border 30% opacity, keeping it as a hint of separation without creating a visible "layer" effect.
