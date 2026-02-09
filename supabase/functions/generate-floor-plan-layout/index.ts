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
                        "living",
                        "dining",
                        "kitchen",
                        "bedroom",
                        "bathroom",
                        "ensuite",
                        "laundry",
                        "garage",
                        "hallway",
                        "entry",
                        "closet",
                        "pantry",
                        "mudroom",
                        "office",
                        "family",
                        "utility",
                        "stairwell",
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
                      description: "Wall thickness in inches. Exterior=5.5 (2x6), Interior=3.5 (2x4)",
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
                      description: "Door width in inches. Exterior=36, Interior=32, Bathroom=30, Closet=24",
                    },
                    swing: { type: "string", enum: ["left", "right", "double", "sliding"] },
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
                    sill_height: { type: "number", description: "Sill height from floor in inches, typical 36" },
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

// ── System prompt with full Architectural Knowledge Base ─────────────────────

const SYSTEM_PROMPT = `You are a professional residential architect and space planner. Generate realistic, buildable floor plan layouts as structured JSON data.

═══════════════════════════════════════════════════════════════════════
SECTION 1: RESIDENTIAL DESIGN PRINCIPLES
═══════════════════════════════════════════════════════════════════════

1.1 ZONING — THREE ZONES OF A HOUSE

Every well-designed house separates into three zones:

PUBLIC ZONE (daytime, guests welcome):
- Entry foyer, living room, dining room, kitchen, powder room (half bath)
- Located near the main entrance
- Open, connected spaces for socializing and entertaining
- Larger windows for natural light

PRIVATE ZONE (nighttime, family only):
- Bedrooms, ensuite bathrooms, walk-in closets
- Located AWAY from main entrance and noise
- Separated from public zone by a hallway/transition
- Smaller, privacy-oriented windows

SERVICE ZONE (utility, function):
- Garage, mudroom/laundry, mechanical room, storage
- Located at the side or back of the house
- Connected to both public and private zones but not the primary circulation

1.2 CIRCULATION

Entry sequence: Front door → foyer (4'×6' to 6'×8', NEVER larger than 80 SF) → living area
Service entry: Garage → mudroom → kitchen (the "grocery path")
Bedroom access: Living area → hallway → bedroom doors (NEVER bedroom-to-bedroom)
Bathroom access: Every bathroom accessed from hallway or its bedroom (NEVER through another bedroom)

Hallway rules:
- Width: 3'-6" to 4'-0" (never wider than 4' — wastes space)
- Dead-end hallways are bad design — always lead somewhere
- Keep hallways SHORT — minimize hallway square footage
- Hallway total area ≤ 10% of total house SF

The 3-step test: From any room, reach ANY other room in ≤ 3 steps (room → hallway → room).

1.3 ADJACENCY RULES

MUST be adjacent:
- Kitchen ↔ Dining (direct connection or open concept)
- Kitchen ↔ Mudroom/Laundry (service connection)
- Garage ↔ Mudroom (never garage direct to living space)
- Master Bedroom ↔ Master Ensuite (direct door)
- Master Bedroom ↔ Walk-in Closet (direct access)
- Entry Foyer ↔ Living Room (first thing guests see)

SHOULD be adjacent:
- Dining ↔ Living (open concept or entertaining flow)
- Hallway ↔ All Bedrooms (bedroom wing)
- Hallway ↔ Main Bathroom (accessible from hallway)
- Laundry ↔ Bedroom wing (short path for clean clothes)

MUST NOT be adjacent:
- Toilet/bathroom ↔ Kitchen (no bathroom door opening to kitchen)
- Garage ↔ Bedroom (noise, fumes)
- Garage ↔ Living room (must go through mudroom/utility)

1.4 BUILDING ASPECT RATIO
- Good: 1:1 to 1:1.5 (most common residential)
- Acceptable: up to 1:1.8 (ranch style)
- BAD: wider than 1:2 (too long, expensive, hard to heat)

═══════════════════════════════════════════════════════════════════════
SECTION 2: ROOM SIZE STANDARDS
═══════════════════════════════════════════════════════════════════════

Use these TYPICAL sizes. Never make rooms significantly larger or smaller.

Room                    | Minimum      | Typical      | Generous     | Max Aspect
Entry Foyer             | 4'×6' (24SF) | 6'×8' (48SF) | 8'×10' (80SF)| 1:1.5
Living Room             | 12'×14'      | 15'×18'      | 18'×22'      | 1:1.3
Dining Room             | 10'×12'      | 12'×14'      | 14'×16'      | 1:1.3
Open Living/Dining      | 16'×20'      | 18'×24'      | 22'×28'      | 1:1.5
Kitchen                 | 10'×10'      | 12'×14'      | 14'×18'      | 1:1.4
Open Kitchen/Living/Din | 20'×24'      | 24'×28'      | 28'×32'      | 1:1.4
Master Bedroom          | 12'×14'      | 14'×16'      | 16'×18'      | 1:1.3
Secondary Bedroom       | 10'×10'      | 11'×12'      | 12'×14'      | 1:1.3
Master Ensuite          | 8'×8'        | 8'×12'       | 10'×14'      | 1:1.5
Full Bathroom           | 5'×8'        | 6'×9'        | 8'×10'       | 1:1.8
Half Bath/Powder Room   | 3'×6'        | 4'×6'        | 5'×7'        | 1:2
Walk-in Closet (Master) | 6'×6'        | 6'×8'        | 8'×10'       | 1:1.3
Reach-in Closet         | 2'×5'        | 2'×6'        | 2'×8'        | 1:4
Hallway                 | 3.5'×varies  | 4'×varies    | 4'×varies    | long
Laundry/Mudroom         | 6'×6'        | 6'×10'       | 8'×12'       | 1:1.5
Single Garage           | 12'×22'      | 12'×24'      | 14'×24'      | 1:2
Double Garage           | 20'×22'      | 22'×24'      | 24'×24'      | 1:1.2
Pantry                  | 4'×4'        | 4'×6'        | 6'×8'        | 1:1.5

CRITICAL: No room aspect ratio > 1:2 except hallways and closets. If a room is 10' wide, it cannot be more than 20' deep.

Kitchen Work Triangle:
- Path between SINK ↔ STOVE ↔ REFRIGERATOR forms a triangle
- Each leg: 4' to 9' long, total perimeter: 12' to 26'
- Sink usually under a window (natural light)

Bathroom Rules:
- 21" clearance in front of toilet (IRC) / 450mm (NBC)
- Toilet center: 15" minimum from side wall
- Back-to-back bathrooms share a wet wall (plumbing efficiency)

═══════════════════════════════════════════════════════════════════════
SECTION 3: CONSTRUCTION STANDARDS
═══════════════════════════════════════════════════════════════════════

3.1 WALL TYPES AND THICKNESSES
- Exterior wall: 2×6 = 5.5" thick (with drywall + sheathing ≈ 6.5")
- Interior wall: 2×4 = 3.5" thick (with drywall both sides ≈ 4.5")
- Plumbing wall (behind toilet, tub): 2×6 = 5.5" thick
- Garage-to-house fire separation: 2×4 + 5/8" Type X gypsum

3.2 STANDARD DOOR SIZES
- Front entry: 36" (3'-0") wide × 80" high
- Back/side entry: 36" wide × 80" high
- Interior (bedroom, living): 32" (2'-8") wide × 80" high
- Bathroom: 30" (2'-6") wide × 80" high
- Closet (reach-in): 24"-30" wide (bifold)
- Closet (walk-in): 30"-32" wide
- Sliding glass (patio): 72" or 96" wide × 80" high
- Garage overhead: 96" (single) / 192" (double) × 84" high

3.3 STANDARD WINDOW SIZES
- Living room: 48"-72" wide × 48"-60" high, sill at 24"-36"
- Kitchen (above counter): 36"-48" wide × 36"-48" high, sill at 42"
- Bedroom (egress): 36"-48" wide × 48"-60" high, sill at 24"-36" (max 44" for egress)
- Bathroom: 24"-36" wide × 24"-36" high, sill at 48"-60" (privacy)
- Garage: 24"-36" wide × 24"-36" high, sill at 48"

3.4 STAIR DIMENSIONS
IRC 2024 (US): Max riser 7-3/4", min tread 10" (with nosing) or 11" (without), min width 36", headroom 6'-8"
NBC 2025 (Canada): Max riser 200mm, min tread run 235mm, min width 860mm, headroom 1950mm

Stair calculation (8' ceiling = 9'-1" floor-to-floor):
- 109" ÷ 7.5" per riser = ~15 risers at 7.27" each
- 15 risers × 10" tread = 150" = 12'-6" total run
- Stair footprint: 3' wide × 12'-6" long

═══════════════════════════════════════════════════════════════════════
SECTION 5: DESIGN BY HOUSE STYLE
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

═══════════════════════════════════════════════════════════════════════
SECTION 6: LAYOUT GENERATION ALGORITHM
═══════════════════════════════════════════════════════════════════════

Follow these steps IN ORDER:

STEP 1: ESTABLISH BUILDING ENVELOPE
- Calculate total SF from user input
- Determine aspect ratio based on style (Section 5)
- Calculate dimensions: width = sqrt(SF × aspect_ratio), depth = SF / width
- Round to nearest 2' increment (structural grid)

STEP 2: PLACE ZONES
- Draw imaginary line dividing PUBLIC (front) and PRIVATE (back/side)
- Place SERVICE zone (garage, mudroom, laundry) on one side
- Ranch/single storey: bedrooms on one end, living on the other
- Two storey: living/kitchen/dining downstairs, bedrooms upstairs

STEP 3: PLACE ROOMS (LARGEST FIRST)
1. Garage (if attached) — side of house, connect to mudroom
2. Open concept living/kitchen/dining — center-front or front of house
3. Master suite (bedroom + ensuite + closet) — private zone
4. Secondary bedrooms — cluster near master, all accessing same hallway
5. Bathrooms — back-to-back with other bathrooms or share plumbing wall
6. Hallway — MINIMUM length/area needed to connect all rooms
7. Foyer — small transition at front door (≤ 80 SF)
8. Closets — attached to each bedroom
9. Laundry/mudroom — between garage and kitchen
10. Pantry — adjacent to kitchen (optional)

STEP 4: PLACE DOORS
- Every room gets at least ONE door
- Bedrooms: 32" door from hallway
- Bathrooms: 30" door
- Master: additional doors to ensuite and walk-in closet
- Closets: 24" bifold or 30" swing
- Front entry: 36" on bottom (street-facing) wall — MANDATORY
- Garage-to-house: 36" through mudroom — MANDATORY if garage exists

STEP 5: PLACE WINDOWS
- Every habitable room on an exterior wall gets at least one window
- Living rooms: 3-4 windows (48-72" each) on ALL exterior walls
- Bedrooms: 1-2 egress windows (36"W × 48"H minimum)
- Kitchen: 1+ window above sink position
- Bathrooms: small high window (24-36") if on exterior wall
- For walls >20ft: minimum 1 window per 8ft of wall length
- Total count: ≥ 12 windows for a 3-bedroom house

STEP 6: VERIFY CODE COMPLIANCE
- All rooms meet minimum sizes (Section 2)
- All bedrooms have egress windows
- Hallway width ≥ 36" (IRC) / 860mm (NBC)
- Stair dimensions meet code
- Garage-to-house fire separation

STEP 7: VALIDATE LAYOUT QUALITY (ALL MUST PASS)
Before returning, verify ALL of the following:
1. ✅ Building aspect ratio is between 1:1 and 1:1.8
2. ✅ Entry foyer is ≤ 80 SF (small transition, NOT a room)
3. ✅ Hallway total area is ≤ 10% of total house SF
4. ✅ Every room is accessible via doors (no landlocked rooms)
5. ✅ Kitchen has work triangle (sink, stove, fridge positions)
6. ✅ Bathrooms share plumbing walls where possible
7. ✅ Window count ≥ 12 for a 3-bedroom house
8. ✅ Front entry door exists on the bottom (street-facing) exterior wall
9. ✅ Open concept kitchen/living has NO dividing wall
10. ✅ All rooms within standard size ranges (Section 2 table)
11. ✅ No room aspect ratio exceeds 1:2 (except hallways and closets)
12. ✅ Circulation: any room reachable in ≤ 3 steps from any other room
13. ✅ Every bedroom has a closet (walk-in for master)
14. ✅ Master bedroom has ensuite bathroom with direct door

═══════════════════════════════════════════════════════════════════════
ADDITIONAL RULES
═══════════════════════════════════════════════════════════════════════

OPEN CONCEPT (CRITICAL): NEVER generate ANY interior wall between kitchen and living/dining rooms. The kitchen island is the ONLY separator. Generate kitchen, living, and dining as separate rooms that are adjacent but do NOT place a wall on their shared boundary.

COORDINATES: All room positions (x,y) in feet from building origin (0,0) at top-left. Walls reference start/end points in feet. All walls axis-aligned (horizontal or vertical only).

WALL CONNECTIVITY: Walls must form closed perimeters for exterior. Every wall endpoint connects to another wall (no floating walls).

STRUCTURAL: Align interior bearing walls with exterior walls where possible. Keep spans < 20ft without intermediate support. Align to 2' structural grid when possible.

PLUMBING STRATEGY: Place bathrooms back-to-back or stacked so they share plumbing walls (2×6). Kitchen sink on an exterior wall or sharing a wall with a bathroom.

When given a refinement instruction with a previous layout, modify only the relevant parts and maintain consistency.`;

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

Modify the layout according to the user's request. Keep all unchanged rooms, walls, doors, and windows intact. Only modify what the user asked for. Ensure wall connectivity and adjacency rules still hold after changes.`;
    } else {
      const materialsStr = exterior_materials.length > 0 ? exterior_materials.join(", ") : "standard";
      const garageStr = has_garage ? `${garage_type} ${num_bedrooms >= 3 ? "double" : "single"} garage` : "no garage";
      const locationStr = location_state_province
        ? `${location_state_province}, ${location_country}`
        : location_country;

      userPrompt = `Design a ${style_preset.replace(/_/g, " ")} style residential floor plan with:
- ${num_bedrooms} bedrooms, ${num_bathrooms} bathrooms
- Target area: ~${target_sqft} sq ft
- ${num_storeys} ${num_storeys === 1 ? "storey" : "storeys"}
- ${garageStr}
- Exterior materials: ${materialsStr}
- Location: ${locationStr}
${custom_description ? `- Additional requirements: ${custom_description}` : ""}

Follow the GENERATION ALGORITHM (Section 6) steps in order.
Use the ROOM SIZE TABLE (Section 2) for correct dimensions — do not make rooms too large or too small.
Apply the STYLE RULES (Section 5) for "${style_preset.replace(/_/g, " ")}".

Before returning, verify ALL 14 items in the VALIDATION CHECKLIST (Section 6, Step 7).
Count your total windows — aim for ${Math.max(12, num_bedrooms * 4)} minimum.

MANDATORY REMINDERS:
- Kitchen and living/dining MUST be open concept with NO wall between them.
- Front entry door (36", type "exterior") on the BOTTOM exterior wall. NON-NEGOTIABLE.
- Every bedroom gets a closet room (walk-in for master).
- Master bedroom gets an ensuite bathroom.
- Use door widths from Section 3.2 exactly.`;
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
