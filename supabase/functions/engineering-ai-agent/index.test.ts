import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("engineering-ai-agent - basic design request", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      question: "Design a beam for a 5m span with 20kN/m dead load",
      calculatorType: "beam",
      currentInputs: {},
      currentOutputs: null,
      conversationHistory: []
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  assertExists(data.answer);
});

Deno.test("engineering-ai-agent - tool action detection", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      question: "Set the span to 8 meters and calculate",
      calculatorType: "beam",
      currentInputs: { span: 6, deadLoad: 15 },
      currentOutputs: null,
      conversationHistory: []
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  assertExists(data.answer);
  // Agent may return actions array
  if (data.actions) {
    assertEquals(Array.isArray(data.actions), true);
  }
});

Deno.test("engineering-ai-agent - CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-agent`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(response.status, 200);
  await response.text();
});
