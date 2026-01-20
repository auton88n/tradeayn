import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("engineering-ai-chat - beam design question non-streaming", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-chat`, {
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
        beamDepth: 450, 
        maxMoment: 156.6,
        mainReinforcement: "4Ø20"
      },
      question: "Is the beam depth adequate for this span?",
      stream: false
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  assertExists(data.answer);
});

Deno.test("engineering-ai-chat - foundation design question", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      calculatorType: "foundation",
      currentInputs: { 
        columnLoad: 800, 
        bearingCapacity: 150,
        columnWidth: 400,
        columnDepth: 400
      },
      currentOutputs: { 
        length: 2.5, 
        width: 2.5,
        depth: 500
      },
      question: "Is the bearing pressure within limits?",
      stream: false
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  assertExists(data.answer);
});

Deno.test("engineering-ai-chat - column slenderness question", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      calculatorType: "column",
      currentInputs: { 
        columnWidth: 400,
        columnDepth: 400,
        height: 4.0,
        axialLoad: 1200
      },
      currentOutputs: { 
        slendernessRatio: 35,
        requiredSteel: 2400
      },
      question: "Is this column slender? What are the implications?",
      stream: false
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  assertExists(data.answer);
});

Deno.test("engineering-ai-chat - CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-chat`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(response.status, 200);
  await response.text();
});
