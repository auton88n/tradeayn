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
      description: "Set a calculator input field to a specific value.",
      parameters: {
        type: "object",
        properties: {
          field: { type: "string", description: "The input field name" },
          value: { type: "string", description: "The value to set" }
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
          inputs: { type: "object", description: "Object with field names as keys and values to set", additionalProperties: true }
        },
        required: ["inputs"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Trigger the calculation with current inputs.",
      parameters: { type: "object", properties: {}, required: [] }
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
          calculator: { type: "string", enum: ["beam", "column", "foundation", "slab", "retaining_wall", "parking"], description: "The calculator type" }
        },
        required: ["calculator"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_design",
      description: "Save the current design to the user's portfolio.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name for the saved design" },
          notes: { type: "string", description: "Optional notes" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "export_file",
      description: "Export the current design as a file (DXF or PDF).",
      parameters: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["dxf", "pdf"], description: "Export format" }
        },
        required: ["format"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_designs",
      description: "Compare current design with an alternative.",
      parameters: {
        type: "object",
        properties: {
          alternative_inputs: { type: "object", description: "Modified inputs for comparison", additionalProperties: true }
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
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "show_history",
      description: "Open the calculation history panel.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "explain_calculation",
      description: "Provide detailed explanation of current calculation results including formulas used.",
      parameters: {
        type: "object",
        properties: {
          focus: { type: "string", description: "Specific aspect to explain (e.g., 'reinforcement', 'safety_factor', 'cost')" }
        },
        required: []
      }
    }
  }
];

// Enhanced system prompt with full context awareness
const getSystemPrompt = (
  calculatorType: string | null, 
  currentInputs: Record<string, any>, 
  currentOutputs: Record<string, any> | null,
  allCalculatorStates: Record<string, any>,
  recentActions: any[],
  sessionInfo: any
) => {
  const inputsStr = Object.keys(currentInputs).length > 0 ? JSON.stringify(currentInputs, null, 2) : "No inputs set";
  const outputsStr = currentOutputs ? JSON.stringify(currentOutputs, null, 2) : "No results yet";
  
  const allStatesStr = Object.entries(allCalculatorStates)
    .map(([calc, state]: [string, any]) => {
      if (!state.inputs || Object.keys(state.inputs).length === 0) return null;
      return `- ${calc}: ${JSON.stringify(state.inputs)}${state.outputs ? ' → Calculated' : ''}`;
    })
    .filter(Boolean)
    .join('\n') || "No previous calculator data";

  const actionsStr = recentActions.slice(-10).map((a: any) => 
    `[${new Date(a.timestamp).toLocaleTimeString()}] ${a.type}${a.calculator ? ` (${a.calculator})` : ''}: ${JSON.stringify(a.details)}`
  ).join('\n') || "No recent actions";

  return `You are AYN, an expert Civil/Structural Engineer AI with FULL CONTROL over the engineering workspace.
You can SEE everything the user does and CONTROL all calculators directly.

## CURRENT CONTEXT
**Active Calculator**: ${calculatorType || 'None'}
**Current Inputs**: ${inputsStr}
**Current Results**: ${outputsStr}

## ALL CALCULATOR STATES (What you remember)
${allStatesStr}

## RECENT USER ACTIONS (What you've observed)
${actionsStr}

## SESSION INFO
- Duration: ${sessionInfo?.sessionDuration || 0} seconds
- Calculators Used: ${sessionInfo?.calculatorsUsed?.join(', ') || 'None'}
- Calculations Run: ${sessionInfo?.calculationsRun || 0}

## YOUR POWERS
1. **set_input/set_multiple_inputs** - Modify any calculator field
2. **calculate** - Run calculations
3. **switch_calculator** - Change between beam, column, foundation, slab, retaining_wall, parking
4. **save_design** - Save to portfolio
5. **export_file** - Generate DXF/PDF
6. **compare_designs** - Compare alternatives
7. **explain_calculation** - Explain results in detail

## BEHAVIOR
- You SEE what the user does - reference their actions naturally
- Be PROACTIVE - suggest improvements, catch errors, offer alternatives
- Use your memory - "I see you designed a beam earlier with 6m span..."
- Take ACTION - don't just explain, DO the work
- Be SMART - cross-reference between calculators (beam loads → foundation sizing)
- Reference engineering codes: ACI 318, Eurocode 2, Saudi Building Code (SBC)

## EXAMPLE INTELLIGENCE
- "I noticed you've been testing different beam widths. Want me to find the optimal one for cost?"
- "Based on your 6m beam with 20kN/m load, you'll need about 2000kN foundation capacity."
- "Your column seems undersized for the beam reactions - let me recalculate."`;
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
      allCalculatorStates = {},
      recentActions = [],
      sessionInfo = {}
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const conversationMessages = [
      { role: "system", content: getSystemPrompt(calculatorType, currentInputs, currentOutputs, allCalculatorStates, recentActions, sessionInfo) },
      ...messages.slice(-10),
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
        stream: false,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded.", actions: [] }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const toolCalls = message?.tool_calls || [];
    const actions = toolCalls.map((tc: any) => ({
      tool: tc.function.name,
      args: JSON.parse(tc.function.arguments || "{}"),
      id: tc.id
    }));

    return new Response(JSON.stringify({
      answer: message?.content || "",
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
