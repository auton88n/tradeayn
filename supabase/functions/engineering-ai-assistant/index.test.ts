import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("engineering-ai-assistant - beam design question", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      calculatorType: "beam",
      currentInputs: {
        span: 6,
        deadLoad: 15,
        liveLoad: 10,
        beamWidth: 300,
        concreteGrade: "C30"
      },
      currentOutputs: {
        beamDepth: 500,
        maxMoment: 156.6,
        requiredAs: 1200
      },
      question: "What is the span-to-depth ratio and is it acceptable?",
      conversationHistory: []
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.answer);
  assertExists(data.quickReplies);
  assertEquals(Array.isArray(data.quickReplies), true);
});

Deno.test("engineering-ai-assistant - code reference question", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      calculatorType: "foundation",
      currentInputs: {
        columnLoad: 800,
        bearingCapacity: 150
      },
      currentOutputs: {
        length: 2.5,
        width: 2.5
      },
      question: "What code section covers punching shear for footings?",
      conversationHistory: []
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.answer);
});

Deno.test("engineering-ai-assistant - CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-assistant`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(response.status, 200);
  await response.text();
});
