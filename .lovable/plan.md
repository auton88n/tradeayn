

# Compact the Footer

## Problem
The footer takes up too much vertical space due to large padding and gaps between elements.

## Fix

**File:** `src/components/LandingPage.tsx`

Reduce spacing throughout the footer:

| Line | Current | New |
|------|---------|-----|
| 803 | `pt-12 pb-6` | `pt-8 pb-4` |
| 805 | `gap-10 mb-10` | `gap-8 mb-6` |

This tightens the footer vertically so it feels compact and proportional to its content.

