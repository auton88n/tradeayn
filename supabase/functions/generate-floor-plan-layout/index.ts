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

// ── System prompt with architectural rules ───────────────────────────────────

const SYSTEM_PROMPT = `You are a professional residential architect and space planner. Generate realistic, buildable floor plan layouts as structured JSON data.

CRITICAL RULES (in priority order):
1. ADJACENCY: Kitchen MUST be adjacent to dining room. Master bedroom AWAY from living areas. Bathrooms BACK-TO-BACK or STACKED for plumbing efficiency. Utility/laundry near exterior wall. Garage entry through mudroom or utility room, never directly into living areas.
2. OPEN CONCEPT (CRITICAL): NEVER generate ANY interior wall between the kitchen room and the living/dining room. Not even a partial wall. The kitchen island or peninsula is the ONLY separator. If you generate a wall here, the layout is INVALID. Open concept means kitchen, living, and dining share one continuous space with NO separating walls. Only generate interior walls where there is an actual room separation (hallway, bedrooms, bathrooms). Generate the kitchen, living, and dining as separate rooms that are adjacent but do NOT place a wall on their shared boundary.
3. CIRCULATION: ALWAYS include a HALLWAY (minimum 3.5ft wide, type "hallway") connecting the open-concept living area to the bedroom wing. Bedroom doors must open FROM the hallway, not from other bedrooms. Room access chain: Front Entry -> Living/Dining -> Hallway -> Bedrooms + Bathrooms. Every room must be reachable. No dead-end circulation.
4. WALL CONVENTIONS: Exterior walls = 2x6 (5.5" thick). Interior bearing walls = 2x4 (3.5" thick). Partition walls = 2x4 (3.5"). All walls must be axis-aligned (horizontal or vertical only).
5. MANDATORY FRONT ENTRY DOOR (NON-NEGOTIABLE): The FRONT ENTRY DOOR (36" wide, type "exterior") MUST be placed on the BOTTOM exterior wall (street-facing). This is the primary entrance for visitors. If you generate a layout without a front entry door on the bottom exterior wall, the layout is INVALID. Verify this before returning. If an entry/foyer room exists, the front door opens into it.
6. MANDATORY WINDOWS (CRITICAL): EVERY habitable room on an exterior wall MUST have windows. No habitable room's exterior wall should be windowless.
   - Window width: at least 36 inches for bedrooms, 48 inches for living rooms, 36 inches for kitchen.
   - Living rooms: 3-4 windows (48-72" wide each) on ALL exterior walls the room touches. A living/dining room's right wall and bottom wall must both have windows.
   - Kitchen: 1+ window (36-48" wide), typically above sink on exterior wall.
   - Bedrooms: 1-2 egress windows (minimum 36"W x 36"H). Master bedroom: 2 windows minimum on its exterior walls.
   - Bathrooms: 1 smaller window (24"-36") if on exterior wall.
   - For rooms with more than 20ft of exterior wall, generate at minimum 1 window per 8ft of wall length.
   - A 3-bedroom house should have 12-16 windows minimum total. COUNT your windows before returning.
7. STANDARD SIZES:
    - Bedrooms: Master 14x16 min, Secondary 11x12 min, closet for each
    - Bathrooms: Full bath 5x8 min, Half bath 3x5 min, Ensuite 8x10
    - Kitchen: 10x12 min, ideally open to dining
    - Living/Family: 14x16 min
    - Dining: 10x12 min
    - Garage: 12x22 single, 22x22 double
    - Hallways: 3.5ft minimum width
    - Closets: 3x5 minimum reach-in, 6x6 minimum walk-in
8. MANDATORY DOORS:
    - EVERY room must have at least one door. No room should be inaccessible.
    - Garage-to-house door (36" wide, type "garage") through mudroom/utility is REQUIRED when garage is present.
    - Every bedroom needs a door (32" wide) from the hallway.
    - Every bathroom needs a door (30" wide).
    - Master bedroom must have a direct door to the ensuite.
    - Kitchen to mudroom/laundry needs a door.
9. DOOR SIZES: Exterior=36", Interior=32", Bathroom=30", Closet=24". All doors need clearance for swing arc.
10. COORDINATES: All room positions (x,y) are in feet from building origin (0,0) at top-left. Walls reference start and end points in feet.
11. WALL CONNECTIVITY: Walls must form closed perimeters for exterior and connect logically for interior. Every wall endpoint should connect to another wall (no floating walls).
12. CODE COMPLIANCE: Minimum ceiling height 7'6" (typically 9'). Bedroom minimum area 70 sq ft with minimum dimension 7'. At least one bathroom per 3 bedrooms.
13. STRUCTURAL: Align interior bearing walls with exterior walls where possible. Keep spans reasonable (<20ft without intermediate support).
14. CLOSETS (MANDATORY): Every bedroom MUST include a closet or walk-in wardrobe (W/W). Generate closets as SEPARATE rooms with type "closet". Minimum size: 3'x5' for reach-in, 6'x6' for walk-in. The master bedroom MUST have a walk-in closet (labeled "Walk-in Closet" or "W/W"). Each closet needs a door (24" wide) opening into the bedroom it serves.

VALIDATION CHECKLIST (verify ALL before returning):
- Front entry door exists on bottom wall? YES
- Kitchen and living/dining have NO wall between them? YES
- Every habitable room has windows on its exterior walls? YES
- Total window count >= 12 for a 3-bedroom house? YES
- Every room is reachable via doors? YES
- Every bedroom has a closet room attached? YES
- Master bedroom has a walk-in closet? YES

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

Generate the complete floor plan layout with all rooms, walls (with proper thicknesses), doors (with swing directions), and windows (with sizes and types). Ensure realistic proportions and buildable geometry.

IMPORTANT REMINDERS:
- Kitchen and living/dining MUST be open concept with NO wall between them. The island is the only separator.
- Include a FRONT ENTRY DOOR (36", type "exterior") on the BOTTOM exterior wall. This is mandatory.
- Every exterior wall of every habitable room must have at least one window. Living rooms need 3-4 windows total.
- Master bedroom needs 2 windows minimum.
- Count your total windows before returning — aim for 12-16 for a 3-bedroom house.`;
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
