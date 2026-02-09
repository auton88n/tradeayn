

# Final 4 Tweaks — Hatch Density, Right Dimensions, Interior Dimensions

## Tweak 1: Reduce Hatch Density

**File: `HatchPatternDefs.tsx`**

- Exterior cross-hatch: `width`/`height` from 2 to **2.5**, `strokeWidth` stays at 0.5 (lines become visible individually instead of merging into near-solid)
- Interior hatch: `width`/`height` from 2.5 to **3**, `strokeWidth` stays at 0.4
- Update the background `<rect>` dimensions to match

**File: `drawingConstants.ts`**

- Update `HATCH_PATTERNS.EXTERIOR_CROSS` width/height to 2.5
- Update `HATCH_PATTERNS.INTERIOR` width/height to 3

---

## Tweak 2: Right Side Level 1 + Level 2 Dimension Chains

**File: `FloorPlanRenderer.tsx`** (lines 520-575)

The right side already has Level 1 (detail, lines 522-538), Level 2 (room, lines 541-566), and Level 3 (overall, lines 568-575). These were added in the previous round. If they are not rendering, the issue may be that the `DimensionLine` component's `side="right"` offset logic pushes them off-canvas or overlaps. Verify the code is intact and the offsets match the left side exactly. No code change expected -- this is already implemented.

---

## Tweak 3: Interior Dimensions for EVERY Room + Readability

**File: `FloorPlanRenderer.tsx`** (lines 610-641)

Current filter excludes closet, hallway, entry, stairwell. The fix:

- **Remove the filter entirely** -- render interior dimensions for ALL rooms including closets, hallways, entries, and stairwells. Every space gets width + depth dimensions.
- **Increase interior dimension font size by 20%**: Change `fontSize={FONTS.NOTE.size}` (2.8) to `fontSize={FONTS.NOTE.size * 1.2}` (3.36) for readability.
- **Fix overlap with room labels**: Move interior dimension inset from 2 to **1.5** SVG units so they sit closer to walls and away from center labels. The width dimension stays near the top wall, depth near the left wall -- neither overlaps the centered room label.
- **Add small tick marks** at each end of interior dimension lines (tiny perpendicular lines 1 SVG unit long) so the dimension endpoints are clear.

**File: `FloorPlanRenderer.tsx`** (lines 328-343 -- Room Labels)

Shift room labels slightly toward center-bottom of each room to avoid overlap with top/left interior dimensions:
- Change label Y position from `room.y + room.depth / 2` to `room.y + room.depth * 0.6` (moves label 10% lower, away from the top-wall width dimension).

---

## Files Modified (3 total)

| File | Changes |
|------|---------|
| `HatchPatternDefs.tsx` | Tweak 1 -- exterior spacing 2.5, interior spacing 3 |
| `drawingConstants.ts` | Tweak 1 -- update HATCH_PATTERNS constants |
| `FloorPlanRenderer.tsx` | Tweak 3 -- remove room type filter on interior dims, increase font 20%, shift label Y to 0.6, add tick marks |

---

## Implementation Order

1. `HatchPatternDefs.tsx` + `drawingConstants.ts` -- Hatch spacing (2 lines each)
2. `FloorPlanRenderer.tsx` -- Interior dimensions for all rooms + font increase + label repositioning

