import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || "https://dfkoxuokfkttjhfjcecx.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/calculate-beam`;

Deno.test("calculate-beam returns valid results for standard input", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      span: 6,
      deadLoad: 15,
      liveLoad: 10,
      beamWidth: 300,
      concreteGrade: "C30",
      steelGrade: "Fy420",
      supportType: "simply_supported"
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  // Verify we got a successful response with beam data
  assert(Object.keys(data).length > 0, "Response should contain beam calculation data");
  assert(data.maxMoment !== undefined || data.beamDepth !== undefined || data.effectiveDepth !== undefined, 
    "Response should contain at least one beam calculation field");
});

Deno.test("calculate-beam handles cantilever support type", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      span: 3,
      deadLoad: 20,
      liveLoad: 15,
      beamWidth: 350,
      concreteGrade: "C25",
      steelGrade: "Fy420",
      supportType: "cantilever"
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertExists(data.beamDepth);
  // Cantilever should have higher moment for same span
  assert(data.maxMoment > 0, "Max moment should be positive");
});

Deno.test("calculate-beam handles continuous beam", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      span: 8,
      deadLoad: 25,
      liveLoad: 20,
      beamWidth: 400,
      concreteGrade: "C35",
      steelGrade: "Fy500",
      supportType: "continuous"
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertExists(data.beamDepth);
  assertExists(data.stirrupSpacing);
});

Deno.test("calculate-beam returns material quantities", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      span: 5,
      deadLoad: 18,
      liveLoad: 12,
      beamWidth: 300,
      concreteGrade: "C30",
      steelGrade: "Fy420",
      supportType: "simply_supported"
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertExists(data.concreteVolume);
  assertExists(data.steelWeight);
  assert(data.concreteVolume > 0, "Concrete volume should be positive");
  assert(data.steelWeight > 0, "Steel weight should be positive");
});

Deno.test("calculate-beam handles CORS preflight", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  // Consume the response body
  await response.text();
  
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});
