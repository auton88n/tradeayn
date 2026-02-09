

# Embed Full Architectural Knowledge Base into AI System Prompt

## What This Does

Instead of splitting work between AI and client code, we give the AI the complete knowledge base you provided -- all 6 parts -- so it generates perfectly proportioned, code-compliant floor plans with correct walls, doors, windows, and room relationships on the first try.

The current system prompt is ~470 lines and covers basics. The new prompt will be ~900 lines and include everything from your knowledge base:

- Part 1: Design Patterns (privacy gradient, sunlight rules, intimacy zones, entry sequence, adjacency matrix)
- Part 2: Drawing Standards (line types, weights, wall representation, symbols, dimensions, title block)
- Part 3: Room Size Standards (exact min/typical/generous for every room type, kitchen work triangle, bathroom clearances)
- Part 4: Construction Standards (wall thicknesses, all door sizes, all window sizes with sill heights, stair dimensions, ceiling heights)
- Part 5: Building Proportion Rules (envelope ratios, room allocation percentages, SF by bedroom count)
- Part 6: Architectural Style Guidelines (10+ styles with layout characteristics)

## Key Improvements Over Current Prompt

1. **Privacy Gradient** -- currently missing. New prompt teaches the AI that rooms go Public (front) to Private (back), with the exact sequence: Entry, Living/Dining, Kitchen, Hallway, Kids Bedrooms, Master Suite

2. **Sunlight Orientation** -- currently missing. New prompt includes the direction table (East=kitchen morning, South=living midday, West=dining evening, North=bathrooms/garage)

3. **Complete Adjacency Matrix** -- current prompt has basic rules. New prompt has the full 14-row adjacency table with MUST/SHOULD/MUST NOT relationships

4. **Exact Room Sizes with Max Aspect Ratios** -- current prompt has sizes but no max aspect. New prompt adds the 1:1.3, 1:1.5 etc. limits per room type

5. **Full Door Size Table** -- current has basics. New adds bifold closet doors, pocket doors, sliding glass exact sizes, garage overhead doors

6. **Full Window Size Table with Sill Heights** -- current has ranges. New has exact per-room sill heights (kitchen=42", bathroom=48-60", bedroom=24-36") and egress requirements (5.7 SF opening, max 44" sill)

7. **Ceiling Height Variety** -- currently missing. New prompt teaches 9-10' for public, 8' for bedrooms, 7' min for baths

8. **Kitchen Work Triangle** -- more detail: 4-9' legs, 12-26' perimeter, no leg crosses walkway

9. **Back-to-back Plumbing** -- current has basic rule. New adds stacking rule for multi-story and specific plumbing wall requirements

10. **Entry Sequence** -- new: two entries (formal front + daily garage/mudroom), both must work independently

11. **Building Proportion Rules** -- new: room allocation percentages (30-40% public, 30-35% private, 10-15% service, 8-12% circulation), SF by bedroom count

12. **Style-specific Guidelines** -- expanded from 8 styles to 11, with typical SF ranges

## Post-Generation Validation (Client-Side)

Add a `layoutValidator.ts` that runs after the AI returns data, catching any remaining issues before rendering:

- Room overlap detection (no two rooms should intersect)
- All rooms fit within building envelope
- Room aspect ratios within limits
- Total room area approximately matches target SF
- Adjacency violations (garage next to bedroom, etc.)
- Missing doors (every room needs at least one)
- Wall endpoint alignment (snap to 0.5ft grid if AI drifted)

This acts as a safety net -- the AI should produce correct output, but the validator catches edge cases.

## Technical Changes

### 1. Edge Function: Replace System Prompt (`supabase/functions/generate-floor-plan-layout/index.ts`)

Replace the current `SYSTEM_PROMPT` with the complete knowledge base. The prompt structure will be:

```text
SECTION 1: DESIGN PATTERNS
  1.1 Privacy Gradient
  1.2 Indoor Sunlight (direction table)
  1.3 Common Areas at Heart
  1.4 Couple's Realm
  1.5 Room of One's Own
  1.6 Sequence of Sitting Spaces
  1.7 Entrance Transition (street > porch > foyer > living)
  1.8 Three-Zone Design (public/private/service)
  1.9 Short Passages (hallway < 10% of SF)
  1.10 Ceiling Height Variety
  1.11 Kitchen Work Triangle (4-9' legs, 12-26' total)
  1.12 Back-to-back Plumbing
  1.13 Entry Sequence (front formal + daily garage)
  1.14 Full Adjacency Matrix (14 pairs)

SECTION 2: ROOM SIZE STANDARDS
  Complete table with Min/Typical/Generous/Max Aspect for all room types
  Kitchen work triangle details
  Bathroom clearance rules

SECTION 3: CONSTRUCTION STANDARDS
  3.1 Wall thicknesses (exterior 6.5", interior 4.5", plumbing 6.5")
  3.2 Full door size table (front 36", interior 32", bath 30", closet 24-30", sliding 72-96", garage overhead 96/192")
  3.3 Full window size table with sill heights per room type
  3.4 Stair dimensions (IRC + NBC)
  3.5 Ceiling heights per room type

SECTION 4: BUILDING PROPORTION RULES
  4.1 Envelope aspect ratios
  4.2 Room allocation percentages
  4.3 SF by bedroom count table

SECTION 5: ARCHITECTURAL STYLE GUIDELINES
  11 styles with typical SF, layout, and character rules

SECTION 6: GENERATION ALGORITHM (7 steps + 14-point validation)

SECTION 7: COORDINATE + WALL RULES
  0.5ft grid, wall dedup, door clearance, open concept
```

### 2. New File: Layout Validator (`src/components/engineering/drawings/engine/layoutValidator.ts`)

Post-generation validation that runs before rendering:

- `validateRoomOverlaps(rooms)` -- check no two rooms share interior area
- `validateBuildingEnvelope(rooms, building)` -- all rooms within total_width x total_depth
- `validateAspectRatios(rooms)` -- per room type limits
- `validateAdjacency(rooms)` -- MUST NOT pairs aren't adjacent
- `snapCoordinates(layout)` -- round all coordinates to nearest 0.5ft
- `validateDoors(doors, walls, rooms)` -- every room accessible
- Returns warnings array (non-blocking) and errors array (blocking)

### 3. Updated Hook: Run Validator (`src/components/engineering/drawings/hooks/useDrawingGeneration.ts`)

After receiving AI response, run validator. If errors found, auto-retry with refinement instruction describing the specific violations. If only warnings, render with console warnings.

## Files Modified

| File | Action |
|------|--------|
| `supabase/functions/generate-floor-plan-layout/index.ts` | Replace system prompt with full knowledge base |
| `src/components/engineering/drawings/engine/layoutValidator.ts` | Create -- post-generation validation |
| `src/components/engineering/drawings/hooks/useDrawingGeneration.ts` | Update -- run validator, auto-retry on errors |

