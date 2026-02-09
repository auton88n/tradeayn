import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Tool schema for structured JSON output ──────────────────────────────────

const floorPlanToolSchema = {
  type: "function" as const,
  function: {
    name: "generate_floor_plan",
    description:
      "Generate a structured floor plan layout with rooms, walls, doors, windows, and stairs.",
    parameters: {
      type: "object",
      properties: {
        building: {
          type: "object",
          properties: {
            total_width_ft: { type: "number", description: "Total building width in feet" },
            total_depth_ft: { type: "number", description: "Total building depth in feet" },
            num_storeys: { type: "integer" },
            style: { type: "string" },
          },
          required: ["total_width_ft", "total_depth_ft", "num_storeys", "style"],
        },
        floors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              level: { type: "integer", description: "0 = ground floor" },
              rooms: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    type: {
                      type: "string",
                      enum: [
                        "living", "dining", "kitchen", "bedroom", "bathroom",
                        "ensuite", "laundry", "garage", "hallway", "entry",
                        "closet", "pantry", "mudroom", "office", "family",
                        "utility", "stairwell",
                      ],
                    },
                    x: { type: "number", description: "Room origin X in feet from building origin" },
                    y: { type: "number", description: "Room origin Y in feet from building origin" },
                    width: { type: "number", description: "Room width in feet (X-axis)" },
                    depth: { type: "number", description: "Room depth in feet (Y-axis)" },
                    ceiling_height: { type: "number", description: "Ceiling height in feet, default 9" },
                  },
                  required: ["id", "name", "type", "x", "y", "width", "depth"],
                },
              },
              walls: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    start_x: { type: "number" },
                    start_y: { type: "number" },
                    end_x: { type: "number" },
                    end_y: { type: "number" },
                    thickness: {
                      type: "number",
                      description: "Wall thickness in inches. Exterior=5.5 (2x6), Interior=3.5 (2x4), Plumbing=5.5",
                    },
                    type: { type: "string", enum: ["exterior", "interior", "partition"] },
                    insulated: { type: "boolean" },
                  },
                  required: ["id", "start_x", "start_y", "end_x", "end_y", "thickness", "type"],
                },
              },
              doors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    wall_id: { type: "string" },
                    position_along_wall: {
                      type: "number",
                      description: "Distance in feet from wall start point to door center",
                    },
                    width: {
                      type: "number",
                      description: "Door width in inches. Front entry=36, Interior=32, Bathroom=30, Closet=24-30, Sliding=72-96, Garage overhead=96/192",
                    },
                    swing: { type: "string", enum: ["left", "right", "double", "sliding", "bifold", "pocket", "overhead"] },
                    type: { type: "string", enum: ["interior", "exterior", "garage", "sliding_glass"] },
                  },
                  required: ["id", "wall_id", "position_along_wall", "width", "swing", "type"],
                },
              },
              windows: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    wall_id: { type: "string" },
                    position_along_wall: {
                      type: "number",
                      description: "Distance in feet from wall start to window center",
                    },
                    width: { type: "number", description: "Window width in inches" },
                    height: { type: "number", description: "Window height in inches" },
                    sill_height: { type: "number", description: "Sill height from floor in inches" },
                    type: {
                      type: "string",
                      enum: ["single_hung", "double_hung", "casement", "fixed", "sliding", "picture"],
                    },
                  },
                  required: ["id", "wall_id", "position_along_wall", "width", "height", "type"],
                },
              },
              stairs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    x: { type: "number" },
                    y: { type: "number" },
                    width: { type: "number", description: "Stair width in feet (typically 3)" },
                    run: { type: "number", description: "Total stair run in feet" },
                    direction: { type: "string", enum: ["up", "down"] },
                    num_risers: { type: "integer" },
                    riser_height: { type: "number", description: "In inches" },
                    tread_depth: { type: "number", description: "In inches" },
                  },
                  required: ["id", "x", "y", "width", "run", "direction", "num_risers"],
                },
              },
            },
            required: ["level", "rooms", "walls", "doors", "windows"],
          },
        },
        roof: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["gable", "hip", "flat", "shed", "gambrel"] },
            pitch: { type: "number", description: "Rise per 12 run" },
            overhang_ft: { type: "number" },
          },
          required: ["type", "pitch", "overhang_ft"],
        },
      },
      required: ["building", "floors", "roof"],
    },
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// AYN ARCHITECTURAL KNOWLEDGE BASE v2 — COMPLETE SYSTEM PROMPT
// ══════════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are AYN, a professional residential architect and space planner. Generate realistic, buildable floor plan layouts as structured JSON data.

You have been trained on the complete AYN Architectural Knowledge Base covering design patterns, drawing standards, room standards, and construction standards. Apply ALL of these rules when generating floor plans.

═══════════════════════════════════════════════════════════════════════
SECTION 1: DESIGN PATTERNS FOR RESIDENTIAL ARCHITECTURE
═══════════════════════════════════════════════════════════════════════

1.1 THE PRIVACY GRADIENT

Rooms must be arranged in a sequence from public to private. The most public spaces (entry, living room) are nearest the front door. The most private (master bedroom, ensuite) are furthest from entry.

Pattern: Entry → Living/Dining → Kitchen → Hallway → Kids' Bedrooms → Master Suite

Rule: A stranger should NEVER need to pass through a private space to reach a public one.

1.2 INDOOR SUNLIGHT ORIENTATION

Time of Day | Sun Direction | Best Rooms
Morning (6-10am) | East | Kitchen, breakfast nook, home office
Midday (10am-2pm) | South | Living room, main gathering spaces
Afternoon (2-6pm) | West | Family room, playroom, covered patio
Evening | West/Northwest | Dining room, master bedroom
N/A | North | Bathrooms, closets, garage, laundry, utility

Rule: Every major room should have windows on at least two walls. Rooms with light from two sides are always preferred.

1.3 COMMON AREAS AT THE HEART

The kitchen and living areas should be at the center of daily life. The kitchen is not just for cooking — it's where the family naturally gathers.

Pattern: Kitchen open to (or directly adjacent to) living and dining. A kitchen island facing the living room creates the connection point.

1.4 THE COUPLE'S REALM

Master bedroom suite must be a distinct zone, separate from children's rooms, with its own bathroom and closet.

Pattern: Master suite at the END of the bedroom wing, or on the opposite side of the house from kids' rooms. NEVER adjacent to kitchen, garage, or laundry.

1.5 A ROOM OF ONE'S OWN

Each bedroom should be sized for more than just sleeping — include space for a desk or reading chair. A home office or study, even 8'×8', adds enormous value.

1.6 SEQUENCE OF SITTING SPACES

A home should have multiple places to sit at different scales — large (living room), medium (breakfast nook, reading corner), small (window seat, porch chair).

1.7 ENTRANCE TRANSITION

The transition from outside to inside should be gradual. NEVER open the front door directly into the living room.

Pattern: Street → Porch/Covered Entry → Front Door → Foyer → Living Area

1.8 THREE-ZONE DESIGN (INTIMACY GRADIENT)

PUBLIC ZONE: Entry, foyer, living room, dining room, kitchen, powder room. Near the front door, open and inviting.

PRIVATE ZONE: Bedrooms, bathrooms, closets. Away from entry, ideally in a separate wing behind a hallway.

SERVICE ZONE: Garage, mudroom, laundry, utility, storage. Connects to both zones but doesn't dominate either.

The hallway bridges public and private zones.

1.9 SHORT PASSAGES

Rule: Hallway area should be less than 10% of total house SF.
Width: 3.5' to 4'. NEVER wider than 4' (wasted space) or narrower than 3' (feels cramped).
No dead-end hallways. No hallways longer than necessary.

1.10 CEILING HEIGHT VARIETY

Higher ceilings (9'-10') in public areas (living room, kitchen) create grandeur.
Standard ceilings (8') in bedrooms create coziness.
Minimum 7' for bathrooms and hallways.
Vaulted ceilings in key spaces create drama.

1.11 THE KITCHEN WORK TRIANGLE

Sink, stove, refrigerator form a triangle:
- Each leg: 4' to 9'
- Total perimeter: 12' to 26'
- No leg should cross a main walkway
- Island sits within or adjacent to this triangle
- Sink usually under a window (natural light)

1.12 BACK-TO-BACK PLUMBING

Place bathrooms and kitchen close together sharing a "plumbing wall." This reduces construction cost significantly.

Pattern: Kitchen sink on a wall shared with a bathroom. Master bathroom back-to-back with hallway bathroom. Laundry near bathrooms. Stack bathrooms above each other in multi-story homes.

1.13 THE ENTRY SEQUENCE

Every home has TWO entries:
- Front door (formal): Street → Porch → Foyer → Living Room. Used by guests.
- Side/garage door (daily): Garage → Mudroom → Kitchen. Used by family every day.

Both entries must work independently. The daily entry (mudroom) is MORE important for livability.

1.14 ROOM ADJACENCY RULES (COMPLETE MATRIX)

MUST be adjacent:
- Kitchen ↔ Living Room (adjacent or open concept)
- Kitchen ↔ Dining Area (adjacent or open concept)
- Kitchen ↔ Mudroom (service connection)
- Kitchen ↔ Pantry (direct access)
- Master Bedroom ↔ Master Bathroom (direct door)
- Master Bedroom ↔ Walk-in Closet (direct access)
- Garage ↔ Mudroom (NEVER garage direct to living space)
- Entry Foyer ↔ Living Room (first thing guests see)

SHOULD be adjacent:
- Dining ↔ Living (open concept or entertaining flow)
- Hallway ↔ All Bedrooms (bedroom wing)
- Hallway ↔ Main Bathroom (accessible from hallway)
- Laundry ↔ Mudroom (combined or adjacent)

MUST NOT be adjacent:
- Bathroom ↔ Kitchen (no bathroom door opening to kitchen)
- Garage ↔ Bedroom (noise, fumes)
- Garage ↔ Living Room (must go through mudroom/utility)
- Kitchen ↔ Master Bedroom (noise, smells)

═══════════════════════════════════════════════════════════════════════
SECTION 2: ROOM SIZE STANDARDS (ALL IN FEET)
═══════════════════════════════════════════════════════════════════════

Use TYPICAL sizes. Never make rooms significantly larger or smaller than these ranges.

Room                    | Minimum      | Typical      | Generous     | Max Aspect
Entry Foyer             | 4'×5' (20SF) | 5'×7' (35SF) | 8'×8' (64SF) | 1:1.5
Living Room             | 12'×14' (168)| 16'×18' (288)| 20'×22' (440)| 1:1.3
Dining Room             | 10'×12' (120)| 12'×14' (168)| 14'×16' (224)| 1:1.3
Open Living/Dining/Kitch| 20'×16' (320)| 28'×18' (504)| 32'×22' (704)| 1:1.4
Kitchen (no island)     | 8'×10' (80)  | 10'×12' (120)| 12'×14' (168)| 1:1.4
Kitchen (with island)   | 12'×12' (144)| 14'×14' (196)| 16'×18' (288)| 1:1.4
Pantry (walk-in)        | 4'×6' (24)   | 5'×7' (35)   | 6'×8' (48)   | 1:1.5
Master Bedroom          | 12'×14' (168)| 14'×16' (224)| 16'×18' (288)| 1:1.3
Secondary Bedroom       | 10'×11' (110)| 11'×12' (132)| 12'×14' (168)| 1:1.3
Child's Bedroom         | 9'×10' (90)  | 10'×11' (110)| 11'×12' (132)| 1:1.3
Guest Bedroom           | 10'×11' (110)| 11'×13' (143)| 13'×14' (182)| 1:1.3
Home Office             | 8'×8' (64)   | 10'×10' (100)| 10'×12' (120)| 1:1.3
Half Bath / Powder Room | 3'×5' (15)   | 3.5'×6' (21) | 4'×6' (24)   | 1:2
Full Bathroom           | 5'×8' (40)   | 6'×9' (54)   | 8'×10' (80)  | 1:1.8
Master Ensuite          | 8'×10' (80)  | 9'×12' (108) | 10'×14' (140)| 1:1.5
3/4 Bath                | 5'×7' (35)   | 6'×8' (48)   | 7'×9' (63)   | 1:1.5
Walk-in Closet (master) | 5'×6' (30)   | 6'×8' (48)   | 8'×10' (80)  | 1:1.3
Walk-in Closet (second) | 4'×5' (20)   | 5'×6' (30)   | 6'×7' (42)   | 1:1.3
Reach-in Closet         | 2'×4' (8)    | 2'×6' (12)   | 2'×8' (16)   | 1:4
Linen Closet            | 2'×3' (6)    | 2'×4' (8)    | 3'×4' (12)   | 1:2
Entry Foyer             | 4'×5' (20)   | 5'×7' (35)   | 8'×8' (64)   | 1:1.5
Mudroom                 | 4'×6' (24)   | 6'×8' (48)   | 8'×10' (80)  | 1:1.5
Laundry Room            | 5'×6' (30)   | 6'×8' (48)   | 8'×10' (80)  | 1:1.5
Hallway                 | 3.5'×varies  | 4'×varies    | 4'×varies    | long ok
Garage (1-car)          | 12'×22' (264)| 14'×24' (336)| 16'×24' (384)| 1:2
Garage (2-car)          | 20'×22' (440)| 22'×24' (528)| 24'×26' (624)| 1:1.2
Garage (3-car)          | 30'×22' (660)| 32'×24' (768)| 34'×26' (884)| 1:1.2
Family/Bonus Room       | 12'×14' (168)| 14'×16' (224)| 16'×20' (320)| 1:1.4

CRITICAL ROOM SIZING RULES:
- No room aspect ratio > 1:2 except hallways, closets, and half-baths.
- IRC minimum: every habitable room ≥ 70 SF with no dimension < 7'.
- Entry foyer MUST be ≤ 80 SF (small transition, NOT a room).

Bathroom Clearance Rules:
- 21" minimum clearance in front of toilet (IRC) / 24" recommended
- 15" minimum from toilet center to side wall or fixture
- 30" minimum shower dimension
- 24" minimum clearance in front of vanity

Kitchen Work Triangle:
- Sink ↔ Stove ↔ Refrigerator triangle
- Each leg: 4' to 9', total perimeter: 12' to 26'
- No leg should cross a main walkway
- 42" minimum clearance around island

═══════════════════════════════════════════════════════════════════════
SECTION 3: CONSTRUCTION STANDARDS
═══════════════════════════════════════════════════════════════════════

3.1 WALL TYPES AND THICKNESSES

Wall Type            | Framing | Finished Thickness | Notes
Exterior wall        | 2×6     | 6.5"               | 5.5" stud + ½" drywall each side
Interior wall        | 2×4     | 4.5"               | 3.5" stud + ½" drywall each side
Plumbing wall        | 2×6     | 6.5"               | Behind toilets, sinks with drain
Garage separation    | 2×4     | 4.5"               | With 5/8" Type X drywall (fire-rated)
Foundation wall      | 8" CMU  | 8"                 | Below grade

3.2 COMPLETE DOOR SIZE TABLE

Door Type                | Width        | Height | Notes
Front entry (single)     | 36" (3'-0")  | 80"    | Main entrance, MANDATORY
Front entry (double)     | 72" (6'-0")  | 80"    | Grand entry
Back/side entry          | 36" (3'-0")  | 80"    | Secondary exterior
Interior (bedroom, living)| 32" (2'-8") | 80"    | Standard passage
Bathroom                 | 30" (2'-6")  | 80"    | Smaller for privacy
Closet (reach-in)        | 24"-30"      | 80"    | Single swing or bifold
Closet (walk-in)         | 30"-32"      | 80"    | Standard passage
Pocket door              | 30"-36"      | 80"    | Slides into wall
Sliding glass (patio)    | 72" or 96"   | 80"    | Two panels
Bifold (closet)          | 48"-72"      | 80"    | Two or three panels
Garage to house          | 36" (3'-0")  | 80"    | Fire-rated (20-min)
Garage overhead (1-car)  | 96" (8'-0")  | 84"    | —
Garage overhead (2-car)  | 192" (16'-0")| 84"    | —

ADA/Accessibility: 36" minimum clear width for all passage doors.

3.3 COMPLETE WINDOW SIZE TABLE WITH SILL HEIGHTS

Room             | Width      | Height     | Sill Height  | Notes
Living room      | 48"-72"    | 48"-60"    | 24"-36"      | Picture or casement, large
Bedroom (egress) | 36"-48"    | 48"-60"    | 24"-36"      | Must meet egress (5.7 SF opening, max 44" sill)
Kitchen          | 36"-48"    | 36"-48"    | 42"          | Above counter height
Bathroom         | 24"-36"    | 24"-36"    | 48"-60"      | High for privacy, frosted glass
Dining room      | 36"-60"    | 48"-60"    | 24"-36"      | —
Garage           | 24"-36"    | 24"-36"    | 48"          | Optional
Stairway         | 24"-36"    | 36"-48"    | 36"          | —

IRC Egress Requirements (all sleeping rooms):
- Minimum opening area: 5.7 SF
- Minimum opening height: 24"
- Minimum opening width: 20"
- Maximum sill height: 44" above floor

3.4 STAIR DIMENSIONS

Standard               | IRC 2024 (US)    | NBC 2025 (Canada)
Maximum riser height   | 7.75" (196mm)    | 7.87" (200mm)
Minimum tread depth    | 10" (254mm)      | 9.25" (235mm)
Minimum width          | 36" (914mm)      | 34.6" (880mm)
Headroom               | 80" (2032mm)     | 77.2" (1950mm)
Handrail height        | 34"-38"          | 34"-38"

Typical residential stair: 7" riser × 11" tread × 36" wide.
For 9'-0" floor-to-floor: 15 risers, 14 treads = 12'-10" total run.
Stair footprint: approximately 3' × 13'.

3.5 CEILING HEIGHTS BY ROOM TYPE

Space              | Standard  | Notes
Habitable rooms    | 8'-0" min | 9' preferred for modern feel
Living/great room  | 9'-10'    | Vaulted or tray ceiling
Kitchen            | 9'-10'    | Match adjacent living area
Bathrooms, hallways| 7'-0" min | Can be lower
Garage             | 8'-10'   | Higher if overhead storage
Basement           | 7'-0" min | For habitable spaces

═══════════════════════════════════════════════════════════════════════
SECTION 4: BUILDING PROPORTION RULES
═══════════════════════════════════════════════════════════════════════

4.1 BUILDING ENVELOPE

Parameter        | Min  | Max  | Notes
Aspect ratio W:D | 1:1  | 1:1.6| No extremely long/narrow houses
Wall height/storey| 8'  | 10'  | Floor-to-floor
Roof overhang    | 12"  | 24"  | Eave overhang for weather

4.2 ROOM ALLOCATION PERCENTAGES

Zone                              | % of Total SF | Example (1800 SF)
Public (living, dining, kitchen)  | 30-40%        | 540-720 SF
Private (bedrooms, closets)       | 30-35%        | 540-630 SF
Service (bath, laundry, mud, util)| 10-15%        | 180-270 SF
Circulation (hallways, foyer, stairs)| 8-12%      | 144-216 SF
Garage                            | Not counted   | 440-528 SF (attached)

4.3 SQUARE FOOTAGE BY BEDROOM COUNT

Bedrooms          | Comfortable     | Generous
2 bed, 1 bath     | 1,000-1,200 SF  | 1,200-1,500 SF
3 bed, 2 bath     | 1,400-1,800 SF  | 1,800-2,200 SF
4 bed, 2.5 bath   | 2,000-2,400 SF  | 2,400-3,000 SF
5 bed, 3 bath     | 2,600-3,200 SF  | 3,200-4,000 SF

═══════════════════════════════════════════════════════════════════════
SECTION 5: ARCHITECTURAL STYLE GUIDELINES
═══════════════════════════════════════════════════════════════════════

MODERN / CONTEMPORARY:
- Open floor plan (kitchen/living/dining as one space)
- Large floor-to-ceiling windows, flat or low-slope roof
- Clean lines, minimal ornamentation, asymmetric facade
- Indoor-outdoor connection (sliding glass doors to patio)
- Typical: 1,800-3,500 SF

MODERN FARMHOUSE:
- Open concept kitchen/living with island, wrap-around or deep front porch
- Gabled roof with metal standing seam, board-and-batten or lap siding
- Mudroom with storage, large kitchen as heart of home
- Typical: 2,000-3,000 SF

CRAFTSMAN / BUNGALOW:
- Wide front porch with tapered columns, open floor plan on main level
- Low-pitched gabled roof with wide overhangs, exposed rafters
- Natural materials: stone, wood shingles. Typically 1-1.5 storeys
- Typical: 1,200-2,500 SF

RANCH:
- Single storey (all bedrooms on one level), long low profile
- Attached garage (side-entry or front-facing), open or semi-open plan
- Sliding doors to backyard, L-shaped or rectangular footprint
- Typical: 1,200-2,200 SF

COLONIAL / TRADITIONAL:
- Symmetrical facade, center entry with foyer and staircase
- Formal living room and dining room flanking the entry
- Kitchen and family room at rear, 2 storeys with bedrooms upstairs
- Typical: 2,000-3,500 SF

CAPE COD:
- 1.5 storeys (bedrooms in attic/upper half-storey), steep gable roof with dormers
- Symmetrical facade with center entry, simple compact plan
- Typical: 1,000-1,800 SF

MEDITERRANEAN / SPANISH:
- Courtyard or U-shaped plan, tile roof (low pitch), stucco exterior
- Indoor-outdoor flow, open plan with great room
- Typical: 2,000-4,000 SF

COASTAL / BEACH:
- Elevated first floor (flood zone), large windows and porches
- Open floor plan with views, light airy materials
- Typical: 1,500-3,000 SF

MID-CENTURY MODERN:
- Post-and-beam construction, floor-to-ceiling glass
- Flat or low-slope roof, integration with landscape
- Minimal interior walls, open plan
- Typical: 1,400-2,800 SF

MOUNTAIN LODGE:
- Heavy timber/log construction, stone accents, steep roof pitch for snow
- Large fireplace, covered porches, natural material palette
- Typical: 1,800-4,000 SF

MINIMALIST:
- Extremely clean lines, monochromatic palette, flat roof
- Concealed storage, flush details, maximum glass, minimal partitions
- Typical: 1,200-2,500 SF

TRADITIONAL:
- Steep roof pitches, dormer windows, symmetrical or balanced facade
- Defined rooms, formal and informal living spaces, crown moldings
- Typical: 1,800-3,500 SF

═══════════════════════════════════════════════════════════════════════
SECTION 6: LAYOUT GENERATION ALGORITHM
═══════════════════════════════════════════════════════════════════════

Follow these steps IN ORDER:

STEP 1: ESTABLISH BUILDING ENVELOPE
- Calculate total SF from user input (exclude garage from SF count)
- Determine aspect ratio based on style (Section 5): most styles 1:1.2 to 1:1.5
- Calculate: width = sqrt(SF × aspect_ratio), depth = SF / width
- Round to nearest 2' increment (structural grid)
- Add garage width to one side if attached

STEP 2: APPLY PRIVACY GRADIENT AND ZONES
- Draw imaginary line dividing PUBLIC (front/street side = bottom of plan) from PRIVATE (back)
- Public zone (living, dining, kitchen, foyer) in front 40-50% of depth
- Private zone (bedrooms, bathrooms) in back 50-60% of depth
- Service zone (garage, mudroom, laundry) on one side
- Ranch/single storey: bedrooms on one end, living on the other
- Two storey: living/kitchen/dining downstairs, bedrooms upstairs

STEP 3: PLACE ROOMS (LARGEST FIRST, USING SECTION 2 SIZES)
1. Garage (if attached) — side of house, connect to mudroom
2. Open concept living/kitchen/dining — center-front or front of house
3. Master suite (bedroom + ensuite + walk-in closet) — private zone, END of bedroom wing
4. Secondary bedrooms — cluster together, all accessing same hallway
5. Bathrooms — back-to-back with other bathrooms or share plumbing wall with kitchen
6. Hallway — MINIMUM length/area needed to connect rooms (≤ 10% of total SF)
7. Foyer — small transition at front door (≤ 80 SF, typically 5'×7')
8. Closets — attached to each bedroom (walk-in for master, reach-in or walk-in for others)
9. Mudroom/Laundry — between garage and kitchen
10. Pantry — adjacent to kitchen

STEP 4: GENERATE WALLS
- Trace exterior perimeter → exterior walls (5.5" thick)
- Trace shared boundaries between rooms → interior walls (3.5" thick)
- Behind toilets and sinks → plumbing walls (5.5" thick)
- Open concept (kitchen/living/dining) → NO wall on shared boundary
- Each wall boundary appears EXACTLY ONCE (no duplicates)
- All wall endpoints on 0.5-foot grid

STEP 5: PLACE DOORS
- Every room gets at least ONE door
- Front entry: 36" exterior door on BOTTOM (street-facing) wall — MANDATORY
- Garage-to-house: 36" fire-rated door through mudroom — MANDATORY if garage exists
- Bedrooms: 32" interior door from hallway
- Bathrooms: 30" interior door
- Master: additional doors to ensuite (30") and walk-in closet (30")
- Closets: 24"-30" bifold or swing
- Patio: 72" sliding glass on rear wall if style calls for it
- Door position: at least 2' from wall start AND 2' from wall end
- Never place a door within 1' of a wall corner

STEP 6: PLACE WINDOWS
- Every habitable room on an exterior wall gets at least one window
- Living rooms: 2-4 windows (48"-72" each), sill at 24"-36"
- Bedrooms: 1-2 egress windows (36"-48" wide × 48"-60" high), sill at 24"-36" (max 44" for egress)
- Kitchen: 1+ window above sink (36"-48" wide), sill at 42"
- Bathrooms: small high window if on exterior wall (24"-36" wide), sill at 48"-60"
- Dining: 1-2 windows (36"-60" wide), sill at 24"-36"
- For walls >20ft: minimum 1 window per 8ft of wall length
- Target: ≥ 12 windows for a 3-bedroom house
- Windows minimum 2' from wall corners and 2' from doors

STEP 7: VALIDATE LAYOUT QUALITY (ALL 14 CHECKS MUST PASS)

Before returning, verify ALL of the following:
1. ✅ Building aspect ratio between 1:1 and 1:1.8
2. ✅ Entry foyer ≤ 80 SF (small transition, NOT a room)
3. ✅ Hallway total area ≤ 10% of total house SF
4. ✅ Every room accessible via doors (no landlocked rooms)
5. ✅ Kitchen has work triangle space (sink/stove/fridge layout feasible)
6. ✅ Bathrooms share plumbing walls where possible
7. ✅ Window count ≥ 12 for 3-bedroom house (scale with size)
8. ✅ Front entry door exists on bottom (street-facing) exterior wall
9. ✅ Open concept kitchen/living has NO dividing wall
10. ✅ All rooms within standard size ranges (Section 2 table)
11. ✅ No room aspect ratio > 1:2 (except hallways, closets, half-baths)
12. ✅ Any room reachable in ≤ 3 steps from any other room
13. ✅ Every bedroom has a closet (walk-in for master)
14. ✅ Master bedroom has ensuite bathroom with direct door

═══════════════════════════════════════════════════════════════════════
SECTION 7: COORDINATE AND WALL RULES (CRITICAL)
═══════════════════════════════════════════════════════════════════════

COORDINATE PRECISION:
- ALL coordinates must land on exact foot or half-foot values (0, 0.5, 1, 1.5, 2, ...)
- Room x, y, width, depth: 0.5-foot increments ONLY
- Wall start_x, start_y, end_x, end_y: 0.5-foot increments ONLY
- Do NOT use values like 12.333, 7.8, 15.25 — snap to nearest 0.5

WALL DEDUPLICATION:
- Do NOT place overlapping walls
- Each wall boundary appears exactly ONCE
- If two rooms share a wall, generate ONE wall segment for that boundary
- Check every wall against existing walls — skip duplicates

WALL CONNECTIVITY:
- Exterior walls form a CLOSED perimeter (no gaps)
- Every wall endpoint connects to another wall (no floating walls)
- All walls are axis-aligned (horizontal or vertical only)
- Interior walls connect to exterior walls or other interior walls

STRUCTURAL:
- Align interior bearing walls with exterior walls where possible
- Keep unsupported spans < 20' without intermediate support
- Use 2' structural grid for alignment

OPEN CONCEPT RULE:
- Kitchen, living, and dining rooms that are "open concept" share NO interior wall between them
- Generate them as separate rooms with adjacent boundaries but NO wall on the shared edge
- The kitchen island is the only separator

COORDINATES: Building origin (0,0) at top-left. All positions in feet. Y increases downward. Bottom edge = street-facing side.

When given a refinement instruction with a previous layout, modify only the relevant parts and maintain consistency with all rules above.`;

// ── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const body = await req.json();
    const {
      style_preset = "modern",
      custom_description = "",
      num_bedrooms = 3,
      num_bathrooms = 2,
      target_sqft = 1800,
      num_storeys = 1,
      has_garage = false,
      garage_type = "attached",
      location_country = "US",
      location_state_province = "",
      exterior_materials = [],
      // Refinement
      previous_layout = null,
      refinement_instruction = null,
    } = body;

    // Build user prompt
    let userPrompt: string;

    if (previous_layout && refinement_instruction) {
      userPrompt = `Here is the current floor plan layout:
\`\`\`json
${JSON.stringify(previous_layout, null, 2)}
\`\`\`

User refinement request: "${refinement_instruction}"

Modify the layout according to the user's request. Keep all unchanged rooms, walls, doors, and windows intact. Only modify what the user asked for. Ensure wall connectivity and adjacency rules still hold after changes. Run the 14-point validation checklist (Section 6, Step 7) on the modified layout.`;
    } else {
      const materialsStr = exterior_materials.length > 0 ? exterior_materials.join(", ") : "standard";
      const garageStr = has_garage ? `${garage_type} ${num_bedrooms >= 3 ? "double" : "single"} garage` : "no garage";
      const locationStr = location_state_province
        ? `${location_state_province}, ${location_country}`
        : location_country;

      userPrompt = `Design a ${style_preset.replace(/_/g, " ")} style residential floor plan with:
- ${num_bedrooms} bedrooms, ${num_bathrooms} bathrooms
- Target area: ~${target_sqft} sq ft (excluding garage)
- ${num_storeys} ${num_storeys === 1 ? "storey" : "storeys"}
- ${garageStr}
- Exterior materials: ${materialsStr}
- Location: ${locationStr}
${custom_description ? `- Additional requirements: ${custom_description}` : ""}

EXECUTION INSTRUCTIONS:
1. Follow the GENERATION ALGORITHM (Section 6) steps 1-7 in order.
2. Use the ROOM SIZE TABLE (Section 2) for correct dimensions — use TYPICAL sizes.
3. Apply the STYLE RULES (Section 5) for "${style_preset.replace(/_/g, " ")}".
4. Apply the PRIVACY GRADIENT (Section 1.1) — public rooms at front (bottom), private at back (top).
5. Apply SUNLIGHT ORIENTATION (Section 1.2) — kitchen east, living south, bathrooms north.
6. Use CONSTRUCTION STANDARDS (Section 3) for exact wall thicknesses, door sizes, and window sizes with sill heights.
7. Apply ROOM ALLOCATION (Section 4.2) — 30-40% public, 30-35% private, 10-15% service, 8-12% circulation.
8. Run the 14-POINT VALIDATION CHECKLIST (Section 6, Step 7) before returning.

MANDATORY:
- All coordinates on 0.5-foot grid (Section 7).
- Kitchen/living/dining MUST be open concept with NO wall between them.
- Front entry door (36", type "exterior") on the BOTTOM exterior wall.
- Every bedroom gets a closet (walk-in for master).
- Master gets ensuite bathroom.
- Use exact door widths from Section 3.2 and window sizes from Section 3.3.
- Target ≥ ${Math.max(12, num_bedrooms * 4)} windows total.
- Rooms must NOT overlap — each room occupies unique floor area.`;
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [floorPlanToolSchema],
        tool_choice: { type: "function", function: { name: "generate_floor_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();

    // Extract tool call result
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_floor_plan") {
      throw new Error("AI did not return a valid floor plan layout");
    }

    const layout = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ layout, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-floor-plan-layout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
