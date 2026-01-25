

## Fix Service Card Edge Line Artifacts

The visible "shadow line" on the edge of service cards is caused by anti-aliasing artifacts when semi-transparent backgrounds (`bg-muted/50`) are rendered with large rounded corners (`rounded-3xl`). The browser's sub-pixel rendering creates a faint visible edge where the 50% opacity gray meets the white page background.

---

## Root Cause

```text
┌─────────────────────────────────────────────────────────────┐
│                    The Problem                              │
├─────────────────────────────────────────────────────────────┤
│ • bg-muted/50 = 50% transparent light gray                  │
│ • rounded-3xl = 24px border radius                          │
│ • When semi-transparent colors meet opaque backgrounds      │
│   at curved edges, anti-aliasing creates visible artifacts  │
│ • This appears as a faint "line" around the card edge       │
└─────────────────────────────────────────────────────────────┘
```

---

## Solution

Replace the semi-transparent `bg-muted/50` with a fully opaque equivalent color that matches the visual appearance without transparency.

| Current | Fixed |
|---------|-------|
| `bg-muted/50` (semi-transparent) | `bg-[hsl(0,0%,98%)]` in light mode or theme-aware solid background |

The simplest fix is to use CSS variables with solid colors that visually match what `bg-muted/50` produces against the white background, eliminating the anti-aliasing issue entirely.

---

## Changes

### File: `src/components/LandingPage.tsx`

Replace all instances of `bg-muted/50` in the services bento grid with a solid background:

**Option A (Recommended)**: Use a custom solid color class that matches the blended result:
- Light mode: `bg-muted/50` on white = approximately `#FAFAFA` or `hsl(0 0% 98%)`
- Replace with: `bg-neutral-50 dark:bg-neutral-900/80`

**Option B**: Use `bg-muted` without transparency (slightly darker but no artifacts)

**Changes to make (5 service cards)**:
- Line ~571: Content Creator card
- Line ~600: Automation card  
- Line ~631: Ticketing card
- Line ~663: AI Agents card
- Line ~694: AI Employees card

The Engineering card already uses a different style (`bg-gradient-to-br from-cyan-500/10 to-blue-500/10`) so it's unaffected.

---

## Technical Details

```text
Before (causes edge lines):
┌─────────────────────────────────────┐
│ className="bg-muted/50 rounded-3xl" │
│                                     │
│  bg-muted/50 = semi-transparent     │
│  Anti-aliasing at edges = visible   │
└─────────────────────────────────────┘

After (clean edges):
┌───────────────────────────────────────────────────────┐
│ className="bg-neutral-50 dark:bg-neutral-900/80       │
│            rounded-3xl"                               │
│                                                       │
│  Solid color in light mode = no edge artifacts        │
│  Slight transparency in dark mode acceptable          │
└───────────────────────────────────────────────────────┘
```

---

## Summary

| File | Change |
|------|--------|
| `src/components/LandingPage.tsx` | Replace `bg-muted/50` with `bg-neutral-50 dark:bg-neutral-900/80` on 5 service cards |

This eliminates the edge line artifact by using fully opaque backgrounds that don't require anti-aliasing blending at curved corners.

