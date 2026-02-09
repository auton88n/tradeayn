

# Upgrade AYN Floor Plan to Professional Architectural Quality

## Overview

9 changes across 6 files to match the reference professional drawing. The biggest visual upgrade is wall hatching (cross-hatch for exterior, single-hatch for interior), followed by multi-level dimension chains, bold door swings, and section cut indicators.

---

## Change 1: Wall Hatching (BIGGEST VISUAL UPGRADE)

**Files: `FloorPlanRenderer.tsx`, `drawingConstants.ts`**

Add SVG `<defs>` with three hatch patterns to the renderer's SVG output:
- `hatch-exterior-cross`: Two sets of diagonal lines at 45 degrees crossing (cross-hatch), stroke-width 0.3, spacing 4 SVG units. Represents insulated exterior wall construction.
- `hatch-interior`: Single diagonal lines at 45 degrees, stroke-width 0.2, spacing 5 SVG units. Represents interior partition walls.

In `FloorPlanRenderer.tsx`, change the wall rendering:
- Currently walls use `fill={DRAWING_COLORS.BLACK}` (exterior) and `fill={DRAWING_COLORS.DARK_GRAY}` (interior)
- Change to: exterior walls get `fill="url(#hatch-exterior-cross)"` with `stroke={DRAWING_COLORS.BLACK}` at `LINE_WEIGHTS.CUT_LINE`
- Interior walls get `fill="url(#hatch-interior)"` with `stroke={DRAWING_COLORS.BLACK}` at `LINE_WEIGHTS.OUTLINE`
- Add a `<defs>` block at the top of the SVG containing the pattern definitions

Add hatch pattern IDs to `drawingConstants.ts` as new constants for easy reference.

---

## Change 2: Multiple Parallel Dimension Chains (3 Levels)

**File: `FloorPlanRenderer.tsx`**

Currently there are 2 levels: segment dimensions at `DIMENSION_OFFSET / 2` and overall at `DIMENSION_OFFSET`. Add a third level for detail dimensions.

Three parallel dimension chains per side:
- **Level 1 (closest, offset = DIMENSION_OFFSET * 0.3)**: Detail dimensions -- individual wall segments between every wall break, door position, and window position. Compute from wall start/end points plus opening positions.
- **Level 2 (middle, offset = DIMENSION_OFFSET * 0.7)**: Room dimensions (current segment dimensions). Already exists.
- **Level 3 (outermost, offset = DIMENSION_OFFSET * 1.2)**: Overall building dimension. Already exists, adjust offset.

Add **interior room dimensions**: For each room, render a width dimension near the top wall and a depth dimension near the left wall, using `LINE_WEIGHTS.THIN` and smaller font. Place them 2 SVG units inset from the room walls.

Also add dimension lines at door and window positions along the wall (distance from nearest corner to each opening center).

---

## Change 3: Bold Door Swing Arcs

**File: `ArchitecturalSymbols.tsx`**

Currently door swing arcs use:
- `stroke={DRAWING_COLORS.MEDIUM_GRAY}` with `strokeWidth={LINE_WEIGHTS.DIMENSION}` (0.6) and `strokeDasharray="2,1"` (dashed)

Change to:
- `stroke={DRAWING_COLORS.BLACK}` with `strokeWidth={LINE_WEIGHTS.MEDIUM}` (1.0) and remove `strokeDasharray` (solid line)
- The door panel line already uses `LINE_WEIGHTS.OUTLINE` which is good
- This applies to both horizontal and vertical wall door symbols

---

## Change 4: Prominent Window Symbols

**File: `ArchitecturalSymbols.tsx`**

Windows already use `LINE_WEIGHTS.CUT_LINE` for outer lines and `LINE_WEIGHTS.OUTLINE` for glass -- these weights are already strong. The main issue is the AI not generating enough windows.

Minor rendering tweak: ensure window frame lines and glass line are all `DRAWING_COLORS.BLACK` (already the case). No code change needed here beyond what's already done.

The real fix is in Change 8 (AI prompt) to generate more and wider windows.

---

## Change 5: Proper Stair Symbol with X Pattern

**File: `ArchitecturalSymbols.tsx`**

Update `StairSymbol` component:
- After drawing the tread lines and before the break line, add an X pattern (two diagonal lines from corner to corner) in the stair well area above the break line
- The X represents the floor opening/void in plan view
- Use `LINE_WEIGHTS.MEDIUM` for the X lines
- Keep existing tread lines, break zigzag, UP/DN label, and arrow

---

## Change 6: Section Cut Indicator Lines

**File: `FloorPlanRenderer.tsx`**

Add a new `<g id="layer-section-cuts">` after the dimension layer:

**Horizontal section cut (A-A)**:
- Dash-dot line (`DASH_PATTERNS.CENTER`) running horizontally through the middle of the building (y = buildingH / 2)
- Extends 15 SVG units beyond the building on each side
- At each end: solid black circle (r=5) with white letter "A" centered inside, plus a small triangle pointing perpendicular (indicating view direction -- downward on left end, upward on right end)

**Vertical section cut (B-B)**:
- Same pattern running vertically through the middle (x = buildingW / 2)
- Circle + "B" label at each end, triangles pointing left/right

Use `LINE_WEIGHTS.MEDIUM` for the cut lines and `LINE_WEIGHTS.OUTLINE` for the circles.

---

## Change 7: Grid Reference Bubbles (Nice-to-have)

**File: `FloorPlanRenderer.tsx`**

Add a new `<g id="layer-grid">` rendered FIRST (behind everything):

- Compute major wall intersection X-positions from room boundaries -> assign letters A, B, C, D...
- Compute major wall intersection Y-positions -> assign numbers 1, 2, 3, 4...
- At each position along the top edge: circle (r=4) with letter inside, positioned above the building
- At each position along the left edge: circle (r=4) with number inside, positioned left of the building
- Very faint dashed grid lines connecting the bubbles through the building (`LINE_WEIGHTS.THIN`, opacity 0.15)

---

## Change 8: AI Prompt Fixes (Open Concept, Front Door, Windows)

**File: `generate-floor-plan-layout/index.ts`**

Strengthen the system prompt rules:

**Rule 12 (Open Concept)** -- make even more explicit:
- Add: "NEVER generate ANY interior wall between the kitchen room and the living/dining room. Not even a partial wall. The island is the ONLY separator. If you generate a wall here, the layout is INVALID."

**Rule 5 (Front Door)** -- add validation language:
- "The front entry door is NON-NEGOTIABLE. If you generate a layout without a front entry door on the bottom exterior wall, the layout is INVALID. Verify this before returning."

**Rule 6 (Windows)** -- add density rules:
- "For rooms with more than 20ft of exterior wall, generate at minimum 1 window per 8ft of wall length."
- "A 3-bedroom house should have 12-16 windows minimum total. Count your windows before returning."

Also add to the **user prompt**: "IMPORTANT: Kitchen and living/dining MUST be open concept with NO wall between them. Include a FRONT ENTRY DOOR on the bottom wall. Every exterior wall of every habitable room must have at least one window."

Also add **client-side wall filtering** in `FloorPlanRenderer.tsx`: In the `processedData` useMemo, after processing walls, filter out any interior wall whose coordinates sit exactly on the shared boundary between a kitchen room and a living/dining room. This guarantees open concept regardless of AI output.

---

## Change 9: Scale Bar Already Exists

The `ScaleBar` component is already implemented and rendering. No changes needed.

---

## Files Modified (5 total)

| File | Changes |
|------|---------|
| `ArchitecturalSymbols.tsx` | Change 3 (bold door arcs), Change 5 (stair X pattern) |
| `FloorPlanRenderer.tsx` | Change 1 (hatch defs + wall fills), Change 2 (3-level dims + interior dims), Change 6 (section cuts), Change 7 (grid bubbles), Change 8 (client-side wall filtering) |
| `drawingConstants.ts` | Change 1 (hatch pattern constants) |
| `generate-floor-plan-layout/index.ts` | Change 8 (AI prompt strengthening) |
| `DrawingSheet.tsx` | No changes needed |

---

## Implementation Order

1. **`drawingConstants.ts`** -- Add hatch pattern ID constants
2. **`ArchitecturalSymbols.tsx`** -- Bold door arcs (Change 3) + stair X pattern (Change 5)
3. **`FloorPlanRenderer.tsx`** -- Wall hatching (Change 1), multi-level dimensions (Change 2), section cuts (Change 6), grid bubbles (Change 7), open concept wall filtering (Change 8)
4. **`generate-floor-plan-layout/index.ts`** -- Prompt updates (Change 8)
5. Redeploy edge function

---

## Technical Notes

### Hatch Pattern SVG Defs
```text
<defs>
  <pattern id="hatch-exterior-cross" patternUnits="userSpaceOnUse" width="4" height="4">
    <line x1="0" y1="0" x2="4" y2="4" stroke="black" stroke-width="0.3"/>
    <line x1="4" y1="0" x2="0" y2="4" stroke="black" stroke-width="0.3"/>
  </pattern>
  <pattern id="hatch-interior" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="5" stroke="black" stroke-width="0.2"/>
  </pattern>
</defs>
```

### Section Cut Endpoint Symbol
Each end of a section cut line gets:
- Solid black circle (r=5)
- White letter inside (A or B)
- Small filled triangle pointing perpendicular to the cut line (view direction)

### Open Concept Client-Side Filter Logic
In `FloorPlanRenderer.tsx` useMemo:
1. Find kitchen rooms and living/dining rooms from `floor.rooms`
2. For each interior wall, check if its centerline coordinate matches a shared boundary between these room types
3. If yes, exclude the wall from `floor.walls` before passing to `processWalls()`

### Interior Dimension Placement
For each room (excluding closets/hallways):
- Width dimension: placed 2 units below the room's top wall, spanning room width
- Depth dimension: placed 2 units right of the room's left wall, spanning room depth
- Uses `FONTS.NOTE.size` for smaller text and `LINE_WEIGHTS.THIN` for lines

