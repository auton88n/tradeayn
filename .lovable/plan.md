

# Floor Plan Round 2 -- Professional Quality Polish

## Overview

9 fixes across 5 files to transform the floor plan from "computer-generated diagram" to "architect drew this." The changes address empty rooms, missing/faint elements, open concept logic, fixture scaling, and readability.

---

## Fix Details

### Issue 5: Open Concept (Remove Wall Between Kitchen and Living)
**File: `generate-floor-plan-layout/index.ts`** -- Update the AI system prompt to explicitly instruct:
- "When kitchen and living/dining are OPEN CONCEPT, do NOT generate a wall between them. The kitchen island or peninsula defines the space boundary."
- "Open concept means kitchen, living, and dining share one continuous space with NO separating walls."

This is an AI-generation-level fix. The renderer already draws whatever walls the AI provides -- the fix is to stop generating the dividing wall.

### Issue 1: Living/Dining Room Empty
**File: `RoomFixtures.tsx`** -- The `LivingFixtures` component exists but currently only draws a sofa and coffee table. The `RoomFixtureRenderer` maps `living` and `family` types to `LivingFixtures`, but the room type from the AI is likely `living` covering both living AND dining. Fix:
- Update `RoomFixtureRenderer` to also render `LivingFixtures` for rooms whose name contains "living" even if the type is different
- Enhance `LivingFixtures` to include both a sofa section AND a dining table section when the room is large enough (width > 20 SVG units)
- Add an L-shaped sofa (two connected rectangles) instead of a single rectangle
- Add dining table with 6 chair circles in the kitchen-adjacent half

### Issue 3: Windows Too Small/Faint
**File: `ArchitecturalSymbols.tsx`** -- Increase window line weights:
- Change outer lines from `LINE_WEIGHTS.OUTLINE` (1.4) to `LINE_WEIGHTS.CUT_LINE` (2.0) -- same as walls so they stand out
- Change center glass line from `LINE_WEIGHTS.MEDIUM` (1.0) to `LINE_WEIGHTS.OUTLINE` (1.4)
- These changes make windows clearly visible within wall breaks

**File: `generate-floor-plan-layout/index.ts`** -- Strengthen window rules in the prompt:
- "Window width must be at least 36 inches for bedrooms, 48 inches for living rooms"
- "Living/dining rooms with large exterior walls need 3-4 windows"
- "No habitable room's exterior wall should be windowless"

### Issue 6: Bathroom Fixtures Too Tiny
**File: `RoomFixtures.tsx`** -- Scale up all bathroom fixtures in `BathroomFixtures`:
- Currently fixtures are sized proportionally to room dimensions with small multipliers
- Change toilet size: increase `toiletW` to `Math.min(width * 0.25, 4)` and `toiletH` to `Math.min(depth * 0.25, 5)` (from 0.2 and 0.2)
- Change bathtub: increase `tubW` to `width * 0.35` and ensure `tubH` fills most of room depth
- Change vanity: increase `vanityW` to `width * 0.55` for ensuite (double vanity)
- Increase all fixture stroke weights from `FIX_THIN` to `FIX_WEIGHT` for toilet and tub outlines

### Issue 4: No Garage Door
**File: `RoomFixtures.tsx`** -- Add garage door rendering to `GarageFixtures`:
- Draw a dashed line across the top wall of the garage (the driveway-facing side)
- Use `DASH_PATTERNS.HIDDEN` for the overhead door representation
- Label "16'-0\" GARAGE DOOR" centered above the dashed line
- The garage door is a wide opening (16ft for double) shown as a thin dashed line

### Issue 2: Kitchen Wall Counters Missing
**File: `RoomFixtures.tsx`** -- The `KitchenFixtures` component already draws counters, but they may be too faint or undersized. Fix:
- Increase `counterD` (counter depth) from `width * 0.15` to `width * 0.18` with `maxCounter` raised from 5 to 6
- Change counter stroke from `FIX_WEIGHT` (1.0) to `LINE_WEIGHTS.OUTLINE` (1.4) so they are clearly visible against the white room
- Ensure the L-shaped counter extends along both the top and right walls
- Increase sink and stove symbols proportionally

### Issue 7: No Front Entry Door
**File: `generate-floor-plan-layout/index.ts`** -- The prompt already says "Front entry door (36") on the street-facing wall is MANDATORY." Strengthen this:
- "The FRONT ENTRY DOOR must be placed on the BOTTOM exterior wall (street-facing). This is the primary entrance for visitors. Always generate it. If an entry/foyer room exists, the front door opens into it."
- This is an AI-level fix -- the renderer already handles doors correctly.

### Issue 8: Dimension Text Too Small
**File: `drawingConstants.ts`** -- Increase dimension font size:
- `FONTS.DIMENSION.size` from `3.2` to `4.5` (40% increase)
- `FONTS.ROOM_AREA.size` from `3.0` to `3.8`
- Increase `SHEET.TICK_SIZE` from `2` to `2.5` for proportional tick marks

### Issue 9: Watermark Too Prominent
**File: `DrawingSheet.tsx`** -- Reduce watermark opacity:
- Change `opacity={0.15}` to `opacity={0.06}` (from 15% to 6%)
- Change fill from `DRAWING_COLORS.VERY_LIGHT_GRAY` to `#E0E0E0` (even lighter)
- Reduce font size from `24` to `20` so it doesn't span as wide

---

## Files Modified (5 total)

| File | Issues Fixed |
|------|-------------|
| `RoomFixtures.tsx` | 1 (living furniture), 2 (kitchen counters), 4 (garage door), 6 (bathroom scale) |
| `ArchitecturalSymbols.tsx` | 3 (window line weights) |
| `drawingConstants.ts` | 8 (dimension text size) |
| `DrawingSheet.tsx` | 9 (watermark opacity) |
| `generate-floor-plan-layout/index.ts` | 5 (open concept), 3 (more windows), 7 (front door) |

---

## Implementation Order

1. **drawingConstants.ts** -- Bump font sizes (Issue 8) -- 1 line change
2. **DrawingSheet.tsx** -- Reduce watermark (Issue 9) -- 2 line changes
3. **ArchitecturalSymbols.tsx** -- Window line weights (Issue 3) -- 6 line changes
4. **RoomFixtures.tsx** -- All fixture improvements (Issues 1, 2, 4, 6) -- significant rewrite of fixture components
5. **generate-floor-plan-layout/index.ts** -- AI prompt updates (Issues 5, 7, more windows) -- prompt text additions
6. Redeploy edge function

