import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("engineering-ai-analysis - beam analysis", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      type: "beam",
      inputs: {
        span: 6,
        deadLoad: 15,
        liveLoad: 10,
        beamWidth: 300,
        concreteGrade: "C30"
      },
      outputs: {
        beamWidth: 300,
        beamDepth: 500,
        effectiveDepth: 450,
        providedAs: 1256,
        numberOfBars: 4,
        barDiameter: 20,
        concreteVolume: 0.9,
        steelWeight: 45,
        formworkArea: 7.2
      }
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.compliance);
  assertExists(data.optimizations);
  assertExists(data.costEstimate);
  
  assertEquals(Array.isArray(data.compliance), true);
  assertEquals(Array.isArray(data.optimizations), true);
  assertEquals(Array.isArray(data.costEstimate), true);
});

Deno.test("engineering-ai-analysis - foundation analysis", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      type: "foundation",
      inputs: {
        columnLoad: 800,
        bearingCapacity: 150,
        columnWidth: 400,
        columnDepth: 400
      },
      outputs: {
        length: 2.5,
        width: 2.5,
        depth: 500,
        bearingRatio: 85,
        area: 6.25,
        concreteVolume: 3.125,
        steelWeight: 120
      }
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.compliance);
  assertExists(data.costEstimate);
});

Deno.test("engineering-ai-analysis - CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/engineering-ai-analysis`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(response.status, 200);
  await response.text();
});
