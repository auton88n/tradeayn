import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Engineering Knowledge Base for System Prompt
const ENGINEERING_KNOWLEDGE = `
You are an expert structural and civil engineer AI assistant with deep knowledge of:
- ACI 318-19 (American Concrete Institute)
- Eurocode 2 (EN 1992-1-1)
- Saudi Building Code (SBC 304-2018)

## Concrete Design Knowledge

### Material Properties
| Grade | fck (MPa) | fcd (MPa) | fctm (MPa) | Ecm (GPa) |
|-------|-----------|-----------|------------|-----------|
| C25   | 25        | 16.67     | 2.56       | 31        |
| C30   | 30        | 20.00     | 2.90       | 33        |
| C35   | 35        | 23.33     | 3.21       | 34        |
| C40   | 40        | 26.67     | 3.51       | 35        |

### Steel Properties
| Grade  | fy (MPa) | Es (GPa) | εy      |
|--------|----------|----------|---------|
| Fy420  | 420      | 200      | 0.0021  |
| Fy500  | 500      | 200      | 0.0025  |

### Key Formulas

**Flexural Design:**
- Required steel: As = Mu / (0.87 × fy × z)
- Lever arm: z = d × (1 - 0.416 × xu/d), or approximate z ≈ 0.9d
- Neutral axis: xu = 0.87 × fy × As / (0.36 × fck × b)
- Moment capacity: Mu = 0.87 × fy × As × (d - 0.42×xu)

**Shear Design:**
- Concrete shear: Vc = 0.17 × √fck × bw × d (N)
- Stirrup design: Vs = (0.87 × fy × Asv × d) / s

**Reinforcement Limits:**
- Minimum: As,min = max(0.26 × fctm/fyk × bt × d, 0.0013 × bt × d)
- Maximum: As,max = 0.04 × Ac

**Deflection:**
- Maximum: L/250 (total), L/500 (after partitions)
- Span/depth ratios: Simply supported = 20, Continuous = 26, Cantilever = 8

### Bar Areas (mm²)
| Ø8 | Ø10 | Ø12 | Ø16 | Ø20 | Ø25 | Ø32 |
|----|-----|-----|-----|-----|-----|-----|
| 50 | 79  | 113 | 201 | 314 | 491 | 804 |

### Foundation Design
- Bearing capacity: qa = qu / FS (FS = 2.5 to 3.0)
- Punching shear: check at d/2 from column face
- Minimum depth: 300mm for isolated footings

### Retaining Wall Design
- Active pressure: Ka = (1 - sinφ) / (1 + sinφ)
- Passive pressure: Kp = (1 + sinφ) / (1 - sinφ)
- Overturning FS ≥ 2.0, Sliding FS ≥ 1.5, Bearing FS ≥ 3.0

### Load Factors (ACI/SBC)
- Dead load: 1.4D or 1.2D
- Live load: 1.6L
- Combined: 1.2D + 1.6L (typical)

### Saudi Building Code Specifics
- Minimum concrete grade: C25
- Seismic zones: Zone 1 (low) to Zone 3 (high)
- Cover requirements per exposure class (XC1-XC4, XS1)

## Response Guidelines

1. **Always show calculations** with actual numbers when explaining a design
2. **Reference specific code sections** when applicable
3. **Provide alternatives** with cost implications when relevant
4. **Warn about** any design that approaches limits or has concerns
5. **Use metric units** (mm, kN, MPa, m³)
6. **Format formulas clearly** using proper notation
7. **Suggest optimizations** that could save material or improve safety
`;

const CALCULATOR_CONTEXTS: Record<string, string> = {
  beam: `
The user is working with a BEAM DESIGN calculator. Key aspects:
- Inputs: span, dead load, live load, beam width, concrete grade, steel grade, support type
- Outputs: beam dimensions, main reinforcement, stirrup design, material quantities
- Focus on flexural design, shear design, and deflection control
`,
  column: `
The user is working with a COLUMN DESIGN calculator. Key aspects:
- Inputs: axial load, moments (Mx, My), column dimensions, concrete/steel grades
- Outputs: reinforcement layout, capacity check, slenderness analysis
- Focus on biaxial bending, slenderness effects, and buckling
`,
  foundation: `
The user is working with a FOUNDATION DESIGN calculator. Key aspects:
- Inputs: column load, moments, soil bearing capacity, foundation type
- Outputs: foundation dimensions, reinforcement, bearing pressure check
- Focus on bearing capacity, punching shear, and flexural design
`,
  slab: `
The user is working with a SLAB DESIGN calculator. Key aspects:
- Inputs: span, loads, slab type (one-way/two-way), support conditions
- Outputs: slab thickness, reinforcement in both directions
- Focus on flexure, deflection, and crack control
`,
  retaining_wall: `
The user is working with a RETAINING WALL calculator. Key aspects:
- Inputs: wall height, soil properties, backfill angle, surcharge
- Outputs: wall dimensions, reinforcement, stability factors
- Focus on overturning, sliding, bearing, and structural design
`,
  grading: `
The user is working with an AI GRADING DESIGNER. Key aspects:
- Inputs: survey points, terrain analysis, design requirements
- Outputs: finished ground levels, cut/fill volumes, earthwork costs
- Focus on drainage, slopes, earthwork balance, and cost optimization
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
      conversationHistory = []
    } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Build context-aware system prompt
    const calculatorContext = CALCULATOR_CONTEXTS[calculatorType] || '';
    
    const systemPrompt = `${ENGINEERING_KNOWLEDGE}

${calculatorContext}

## Current Design Context

**Calculator Type:** ${calculatorType}

**Current Inputs:**
${JSON.stringify(currentInputs, null, 2)}

**Current Outputs/Results:**
${currentOutputs ? JSON.stringify(currentOutputs, null, 2) : 'No calculation performed yet'}

## Instructions

1. Answer the user's question specifically about THIS design
2. Use the actual input values in your calculations
3. Show step-by-step calculations when explaining
4. Reference the specific code sections (ACI 318-19, SBC 304-2018)
5. Provide structured responses with formulas when appropriate
6. Suggest 2-3 follow-up questions the user might want to ask

Format your response as JSON with this structure:
{
  "answer": "Your detailed explanation here",
  "formula": {
    "name": "Formula name",
    "expression": "The formula",
    "variables": { "var1": { "value": 123, "unit": "mm" } }
  },
  "calculation": {
    "steps": ["Step 1...", "Step 2..."],
    "result": 123.45,
    "unit": "mm²"
  },
  "codeReference": {
    "standard": "ACI 318-19",
    "section": "9.5.2.1",
    "requirement": "What the code says"
  },
  "alternatives": [
    {
      "description": "Alternative approach",
      "costImpact": 500,
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1"]
    }
  ],
  "warning": "Any warnings about the design (optional)",
  "quickReplies": ["Follow-up question 1?", "Follow-up question 2?"]
}

If the question is simple, you can omit the optional fields. Always include "answer" and "quickReplies".
`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: question }
    ];

    console.log(`Engineering AI Assistant - Calculator: ${calculatorType}, Question: ${question.substring(0, 100)}...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Try to parse as JSON, fallback to plain text
    let structuredResponse;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content;
      structuredResponse = JSON.parse(jsonString);
    } catch {
      // If not valid JSON, create a simple response
      structuredResponse = {
        answer: content,
        quickReplies: [
          "Can you explain the calculation steps?",
          "Are there any code requirements I should know?",
          "How can I optimize this design?"
        ]
      };
    }

    console.log('Engineering AI response generated successfully');

    return new Response(JSON.stringify(structuredResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Engineering AI Assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      answer: "I apologize, but I encountered an error processing your question. Please try again.",
      quickReplies: ["What formulas are used?", "Explain the design approach"]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
