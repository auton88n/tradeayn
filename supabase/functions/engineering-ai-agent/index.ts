import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tool definitions for the AI agent
const tools = [
  {
    type: "function",
    function: {
      name: "set_input",
      description: "Set a calculator input field to a specific value. Use this to modify beam width, span, loads, concrete grade, etc.",
      parameters: {
        type: "object",
        properties: {
          field: {
            type: "string",
            description: "The input field name (e.g., 'span', 'width', 'load', 'concreteGrade', 'steelGrade')"
          },
          value: {
            type: "string",
            description: "The value to set (will be converted to appropriate type)"
          }
        },
        required: ["field", "value"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "set_multiple_inputs",
      description: "Set multiple calculator inputs at once. More efficient than calling set_input multiple times.",
      parameters: {
        type: "object",
        properties: {
          inputs: {
            type: "object",
            description: "Object with field names as keys and values to set",
            additionalProperties: true
          }
        },
        required: ["inputs"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Trigger the calculation with current inputs. Call this after setting inputs to see results.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "switch_calculator",
      description: "Switch to a different calculator type.",
      parameters: {
        type: "object",
        properties: {
          calculator: {
            type: "string",
            enum: ["beam", "column", "foundation", "slab", "retaining_wall", "parking"],
            description: "The calculator type to switch to"
          }
        },
        required: ["calculator"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_design",
      description: "Save the current design to the user's portfolio with a name and optional notes.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name for the saved design"
          },
          notes: {
            type: "string",
            description: "Optional notes about the design"
          }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "export_file",
      description: "Export the current design as a file (DXF for CAD or PDF report).",
      parameters: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: ["dxf", "pdf"],
            description: "Export format"
          }
        },
        required: ["format"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_designs",
      description: "Compare current design with an alternative by modifying specific inputs.",
      parameters: {
        type: "object",
        properties: {
          alternative_inputs: {
            type: "object",
            description: "The modified inputs for the alternative design",
            additionalProperties: true
          },
          comparison_note: {
            type: "string",
            description: "What aspect to compare (e.g., 'cost', 'material usage', 'safety factor')"
          }
        },
        required: ["alternative_inputs"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "reset_form",
      description: "Reset all inputs to default values.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "show_history",
      description: "Open the calculation history panel.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];

// System prompt for the engineering AI agent
const getSystemPrompt = (calculatorType: string | null, currentInputs: Record<string, any>, currentOutputs: Record<string, any> | null) => {
  const inputsStr = Object.keys(currentInputs).length > 0 
    ? JSON.stringify(currentInputs, null, 2) 
    : "No inputs set yet";
  
  const outputsStr = currentOutputs 
    ? JSON.stringify(currentOutputs, null, 2) 
    : "No calculation results yet";

  return `You are an expert Civil/Structural Engineer AI assistant integrated into an engineering design studio.
You have FULL CONTROL over the calculation tools and can directly modify inputs, run calculations, and save designs.

## Current Context
- **Active Calculator**: ${calculatorType || 'None selected'}
- **Current Inputs**: 
${inputsStr}
- **Current Results**:
${outputsStr}

## Your Capabilities
You can use tools to:
1. **set_input** / **set_multiple_inputs**: Directly modify calculator fields
2. **calculate**: Run calculations with current inputs
3. **switch_calculator**: Change to a different calculator (beam, column, foundation, slab, retaining_wall, parking)
4. **save_design**: Save designs to portfolio
5. **export_file**: Generate DXF or PDF exports
6. **compare_designs**: Compare current vs alternative designs
7. **reset_form**: Clear all inputs
8. **show_history**: View past calculations

## Behavior Guidelines
1. **Be Proactive**: When user describes a design need, immediately set the inputs and calculate
2. **Be Smart**: Suggest optimizations, check code compliance, warn about issues
3. **Be Efficient**: Use set_multiple_inputs when setting several values
4. **Be Helpful**: Explain what you're doing and why
5. **Be Professional**: Use engineering terminology, reference standards (ACI, Eurocode, Saudi Building Code)

## Field Reference (Common Fields)
- **Beam**: span, width, depth, deadLoad, liveLoad, concreteGrade, steelGrade
- **Column**: width, depth, height, axialLoad, momentX, momentY, concreteGrade
- **Foundation**: columnLoad, momentX, momentY, bearingCapacity, width, length, depth
- **Slab**: spanX, spanY, thickness, deadLoad, liveLoad, slabType
- **Retaining Wall**: wallHeight, backfillAngle, surcharge, soilDensity

## Example Interactions
User: "Design a beam for 6m span with 20 kN/m dead load"
→ Use set_multiple_inputs to set span=6000, deadLoad=20, then call calculate

User: "What if we use 400mm width instead?"
→ Use set_input to change width to 400, then calculate and compare

User: "Save this as Project-A"
→ Use save_design with name "Project-A"

Always respond conversationally while taking action. Never just explain - DO the work!`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      calculatorType, 
      currentInputs, 
      currentOutputs, 
      question, 
      messages = [],
      stream = false 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build conversation history
    const conversationMessages = [
      { role: "system", content: getSystemPrompt(calculatorType, currentInputs, currentOutputs) },
      ...messages.slice(-10), // Keep last 10 messages for context
      { role: "user", content: question }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: conversationMessages,
        tools,
        tool_choice: "auto",
        stream: false, // We need to handle tool calls, so no streaming for now
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please wait a moment and try again.",
          actions: [] 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    // Extract tool calls if any
    const toolCalls = message?.tool_calls || [];
    const actions = toolCalls.map((tc: any) => ({
      tool: tc.function.name,
      args: JSON.parse(tc.function.arguments || "{}"),
      id: tc.id
    }));

    // Get the text response
    const textContent = message?.content || "";

    return new Response(JSON.stringify({
      answer: textContent,
      actions,
      model: data.model,
      usage: data.usage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Engineering AI Agent error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      actions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
