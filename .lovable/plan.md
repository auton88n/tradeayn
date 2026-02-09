

# Integrate Architectural Knowledge Base into AYN

## Overview

4 major changes across 4 files: (1) Replace the AI system prompt with the full knowledge base, (2) Convert all fixture sizing from percentage-based to real-dimension-based, (3) Verify/fix door arc radius and dimension chain offsets, (4) Redeploy edge function.

---

## Change 1: Full Knowledge Base System Prompt

**File: `supabase/functions/generate-floor-plan-layout/index.ts`**

Replace the current `SYSTEM_PROMPT` (lines 177-225) with a comprehensive prompt that includes:

**Section 1 -- Design Principles (injected verbatim):**
- Three-zone concept (public/private/service) with descriptions
- Adjacency rules table (MUST, SHOULD, MUST NOT)
- Circulation rules (3-step test, hallway 3.5'-4', no dead ends)
- Building aspect ratio limits (1:1 to 1:1.8)

**Section 2 -- Room Size Standards (injected as table):**
- Complete room size table with minimum/typical/generous for all 18 room types
- Room aspect ratio limits (no room wider than 1:2 except hallways)
- Kitchen work triangle rules (4'-9' legs, 12'-26' perimeter)
- Bathroom layout rules (21" toilet clearance, 15" from side wall)

**Section 3 -- Construction Standards:**
- Wall thicknesses: exterior 2x6=5.5", interior 2x4=3.5", plumbing=2x6, garage fire sep
- All standard door sizes by type (front 36", interior 32", bath 30", closet 24", garage overhead 8'/16')
- All standard window sizes by room (living 48-72", kitchen 36-48", bedroom 36-48", bath 24-36")
- Stair dimensions (IRC: 7.75" max riser, 10" min tread; NBC: 200mm, 235mm)

**Section 5 -- Style Rules (conditional):**
- Include ALL 8 style descriptions in the prompt so the AI picks the relevant one based on user's `style_preset`
- Modern, Farmhouse, Craftsman, Ranch, Colonial, Cape Cod, Mediterranean, Coastal

**Section 6 -- Generation Algorithm:**
- 7-step process: envelope, zones, rooms (largest first), doors, windows, code check, validate
- Full validation checklist (12 items) that the AI must pass before returning

**Also update the user prompt** (lines 297-313) to include:
- "Follow the generation algorithm steps in order"
- "Verify all 12 validation checklist items before returning"
- "Use the room size table for correct dimensions"

The prompt will be long but well-structured with clear section headers. Token cost is acceptable since this runs once per generation.

---

## Change 2: Real-Dimension Fixture Sizing

**File: `src/components/engineering/drawings/engine/RoomFixtures.tsx`**

Add scale-aware conversion helpers at the top of the file:

```text
import { ftToSvg, inToSvg, DEFAULT_SCALE } from './drawingConstants';

// Real dimension helpers (convert real-world inches/feet to SVG units)
const realFt = (feet: number) => ftToSvg(feet, DEFAULT_SCALE);
const realIn = (inches: number) => inToSvg(inches, DEFAULT_SCALE);
```

Then replace ALL percentage-based fixture sizing with real dimensions from the knowledge base:

**KitchenFixtures:**
- Counter depth: `realIn(24)` (was `width * 0.18`)
- Sink (double bowl): each bowl `realIn(14)` wide x `realIn(16)` deep
- Stove: `realIn(30)` wide x `realIn(24)` deep
- Refrigerator: `realIn(36)` wide x `realIn(30)` deep
- Island: `realIn(36)` deep x `realIn(72)` long (was `width * 0.4 x depth * 0.16`)
- Burner radius: `realIn(4)` (was percentage)

**BathroomFixtures:**
- Toilet: `realIn(18)` wide x `realIn(28)` deep (was `width * 0.25 x depth * 0.25`)
- Tank: `realIn(18)` wide x `realIn(8)` deep
- Bowl: `realIn(14)` wide x `realIn(18)` deep (ellipse)
- Vanity single: `realIn(24)` wide x `realIn(20)` deep (was `width * 0.4`)
- Vanity double (ensuite): `realIn(60)` wide x `realIn(22)` deep (was `width * 0.55`)
- Tub: `realIn(30)` wide x `realIn(60)` long (was `width * 0.35 x depth`)

**BedroomFixtures:**
- King bed (master): `realIn(76)` wide x `realIn(80)` long (was `width * 0.45`)
- Queen bed (secondary): `realIn(60)` wide x `realIn(80)` long (was `width * 0.4`)
- Pillow: `realIn(20)` wide x `realIn(6)` deep
- Nightstand: `realIn(18)` x `realIn(18)` (was 2x2 fixed SVG)

**GarageFixtures:**
- Car outline: `realFt(6)` wide x `realFt(16)` long (was `width * 0.4 x depth * 0.7`)
- Garage door label: dynamically show actual width

**LivingFixtures:**
- Sofa main: `realFt(7)` wide x `realFt(3)` deep (was `width * 0.4`)
- Sofa return: `realFt(3)` wide x `realFt(5)` deep
- Coffee table: `realIn(48)` wide x `realIn(24)` deep (was percentage)
- Dining table (6-person): `realIn(42)` wide x `realIn(72)` long (was `width * 0.2`)
- Chair: `realIn(18)` diameter (was `tableW * 0.1`)

**DiningFixtures:**
- Same real dimensions as LivingFixtures dining table

**LaundryFixtures:**
- Washer: `realIn(27)` x `realIn(27)` (was `width * 0.25`)
- Dryer: `realIn(27)` x `realIn(27)`

All fixtures will use `Math.min(realDimension, availableSpace)` to ensure they fit within the room, but they will NEVER exceed the real dimension. This means if a room is too small for a fixture, the fixture is either clipped to room size or omitted -- it never gets artificially enlarged.

---

## Change 3: Door Arc Radius Verification

**File: `src/components/engineering/drawings/engine/ArchitecturalSymbols.tsx`**

The door arc radius is already correct: `const radius = width` at line 29, where `width` is the door opening width in SVG units (passed from `pos.width` which is computed from the door's inch-width converted at scale). No change needed.

---

## Change 4: Dimension Chain Offset Verification

**File: `src/components/engineering/drawings/engine/drawingConstants.ts`**

The current `DIMENSION_OFFSET` is 15 SVG units. The plan specified 4/8/12 unit offsets.

Current multipliers: Level 1 at `0.35` (5.25), Level 2 at `0.75` (11.25), Level 3 at `1.2` (18).

These are slightly wider than the 4/8/12 target. Update to use cleaner offsets:
- Level 1: `offset={4}` (closest to building)
- Level 2: `offset={8}` (middle)
- Level 3: `offset={12}` (outermost)

**File: `FloorPlanRenderer.tsx`** -- Replace all `dimOffset * 0.35` with `4`, `dimOffset * 0.75` with `8`, and `dimOffset * 1.2` with `12` throughout all four sides. This tightens the dimension chains closer to the building, matching professional standards.

Also adjust the `margin` calculation (line 195) to account for the tighter offsets: `const margin = 12 + SHEET.MARGIN + 8` (outer dimension chain at 12 + text clearance).

---

## Files Modified (4 total)

| File | Changes |
|------|---------|
| `generate-floor-plan-layout/index.ts` | Full knowledge base system prompt (Sections 1-3, 5-6), updated user prompt, redeploy |
| `RoomFixtures.tsx` | All fixtures converted to real dimensions using `realFt`/`realIn` helpers |
| `FloorPlanRenderer.tsx` | Dimension chain offsets changed to 4/8/12, margin adjusted |
| `drawingConstants.ts` | No changes needed (line weights already match Section 4.1) |

---

## Implementation Order

1. **`RoomFixtures.tsx`** -- Real dimension conversion (biggest visual change for fixtures)
2. **`FloorPlanRenderer.tsx`** -- Dimension chain offsets to 4/8/12
3. **`generate-floor-plan-layout/index.ts`** -- Full knowledge base prompt injection
4. Redeploy edge function

---

## Technical Notes

### System Prompt Size
The full knowledge base is approximately 4,000-5,000 tokens. Combined with the tool schema, the total input to the AI will be ~6,000-7,000 tokens. This is well within Gemini Flash's context window and will not cause issues. The improved output quality justifies the token cost.

### Fixture Sizing Safety
Every fixture uses `Math.min(realDimension, roomDimension - padding)` to prevent overflow. If a room is smaller than the fixture (e.g., a tiny closet), the fixture is either scaled down to fit or not rendered (existing `width < 5 || depth < 5` guard at line 373).

### Scale Factor
At 1:48 scale, `ftToSvg(1)` = 6.35 SVG units per foot. So:
- `realIn(18)` = 1.5ft x 6.35 = 9.525 SVG units (toilet width)
- `realIn(76)` = 6.33ft x 6.35 = 40.2 SVG units (king bed width)
- `realFt(7)` = 44.45 SVG units (sofa width)

These are realistic proportions that will look correct relative to the room dimensions which use the same scale factor.

### Validation Checklist
The 12-item checklist added to the system prompt ensures the AI self-validates before returning:
1. Building aspect ratio 1:1 to 1:1.8
2. Entry foyer <=80 SF
3. Hallway total <=10% of house SF
4. Every room accessible via doors
5. Kitchen work triangle exists
6. Plumbing walls identified (back-to-back)
7. Window count >=12
8. Front entry door on street-facing wall
9. Open concept no wall between kitchen/living
10. All room dimensions within standard ranges
11. No room aspect ratio >1:2 (except hallways/closets)
12. Circulation: any room reachable in <=3 steps
