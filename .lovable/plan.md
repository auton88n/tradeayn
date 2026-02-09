

# AYN Architectural Drawing Engine — Revised Plan (Phase 1: Floor Plans)

## Addressing Your Concerns

### 1. Wall Intersection Cleanup

This is the single hardest rendering problem and the plan dedicates a dedicated utility to solve it. Instead of drawing each wall as an independent rectangle (which creates visible overlaps at every corner and T-junction), the engine will:

- **Model walls as a connected graph** -- each wall stores references to connected walls at its endpoints
- **Use a polygon-merge approach** for intersections: at every junction, compute the outer boundary polygon of the combined wall mass using the wall centerlines and thicknesses, then render that single merged polygon
- **Three junction types handled explicitly:**
  - **L-corner** (2 walls): Extend both wall rectangles to meet at the outer corner point, miter the intersection
  - **T-junction** (3 walls): The through-wall continues unbroken; the butting wall stops at the through-wall's inner face
  - **Cross/4-way** (4 walls): Rendered as a solid filled square at the intersection, with all four walls terminating cleanly at its edges

- **Implementation**: A dedicated `wallGeometry.ts` utility file handles all intersection math. The `FloorPlanRenderer` never draws raw rectangles -- it calls `computeWallPolygons(walls)` which returns pre-merged SVG path data with clean joins. This is ~200 lines of geometry code but it's the difference between "looks like a web app" and "looks like a drawing."

### 2. AI Layout Quality

The prompt engineering needs to enforce architectural conventions, not just room fitting. The approach:

- **Adjacency rules baked into the system prompt**: Kitchen adjacent to dining, master bedroom away from living areas, bathrooms back-to-back or stacked for plumbing, utility/laundry near exterior wall, garage entry through mudroom/utility, hallway circulation connecting all rooms without dead ends
- **Standard room size templates** embedded in the prompt as reference (e.g., "a 3-bedroom 1800sqft ranch typically has master 14x16, secondary bedrooms 11x12, kitchen 12x14")
- **Structural grid alignment**: Prompt instructs AI to align walls to a rough grid to make the layout structurally rational, not just spatially valid
- **Iterative refinement**: The refinement chat lets users fix layout issues ("move the kitchen to the back of the house", "make the hallway wider") -- the AI receives the current JSON layout and modifies it
- **Expect iteration**: The initial AI output will not be perfect. The review/edit step in the UI lets users manually adjust room positions and dimensions before rendering. This is a safety net for when the AI gets adjacencies wrong.

### 3. File Count and Build Phasing

Reduced from 25 to 16 files by consolidating:
- All SVG symbols into a single `ArchitecturalSymbols.tsx` (door, window, stair, dimension line -- they're small components, 20-40 lines each)
- Drawing styles and utils into a single `drawingConstants.ts`
- Merge export logic into the main hook instead of a separate component

**Realistic build phasing:**
- **Session 1** (prompts 1-4): Database + edge function + sidebar integration
- **Session 2** (prompts 5-8): Wall geometry engine + SVG symbols + FloorPlanRenderer
- **Session 3** (prompts 9-12): UI container + request form + generation hook + viewer
- **Session 4** (prompts 13-16): Export (PDF/DXF/SVG) + refinement chat + polish/debugging

Budget 4-6 additional prompts for debugging wall intersections and AI prompt tuning.

---

## Build Order (Phase 1: Floor Plans Only)

### Step 1: Database + Config

**New migration:** `drawing_projects` table

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | gen_random_uuid() |
| user_id | UUID NOT NULL | |
| project_name | TEXT | |
| layout_json | JSONB | Full structured layout |
| style_preset | TEXT | |
| num_bedrooms | INTEGER | |
| num_bathrooms | INTEGER | |
| target_sqft | INTEGER | |
| num_storeys | INTEGER | DEFAULT 1 |
| has_garage | BOOLEAN | DEFAULT FALSE |
| conversation_history | JSONB | Refinement messages |
| compliance_project_id | UUID | FK nullable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

RLS: CRUD where `user_id = auth.uid()`.

### Step 2: Edge Function `generate-floor-plan-layout`

**File:** `supabase/functions/generate-floor-plan-layout/index.ts`

Uses Gemini via Lovable AI Gateway with tool calling. The tool schema defines the JSON structure for rooms, walls, doors, windows, stairs with coordinates.

**Key prompt sections:**
- Act as an architectural space planner
- Adjacency rules (kitchen/dining, bathrooms clustered, bedrooms grouped, garage via mudroom)
- Wall thickness conventions (exterior 2x6 = 5.5", interior 2x4 = 3.5")
- Standard door sizes (36" exterior, 32" interior, 30" bathroom, 24" closet)
- Standard window sizes by room type
- Each wall must reference its connected walls at endpoints (for intersection cleanup)
- Circulation: every room must be reachable via hallway or open-plan connection
- Output via tool calling to enforce schema

**Supports refinement:** Accepts optional `previous_layout` JSON + `refinement_instruction` text. Returns modified layout.

Add `[functions.generate-floor-plan-layout]` with `verify_jwt = true` to `supabase/config.toml`.

### Step 3: Sidebar + Workspace Integration

**Modified files:**
- `src/types/engineering.types.ts` -- add `'drawings'` to CalculatorType union
- `src/components/engineering/workspace/CalculatorSidebar.tsx` -- add entry: id `'drawings'`, title "Architectural Drawings", shortTitle "Drawings", icon `Ruler`, gradient `from-slate-600 to-gray-800`
- `src/components/engineering/workspace/EngineeringWorkspace.tsx` -- lazy load `DrawingGenerator`, render when `selectedCalculator === 'drawings'`

### Step 4: Wall Geometry Engine

**File:** `src/components/engineering/drawings/engine/wallGeometry.ts`

Core functions:
- `computeWallPolygons(walls[])` -- takes wall centerlines + thicknesses, returns merged SVG path strings with clean intersections
- `findWallJunctions(walls[])` -- identifies L-corners, T-junctions, crosses
- `miterCorner(wall1, wall2)` -- computes the miter point for L-corners
- `tJunction(throughWall, buttWall)` -- trims the butting wall to stop at the through-wall face
- `cutOpenings(wallPath, doors[], windows[])` -- removes door/window gaps from wall paths

Uses vector math (dot product, line intersection) -- no external geometry library needed.

### Step 5: SVG Symbols + Constants

**File:** `src/components/engineering/drawings/engine/ArchitecturalSymbols.tsx`

React SVG components (all in one file):
- `DoorSymbol` -- wall gap + 90-degree arc for swing, configurable direction (left/right/double). Sliding doors use parallel lines instead of arc.
- `WindowSymbol` -- double parallel lines inside wall thickness (standard plan convention)
- `StairSymbol` -- parallel tread lines + directional arrow + "UP" label + zigzag break line
- `DimensionLine` -- line with tick marks at ends, extension lines perpendicular to measured element, centered text label with architectural format (e.g., 12'-6")
- `RoomLabel` -- centered room name (caps) + dimensions + area in SF/m2

**File:** `src/components/engineering/drawings/engine/drawingConstants.ts`

Line weights, colors, fonts, scale helpers:
- CUT_LINE: 0.50mm (walls cut by plan)
- OUTLINE: 0.35mm (furniture, fixtures)
- DIMENSION: 0.18mm (dimension lines)
- HATCH: 0.13mm (hatching patterns)
- Scale conversion functions (feet to SVG units at 1:50 / 1:100)
- SVG pattern definitions for hatching (concrete dots, insulation wavy lines, earth diagonal)

### Step 6: Floor Plan Renderer

**File:** `src/components/engineering/drawings/engine/FloorPlanRenderer.tsx`

The core rendering component. Accepts the JSON layout and renders a complete floor plan SVG:

1. Calls `computeWallPolygons()` to get merged wall paths -- renders as filled polygons with proper line weights (exterior heavier than interior)
2. Places `DoorSymbol` at each door location (gap cut from wall + swing arc)
3. Places `WindowSymbol` at each window location (double lines in wall)
4. Places `StairSymbol` if stairs exist
5. Renders `RoomLabel` centered in each room
6. Renders exterior `DimensionLine` chains on all four sides
7. Renders interior dimensions for room widths/depths
8. Title block border with project name, scale, date, "PRELIMINARY" watermark

**File:** `src/components/engineering/drawings/engine/DrawingSheet.tsx`

Wraps the floor plan in a standard drawing sheet with border, title block (project info, scale, date, drawing number), and north arrow.

### Step 7: UI Components

**File:** `src/components/engineering/drawings/DrawingGenerator.tsx`

Main container managing states: `'input' | 'generating' | 'viewing'`
- Input state: renders DrawingRequestForm
- Generating state: animated loading with "AYN is designing your layout..."
- Viewing state: renders DrawingViewer + refinement panel

**File:** `src/components/engineering/drawings/DrawingRequestForm.tsx`

Input form:
- Bedrooms (1-6 selector), Bathrooms (1-5), Target sqft (slider 800-5000), Storeys (1-3)
- Style preset dropdown (Modern, Farmhouse, Craftsman, Colonial, Ranch, etc.)
- Garage toggle (attached/detached/none)
- Optional text description field
- "Generate Floor Plan" button

**File:** `src/components/engineering/drawings/DrawingViewer.tsx`

SVG viewer with:
- Pan (mouse drag) and zoom (scroll wheel) via transform matrix
- Layer toggle buttons (walls, dimensions, labels, hatching)
- Zoom-to-fit button
- Export buttons (PDF, DXF, SVG)

**File:** `src/components/engineering/drawings/DrawingRefinement.tsx`

Chat-like panel beside the viewer:
- Text input for refinement instructions
- Message history showing user requests and AI confirmations
- Each refinement calls the edge function with previous layout + instruction
- Updated layout re-renders automatically

### Step 8: Hooks

**File:** `src/components/engineering/drawings/hooks/useDrawingGeneration.ts`

- Calls `generate-floor-plan-layout` edge function
- Manages layout JSON state
- Handles refinement (sends previous layout + instruction)
- Loading/error states

**File:** `src/components/engineering/drawings/hooks/useDrawingExport.ts`

- PDF: renders SVG into a scaled container, uses `react-to-pdf` for download
- DXF: calls the existing `generate-dxf` edge function (extended with a new `'floor_plan'` type that converts the JSON layout to DXF entities with AIA layers: A-WALL, A-DOOR, A-GLAZ, A-DIMS)
- SVG: extracts rendered SVG element's outerHTML as downloadable file

### Step 9: Integration Buttons

In `DrawingViewer`, action buttons:
- "Run Code Check" -- creates a `compliance_project` with room dimensions, window sizes, door widths extracted from the layout JSON, then navigates to compliance wizard
- "Calculate Structure" -- pre-fills beam/foundation calculators with spans and loads derived from the layout

---

## Files Summary (16 files)

| File | Type | Purpose |
|------|------|---------|
| `supabase/migrations/...` | NEW | drawing_projects table + RLS |
| `supabase/functions/generate-floor-plan-layout/index.ts` | NEW | AI layout generation |
| `supabase/config.toml` | MODIFIED | Add function entry |
| `src/types/engineering.types.ts` | MODIFIED | Add 'drawings' to CalculatorType |
| `src/components/engineering/workspace/CalculatorSidebar.tsx` | MODIFIED | Add Drawings sidebar entry |
| `src/components/engineering/workspace/EngineeringWorkspace.tsx` | MODIFIED | Render DrawingGenerator |
| `src/components/engineering/drawings/engine/wallGeometry.ts` | NEW | Wall intersection math |
| `src/components/engineering/drawings/engine/ArchitecturalSymbols.tsx` | NEW | Door, window, stair, dimension SVG symbols |
| `src/components/engineering/drawings/engine/drawingConstants.ts` | NEW | Line weights, scales, hatch patterns |
| `src/components/engineering/drawings/engine/FloorPlanRenderer.tsx` | NEW | Core SVG floor plan rendering |
| `src/components/engineering/drawings/engine/DrawingSheet.tsx` | NEW | Print-ready sheet wrapper with title block |
| `src/components/engineering/drawings/DrawingGenerator.tsx` | NEW | Main container |
| `src/components/engineering/drawings/DrawingRequestForm.tsx` | NEW | Input form |
| `src/components/engineering/drawings/DrawingViewer.tsx` | NEW | Pan/zoom SVG viewer + export |
| `src/components/engineering/drawings/DrawingRefinement.tsx` | NEW | Chat refinement interface |
| `src/components/engineering/drawings/hooks/useDrawingGeneration.ts` | NEW | Edge function calls + state |
| `src/components/engineering/drawings/hooks/useDrawingExport.ts` | NEW | PDF/DXF/SVG export logic |

---

## What Phase 1 Does NOT Include

- Elevations (Phase 2)
- Building sections (Phase 3)
- Site plans (Phase 4)
- Furniture/fixture symbols
- Electrical/plumbing layouts
- Multi-storey stacking alignment

These are all additive -- Phase 1 floor plans work independently and each subsequent phase builds on the same JSON schema and rendering engine.

