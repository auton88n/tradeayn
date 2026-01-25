

## Increase Card Spacing in AI Employee Mockup

This plan addresses the cramped layout of the role cards orbiting around the brain in the AI Employee mockup.

---

## Current Issue

The role cards around the brain hub are too close together because:
1. The `orbitRadius` is only `120px` - making the orbit too tight
2. The container `min-h-[320px]` may not provide enough vertical space for the labels

---

## Solution

Increase the orbit radius and adjust container sizing to give the cards more breathing room.

---

## Changes

### File: `src/components/services/AIEmployeeMockup.tsx`

| Line | Current | Fixed |
|------|---------|-------|
| 28 | `const orbitRadius = 120;` | `const orbitRadius = 140;` |
| 30 | `min-h-[320px]` | `min-h-[360px]` |
| 47 | `r={orbitRadius}` | Keep (uses variable) |

**Technical Details:**

1. **Increase orbit radius from 120px to 140px** - This pushes the cards outward by 20px, creating more separation between them

2. **Increase minimum container height from 320px to 360px** - This provides more vertical space to accommodate the larger orbit and prevents label clipping

---

## Visual Result

- Cards will be more spread out around the brain
- Better visual balance and readability
- Labels won't overlap with adjacent cards
- The orbital ring SVG automatically adjusts since it uses the `orbitRadius` variable

