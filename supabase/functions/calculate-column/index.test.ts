import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || "https://dfkoxuokfkttjhfjcecx.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/calculate-column`;

Deno.test("calculate-column returns valid results for tied column", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      width: 400,
      depth: 400,
      height: 3000,
      axialLoad: 1500,
      momentX: 80,
      momentY: 60,
      concreteGrade: "C30",
      steelGrade: "Fy420",
      columnType: "tied",
      cover: 40,
      effectiveLengthFactorX: 1.0,
      effectiveLengthFactorY: 1.0
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertExists(data.AsRequired);
  assertExists(data.barDiameter);
  assertExists(data.numberOfBars);
  assert(data.AsRequired > 0, "Required steel area should be positive");
});

Deno.test("calculate-column handles spiral column", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      width: 500,
      depth: 500,
      height: 4000,
      axialLoad: 2500,
      momentX: 120,
      momentY: 100,
      concreteGrade: "C35",
      steelGrade: "Fy500",
      columnType: "spiral",
      cover: 50,
      effectiveLengthFactorX: 0.85,
      effectiveLengthFactorY: 0.85
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertExists(data.isAdequate);
  assertExists(data.utilizationRatio);
});

Deno.test("calculate-column checks slenderness", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      width: 300,
      depth: 300,
      height: 6000, // Tall column
      axialLoad: 800,
      momentX: 50,
      momentY: 50,
      concreteGrade: "C25",
      steelGrade: "Fy420",
      columnType: "tied",
      cover: 40,
      effectiveLengthFactorX: 1.0,
      effectiveLengthFactorY: 1.0
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertExists(data.slendernessX);
  assertExists(data.slendernessY);
});

Deno.test("calculate-column returns tie design", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      width: 450,
      depth: 450,
      height: 3500,
      axialLoad: 2000,
      momentX: 100,
      momentY: 80,
      concreteGrade: "C30",
      steelGrade: "Fy420",
      columnType: "tied",
      cover: 40,
      effectiveLengthFactorX: 1.0,
      effectiveLengthFactorY: 1.0
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertExists(data.tieDiameter);
  assertExists(data.tieSpacing);
  assert(data.tieSpacing > 0, "Tie spacing should be positive");
});

Deno.test("calculate-column handles CORS preflight", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  await response.text();
  
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});
