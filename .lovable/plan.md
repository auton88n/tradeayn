

# Fix Floor Plan Drawing Quality -- Overlaps, Details, and Layout

## Problems Identified from Screenshot

Looking at the generated floor plan, there are several visible issues:

1. **Wall overlaps at corners and T-junctions** -- walls overlap each other creating dark blobs at intersections instead of clean joins
2. **Door swings overlapping walls and room content** -- door arcs extend into adjacent rooms and clip through walls
3. **Fixture placement conflicts** -- furniture/fixtures overlap with doors, walls, or each other
4. **Stair symbol rendering issues** -- the X-pattern and tread lines are dense and visually cluttered
5. **Labels overlapping elements** -- room labels collide with fixtures and dimension lines
6. **Dimension chain clutter** -- too many redundant dimension lines at small intervals creating visual noise
7. **Missing common-sense layout** -- rooms appear placed without logical flow (e.g., garage should connect through mudroom, not directly to living)

## Root Causes

### 1. Wall Intersection Engine (`wallGeometry.ts`)
The `resolveIntersections` function uses a simple endpoint-matching approach that doesn't handle cases where:
- The AI generates walls with slightly misaligned endpoints (off by fractions of a foot)
- Through-walls at T-junctions don't get properly trimmed -- the butting wall extends into the through-wall creating overlap
- The tolerance (0.5 SVG units) is too tight for the coordinate rounding the AI produces

### 2. Door Swing Rendering (`ArchitecturalSymbols.tsx`)
- Door swings always extend downward (for horizontal walls) or rightward (for vertical walls) regardless of which room the door should swing INTO
- No collision detection -- arcs can swing through adjacent walls
- The `DoorSymbol` doesn't account for the side of the wall the swing should go to

### 3. AI-Generated Layout Quality
- The system prompt has rules but the AI still generates suboptimal layouts
- No post-processing validation on the client side to catch and fix common issues

## Fix Plan

### Fix 1: Improve Wall Intersection Resolution (`wallGeometry.ts`)

**Changes:**
- Increase endpoint matching tolerance from 0.5 to 1.0 SVG units
- Round endpoint keys more coarsely to catch near-misses from AI coordinates
- Fix `miterLCorner` to check wall direction before extending (currently assumes extension direction incorrectly for some orientations)
- Fix `handleTJunction` to correctly identify which face of the through-wall the butting wall meets, based on the butting wall's approach direction
- Add a deduplication pass to remove walls that are nearly identical (same start/end within tolerance)

### Fix 2: Improve Door Swing Direction (`ArchitecturalSymbols.tsx`)

**Changes:**
- Add a `swingDirection` prop ("inward" | "outward") to `DoorSymbol` to control which side of the wall the arc swings to
- Default swing direction: INTO the room (away from hallways/public areas)
- For horizontal walls: swing can go up or down (currently always down)
- For vertical walls: swing can go left or right (currently always right)
- Update `FloorPlanRenderer` to pass swing direction based on room adjacency

### Fix 3: Filter Redundant Dimension Lines (`FloorPlanRenderer.tsx`)

**Changes:**
- Skip Level 1 (detail) dimension segments shorter than 2 feet
- Skip Level 2 (room) segments that duplicate Level 1 segments
- Merge Level 1 segments that are within 1 foot of each other
- Only show interior room dimensions for rooms larger than 60 SF (skip closets, tiny utility rooms)

### Fix 4: Prevent Fixture-Door Overlap (`RoomFixtures.tsx`)

**Changes:**
- Add padding awareness: fixtures should respect a clearance zone around the room edges where doors typically sit
- For bedrooms: position bed centered but offset from the door wall
- For bathrooms: position toilet away from the door swing zone
- Add a minimum room size check per fixture (already exists but thresholds need tuning)

### Fix 5: Improve Stair Symbol (`ArchitecturalSymbols.tsx`)

**Changes:**
- Reduce tread line count -- show every other tread line instead of every one
- Make the X-pattern (floor void indicator) lighter weight and only show it in the upper portion
- Add outline rectangle for the stair footprint for clarity

### Fix 6: Strengthen AI System Prompt (`generate-floor-plan-layout/index.ts`)

**Changes to system prompt:**
- Add explicit wall coordinate rules: "All wall endpoints must land on exact foot or half-foot values. Round all coordinates to the nearest 0.5 feet."
- Add door position validation: "Door position_along_wall must be at least 2 feet from the wall start and 2 feet from the wall end."
- Add explicit instruction: "Do NOT place overlapping walls. Each interior wall boundary should appear exactly once."
- Strengthen the room adjacency enforcement with specific coordinate examples

## Files Modified

| File | Changes |
|------|---------|
| `src/components/engineering/drawings/engine/wallGeometry.ts` | Increase tolerance, fix miter/T-junction logic, add wall dedup |
| `src/components/engineering/drawings/engine/ArchitecturalSymbols.tsx` | Add swing direction support to DoorSymbol, reduce stair line density |
| `src/components/engineering/drawings/engine/FloorPlanRenderer.tsx` | Filter small dimensions, improve fixture clearance, pass door swing direction |
| `src/components/engineering/drawings/engine/RoomFixtures.tsx` | Add door-clearance padding to fixture placement |
| `supabase/functions/generate-floor-plan-layout/index.ts` | Strengthen coordinate rounding and wall dedup rules in system prompt |

## Build Order

1. Wall geometry fixes (wallGeometry.ts) -- fixes the most visible overlapping issue
2. Door swing direction (ArchitecturalSymbols.tsx + FloorPlanRenderer.tsx) -- fixes door arcs going wrong way
3. Dimension line cleanup (FloorPlanRenderer.tsx) -- reduces visual clutter
4. Stair symbol improvement (ArchitecturalSymbols.tsx) -- cleaner stair rendering
5. Fixture clearance (RoomFixtures.tsx) -- prevents furniture-door overlap
6. AI prompt improvements (edge function) -- better layouts from the source

