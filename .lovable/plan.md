

# Final Push to 100% Professional Quality

## Overview

8 gaps across 6 files. The biggest visual impact comes from denser wall hatching (GAP 1), followed by dimension density (GAP 2), and drawing sheet border treatment (GAP 7).

---

## GAP 1: Dense Wall Hatching

**File: `HatchPatternDefs.tsx`**

Change hatch pattern parameters:
- Exterior cross-hatch: `width`/`height` from 4 to 2, stroke-width from 0.3 to 0.5, background rect also 2x2
- Interior hatch: `width`/`height` from 5 to 2.5, stroke-width from 0.2 to 0.4, background rect also 2.5x2.5

This doubles the density and nearly doubles the line weight, making walls the darkest, heaviest element.

**File: `drawingConstants.ts`**

Update `HATCH_PATTERNS.EXTERIOR_CROSS` width/height to 2 and `HATCH_PATTERNS.INTERIOR` width/height to 2.5 (for consistency, though the actual rendering uses `HatchPatternDefs.tsx`).

---

## GAP 2: Dimension Density (~30 to ~100+)

**File: `FloorPlanRenderer.tsx`**

### 2A: Bottom and Right Side -- Add Level 1 + Level 2 Chains

Currently bottom has only Level 3 (overall) and right has only Level 3 (overall). Add:

**Bottom side**: Copy the Level 1 (detail) and Level 2 (room) logic from the Top side, but use `side="bottom"`.

**Right side**: Copy the Level 1 (detail) and Level 2 (room) logic from the Left side, but use `side="right"`.

This gives all 4 sides 3 distinct dimension chain levels.

### 2B: Fix Duplicate Dimensions on Left Side

The left side Level 1 and Level 2 currently use the same `getUniquePositions` logic, producing identical segments when rooms align. Fix: for Level 2, merge positions that are less than 3ft apart (already done for top), ensuring Level 2 has fewer, larger segments than Level 1.

### 2C: Interior Room Dimensions for ALL Rooms

Currently interior dimensions render for all non-closet/hallway/entry/stairwell rooms -- this is correct. Verify by checking the filter. The existing implementation at lines 485-515 already does this. No change needed unless some rooms are missing (they shouldn't be).

### 2D: Wall Thickness Annotations (2-3 locations)

Add a small helper that renders at 2 selected locations:
- Pick the first exterior wall and render a small dimension showing "5.5\"" perpendicular to the wall, with a leader arrow
- Pick the first interior wall and render "3.5\"" similarly
- These are tiny annotations placed at specific wall locations, using `FONTS.NOTE` size

---

## GAP 3: Living Room Sofa + Windows + Front Door

### 3A: Sofa Already Renders

The `LivingFixtures` component (lines 221-278 in RoomFixtures.tsx) already includes an L-shaped sofa + coffee table + dining table. If the sofa isn't appearing, it may be because the room SVG dimensions don't meet the threshold. The sofa renders unconditionally (not gated behind `isLargeRoom`), so it should always appear. No code change needed -- this is likely a visual perception issue at the current zoom/scale.

### 3B: Windows and Front Door -- AI Prompt Level

**File: `generate-floor-plan-layout/index.ts`**

The AI prompt already has strong window and front door mandates (Rules 5, 6, 12). Further strengthening:
- Add a VALIDATION CHECKLIST at the end of the system prompt: "Before returning, verify: (1) Front entry door exists on bottom wall? (2) Every habitable room's exterior wall has windows? (3) Kitchen-living wall removed for open concept? (4) Total window count >= 12?"
- In the user prompt, add: "Count your total windows before returning. Aim for 12-16 for a 3-bedroom house."

---

## GAP 4: Wall Thickness -- Thicker Exterior Outline

**File: `drawingConstants.ts`**

No constant change needed. Instead:

**File: `FloorPlanRenderer.tsx`**

Change exterior wall `strokeWidth` from `LINE_WEIGHTS.CUT_LINE` (2.0) to a hardcoded `2.5` for the exterior wall polygon stroke. Interior walls stay at `LINE_WEIGHTS.OUTLINE` (1.4).

---

## GAP 5: Room Labels -- Already ALL CAPS

The `RoomLabel` component (line 369) already calls `name.toUpperCase()`. No change needed.

---

## GAP 6: Closets in Bedrooms

**File: `generate-floor-plan-layout/index.ts`**

Add to system prompt: "Every bedroom MUST include a closet or walk-in wardrobe. Generate closets as separate rooms (minimum 3'x5' for reach-in, 6'x6' for walk-in) attached to each bedroom. Label them 'CLOSET' or 'W/W'. The master bedroom should have a walk-in closet."

**File: `RoomFixtures.tsx`**

Add a `ClosetFixtures` component -- draws a dashed rectangle with a shelf/rod line (horizontal line near top wall). Update `RoomFixtureRenderer` to map `closet` type to this component.

**File: `FloorPlanRenderer.tsx`**

Remove `closet` from the fixture and label filter lists so closets render with their labels and fixtures.

---

## GAP 7: Drawing Sheet Double Border

**File: `DrawingSheet.tsx`**

- Change outer border `strokeWidth` from `SHEET.BORDER_WIDTH` (1.5) to `3.0`
- Add an inner border rect offset 2 units inside with `strokeWidth={0.5}`
- This creates the professional double-border effect

---

## GAP 8: Bathroom Fixture Labels

**File: `RoomFixtures.tsx`**

Add small text labels inside `BathroomFixtures`:
- "WC" label next to toilet (positioned just right of toilet)
- "BATH" or "SHOWER" label inside the tub rectangle
- Use `FONTS.NOTE.size` at a smaller scale (2.5), `DRAWING_COLORS.MEDIUM_GRAY`
- Optional/low priority -- included since it's minimal code

---

## Files Modified (6 total)

| File | Changes |
|------|---------|
| `HatchPatternDefs.tsx` | GAP 1 -- denser hatch patterns (spacing 2/2.5, stroke 0.5/0.4) |
| `drawingConstants.ts` | GAP 1 -- update HATCH_PATTERNS constants to match |
| `FloorPlanRenderer.tsx` | GAP 2 (bottom/right dim chains, wall thickness annotations), GAP 4 (exterior stroke 2.5), GAP 6 (show closets) |
| `DrawingSheet.tsx` | GAP 7 (double border, outer stroke 3.0) |
| `RoomFixtures.tsx` | GAP 6 (closet fixtures), GAP 8 (bathroom labels) |
| `generate-floor-plan-layout/index.ts` | GAP 3B (validation checklist), GAP 6 (closet requirement) |

---

## Implementation Order

1. **`HatchPatternDefs.tsx`** + **`drawingConstants.ts`** -- Dense hatching (biggest visual impact, smallest change)
2. **`DrawingSheet.tsx`** -- Double border (2 lines added)
3. **`FloorPlanRenderer.tsx`** -- Bottom/right dimension chains + exterior stroke 2.5 + closet filters + wall thickness annotations
4. **`RoomFixtures.tsx`** -- Closet fixtures + bathroom labels
5. **`generate-floor-plan-layout/index.ts`** -- Validation checklist + closet requirement
6. Redeploy edge function

---

## Technical Notes

### Hatch Density Change (HatchPatternDefs.tsx)
Current exterior: 4x4 grid, 0.3 stroke -> sparse, light
New exterior: 2x2 grid, 0.5 stroke -> dense, dark (almost solid with visible texture)
Current interior: 5x5 grid, 0.2 stroke -> very faint
New interior: 2.5x2.5 grid, 0.4 stroke -> clearly visible single-hatch

### Bottom/Right Dimension Chains
Copy the exact same rendering logic from Top (lines 353-399) and Left (lines 420-465), changing `side` prop to `"bottom"` and `"right"` respectively. The `DimensionLine` component already handles all four sides via its `side` prop -- offsets are computed correctly for each direction.

### Wall Thickness Annotations
Render 2 small annotations as a `<g>` after the main dimension chains:
- Find first exterior wall segment -> draw a small perpendicular dimension showing "5.5\""
- Find first interior wall segment -> draw "3.5\""
- Position near the wall midpoint, using `FONTS.NOTE.size` for the text

### Closet Fixtures Component
```text
ClosetFixtures:
- Dashed rectangle border (room outline already rendered by walls)
- Horizontal line 2 units from top wall (represents shelf)
- Small circle below shelf line (represents rod, plan view)
- "W/W" or "CLOSET" label rendered by RoomLabel (already exists)
```

