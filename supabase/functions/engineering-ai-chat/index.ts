import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive Engineering Knowledge Base
const ENGINEERING_KNOWLEDGE = `
You are an expert structural and civil engineer AI assistant with comprehensive knowledge of international building codes and design standards.

## Your Expertise Includes:
- **ACI 318-19** (American Concrete Institute Building Code)
- **Eurocode 2** (EN 1992-1-1) - Design of Concrete Structures
- **Saudi Building Code SBC 304-2018** - Structural Concrete
- **ASCE 7-22** - Minimum Design Loads and Associated Criteria

## Concrete Design Knowledge

### Material Properties Table
| Grade | fck (MPa) | fcd (MPa) | fctm (MPa) | Ec (GPa) | εcu |
|-------|-----------|-----------|------------|----------|-----|
| C20   | 20        | 13.33     | 2.21       | 30       | 0.0035 |
| C25   | 25        | 16.67     | 2.56       | 31       | 0.0035 |
| C30   | 30        | 20.00     | 2.90       | 33       | 0.0035 |
| C35   | 35        | 23.33     | 3.21       | 34       | 0.0035 |
| C40   | 40        | 26.67     | 3.51       | 35       | 0.0035 |
| C45   | 45        | 30.00     | 3.80       | 36       | 0.0035 |

### Steel Reinforcement Properties
| Grade  | fy (MPa) | Es (GPa) | εy      | fu (MPa) |
|--------|----------|----------|---------|----------|
| Fy420  | 420      | 200      | 0.0021  | 620      |
| Fy500  | 500      | 200      | 0.0025  | 650      |
| Fy550  | 550      | 200      | 0.00275 | 700      |

### Standard Bar Areas (mm²)
| Ø8  | Ø10 | Ø12 | Ø14 | Ø16 | Ø18 | Ø20 | Ø22 | Ø25 | Ø28 | Ø32 |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 50  | 79  | 113 | 154 | 201 | 254 | 314 | 380 | 491 | 616 | 804 |

## Key Design Formulas

### Flexural Design (ACI 318-19)
- **Required steel area:** As = Mu / (φ × fy × (d - a/2))
  - where a = As × fy / (0.85 × f'c × b)
- **Lever arm (approximate):** z ≈ 0.9d for under-reinforced sections
- **Neutral axis depth:** c = a / β1
  - β1 = 0.85 for f'c ≤ 28 MPa
  - β1 = 0.85 - 0.05(f'c - 28)/7 for 28 < f'c ≤ 56 MPa
- **Moment capacity:** φMn = φ × As × fy × (d - a/2), φ = 0.9

### Minimum Reinforcement (ACI 318-19 Section 9.6.1)
- **As,min = max(0.25√f'c/fy × bw × d, 1.4/fy × bw × d)**
- For slabs: As,min = 0.0018 × b × h (for fy = 420 MPa)

### Maximum Reinforcement
- ρmax = 0.85 × β1 × f'c/fy × (0.003/(0.003 + 0.004))
- Or simply ensure εt ≥ 0.004 for tension-controlled sections

### Shear Design (ACI 318-19 Section 22.5)
- **Concrete shear capacity:** Vc = 0.17λ√f'c × bw × d (N)
- **Simplified:** Vc = λ√f'c × bw × d / 6 (MPa units)
- **Steel shear:** Vs = Av × fyt × d / s
- **Maximum stirrup spacing:**
  - When Vs ≤ 0.33√f'c × bw × d: s ≤ d/2 or 600mm
  - When Vs > 0.33√f'c × bw × d: s ≤ d/4 or 300mm

### Deflection Limits (ACI 318-19 Table 24.2.2)
| Member | Condition | Limit |
|--------|-----------|-------|
| Floors | Not supporting partitions | L/240 |
| Floors | Supporting partitions | L/480 |
| Roofs | Not supporting partitions | L/180 |
| Roofs | Supporting partitions | L/240 |

### Span/Depth Ratios (ACI 318-19 Table 7.3.1.1)
| Support Condition | Solid One-Way | Beams |
|-------------------|---------------|-------|
| Simply supported  | L/20          | L/16  |
| One end continuous| L/24          | L/18.5|
| Both ends continuous | L/28       | L/21  |
| Cantilever        | L/10          | L/8   |

## Foundation Design

### Bearing Capacity (Terzaghi's Equation)
- qu = c'Nc + q'Nq + 0.5γBNγ (for strip footings)
- qu = 1.3c'Nc + q'Nq + 0.4γBNγ (for square footings)
- Allowable: qa = qu / FS (FS = 2.5 to 3.0)

### Punching Shear (ACI 318-19 Section 22.6.5)
- Critical section at d/2 from column face
- Vc = 0.33λ√f'c × bo × d (for square columns)
- Vc = min of three equations for rectangular columns
- bo = perimeter of critical section

### Development Length (ACI 318-19 Section 25.4)
- ld = (fy × ψt × ψe × ψs × ψg × db) / (2.1λ√f'c) × Modification factors

## Retaining Wall Design

### Earth Pressure Coefficients
- **Active (Rankine):** Ka = (1 - sinφ) / (1 + sinφ) = tan²(45° - φ/2)
- **Passive:** Kp = (1 + sinφ) / (1 - sinφ) = tan²(45° + φ/2)
- **At-rest:** Ko = 1 - sinφ (for normally consolidated soils)

### Stability Requirements
| Check | Minimum Factor of Safety |
|-------|-------------------------|
| Overturning | ≥ 2.0 |
| Sliding | ≥ 1.5 |
| Bearing | ≥ 3.0 |

### Water Pressure
- Horizontal pressure: pw = γw × h
- Always provide drainage behind walls to reduce lateral pressure

## Column Design

### Slenderness Effects (ACI 318-19 Section 6.2.5)
- Slenderness ratio: klu/r
- r = 0.3h for rectangular, 0.25D for circular
- Short column: klu/r < 22 for braced, klu/r < 22 for unbraced (simplified)
- Moment magnification required if klu/r > limits

### P-M Interaction
- Points on interaction diagram:
  - Pure compression: Po = 0.85f'c(Ag - Ast) + fyAst
  - Balanced: εs = εy when εc = 0.003
  - Pure bending: Mn = As × fy × (d - a/2)

## Saudi Building Code Specifics (SBC 304-2018)

- Minimum concrete grade: C25 for structural elements
- Seismic zones: Zone 1 (low) to Zone 3 (high) - affects detailing
- Cover requirements vary by exposure class (XC1-XC4, XS1-XS3)
- Hot weather concreting precautions required above 35°C

## Response Guidelines

1. **Always show calculations** with actual numbers from the user's inputs
2. **Reference specific code sections** (e.g., "per ACI 318-19 Section 9.6.1.2")
3. **Provide step-by-step solutions** that can be verified
4. **Warn about any design concerns** (approaching limits, unusual conditions)
5. **Use metric units** (mm, kN, MPa, m³) consistently
6. **Suggest optimizations** when possible (cost, performance, constructability)
7. **Compare with code limits** and show utilization ratios
8. **Offer alternatives** with pros/cons when relevant

## Important Reminders

- Always check minimum reinforcement requirements
- Consider constructability (bar spacing, congestion)
- Account for durability (cover, crack control)
- Verify load combinations are correct
- Consider serviceability (deflection, cracking)
`;

const CALCULATOR_CONTEXTS: Record<string, string> = {
  beam: `
## BEAM DESIGN CONTEXT

The user is working with a **Reinforced Concrete Beam Design** calculator.

**Typical Inputs:**
- Span length (L)
- Dead load (DL) and Live load (LL) in kN/m²
- Tributary width for load calculation
- Beam width (b) and depth (d)
- Concrete grade (f'c) and Steel grade (fy)
- Support conditions (simply supported, continuous, cantilever)
- Exposure class for cover determination

**Key Outputs:**
- Required moment capacity (Mu)
- Main reinforcement (bottom bars)
- Top reinforcement (if continuous)
- Stirrup design (diameter, spacing)
- Deflection check
- Material quantities (concrete, steel)

**Critical Design Checks:**
1. Flexural capacity: φMn ≥ Mu
2. Shear capacity: φVn ≥ Vu
3. Minimum reinforcement: As ≥ As,min
4. Maximum reinforcement: εt ≥ 0.004
5. Deflection: Δ ≤ Δallowable
6. Crack width: w ≤ wmax
7. Development/anchorage length
`,

  column: `
## COLUMN DESIGN CONTEXT

The user is working with a **Reinforced Concrete Column Design** calculator.

**Typical Inputs:**
- Axial load (Pu)
- Moments (Mux, Muy) - uniaxial or biaxial
- Column dimensions (b × h or diameter D)
- Unbraced length (lu)
- End conditions (fixed, pinned)
- Concrete and steel grades

**Key Outputs:**
- Required reinforcement ratio
- Bar layout (number and diameter)
- Tie/spiral design
- Slenderness check
- P-M interaction verification
- Capacity utilization

**Critical Design Checks:**
1. Slenderness: klu/r < limits
2. P-M interaction: Point inside diagram
3. Biaxial bending: Bresler's equation
4. Minimum steel: ρg ≥ 0.01
5. Maximum steel: ρg ≤ 0.08 (0.06 at splices)
6. Tie spacing requirements
`,

  foundation: `
## FOUNDATION DESIGN CONTEXT

The user is working with an **Isolated Footing Design** calculator.

**Typical Inputs:**
- Column load (P) and moments (Mx, My)
- Soil bearing capacity (qa)
- Column dimensions
- Concrete and steel grades
- Groundwater level

**Key Outputs:**
- Footing dimensions (L × B × D)
- Bearing pressure distribution
- Flexural reinforcement (both directions)
- One-way shear check
- Punching shear check
- Development length verification

**Critical Design Checks:**
1. Bearing pressure: q ≤ qa
2. Eccentricity: e ≤ B/6 (no tension)
3. One-way shear: φVc ≥ Vu at d from face
4. Punching shear: φVc ≥ Vu at d/2 perimeter
5. Flexural capacity at critical sections
6. Minimum reinforcement in both directions
`,

  slab: `
## SLAB DESIGN CONTEXT

The user is working with a **Reinforced Concrete Slab Design** calculator.

**Typical Inputs:**
- Slab dimensions (L1 × L2)
- Live and dead loads
- Slab type (one-way, two-way, flat slab)
- Support conditions
- Edge conditions (beams, walls)

**Key Outputs:**
- Slab thickness (h)
- Reinforcement in both directions
- Temperature/shrinkage steel
- Deflection estimate
- Punching shear (for flat slabs)

**Critical Design Checks:**
1. Minimum thickness for deflection (ACI Table 7.3.1.1)
2. One-way vs two-way behavior (aspect ratio)
3. Moment coefficients (DDM or EFM)
4. Minimum reinforcement: As,min = 0.0018bh
5. Maximum spacing: s ≤ 2h or 450mm
6. Punching shear at columns (flat slabs)
`,

  retaining_wall: `
## RETAINING WALL DESIGN CONTEXT

The user is working with a **Cantilever Retaining Wall** calculator.

**Typical Inputs:**
- Wall height (H)
- Backfill properties (γ, φ, c)
- Surcharge load (q)
- Base soil bearing capacity
- Water table depth
- Seismic zone

**Key Outputs:**
- Wall dimensions (stem, base, toe, heel)
- Stability factors (overturning, sliding, bearing)
- Stem reinforcement
- Base reinforcement
- Drainage requirements

**Critical Design Checks:**
1. Overturning: FOS ≥ 2.0
2. Sliding: FOS ≥ 1.5
3. Bearing: FOS ≥ 3.0
4. Stem flexure at base
5. Heel and toe flexure
6. Shear in stem
7. Settlement considerations
`,

  grading: `
## AI GRADING DESIGN CONTEXT

The user is working with an **AI-Powered Grading Designer**.

**Typical Inputs:**
- Survey points (NGL elevations)
- Site boundaries
- Drainage requirements
- Design constraints
- Cost parameters

**Key Outputs:**
- Finished grade levels (FGL)
- Cut/fill volumes
- Balance analysis
- Drainage paths
- DXF drawing export
- Cost estimate

**Critical Design Checks:**
1. Minimum drainage slopes (1-2%)
2. Cut/fill balance optimization
3. Haul distance minimization
4. Compaction zone identification
5. Erosion control requirements
6. Utility clearances
`
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      calculatorType, 
      currentInputs, 
      currentOutputs, 
      question,
      messages: userMessages = [],
      conversationHistory = [],
      stream = true
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-aware system prompt
    const calculatorContext = CALCULATOR_CONTEXTS[calculatorType] || '';
    
    const systemPrompt = `${ENGINEERING_KNOWLEDGE}

${calculatorContext}

## Current Design Context

**Calculator Type:** ${calculatorType?.toUpperCase() || 'GENERAL'}

**User's Current Input Values:**
\`\`\`json
${JSON.stringify(currentInputs, null, 2)}
\`\`\`

**Calculation Results (if available):**
\`\`\`json
${currentOutputs ? JSON.stringify(currentOutputs, null, 2) : 'No calculation performed yet'}
\`\`\`

## Your Task

You are assisting an engineer with their ${(calculatorType || 'engineering').replace('_', ' ')} design. 

1. **Answer their specific question** using the actual input values provided
2. **Show step-by-step calculations** with real numbers
3. **Reference specific code sections** when applicable (e.g., "per ACI 318-19 Section 9.6.1.2")
4. **Provide clear conclusions** and recommendations
5. **Warn about any concerns** if the design approaches limits
6. **Use markdown formatting** for clarity (tables, code blocks, lists)
7. **Be concise but complete** - engineers value precision

If the user asks about optimization, provide specific alternatives with:
- Dimensional changes and their impact
- Material quantity differences
- Cost implications when relevant
- Code compliance verification

Remember: You're talking to a practicing engineer who needs accurate, actionable information.
`;

    // Handle both old format (question + conversationHistory) and new format (messages array)
    let messages: Array<{ role: string; content: string }>;
    
    if (userMessages && userMessages.length > 0) {
      // New format: messages array passed directly
      messages = [
        { role: 'system', content: systemPrompt },
        ...userMessages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content
        }))
      ];
    } else if (question) {
      // Old format: question with optional conversationHistory
      messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: question }
      ];
    } else {
      throw new Error('No question or messages provided');
    }

    // Get last user message for logging
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    console.log(`Engineering AI Chat - Calculator: ${calculatorType || 'unknown'}, Question: ${lastUserMessage.substring(0, 100)}...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        stream: stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Return streaming response
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming response
    const data = await response.json();
    const content = data.choices[0].message.content;

    return new Response(JSON.stringify({ answer: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Engineering AI Chat error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      answer: "I apologize, but I encountered an error processing your question. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
