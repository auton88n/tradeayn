import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("calculate-retaining-wall - valid cantilever wall 3m height", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-retaining-wall`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      wallHeight: 3.0,
      stemThicknessTop: 250,
      stemThicknessBottom: 350,
      baseWidth: 2200,
      baseThickness: 400,
      toeWidth: 600,
      soilUnitWeight: 18,
      soilFrictionAngle: 30,
      surchargeLoad: 10,
      concreteGrade: "C30",
      steelGrade: "Fy420",
      waterTableDepth: 5,
      backfillSlope: 0,
      allowableBearingPressure: 150
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.overturningFS);
  assertExists(data.slidingFS);
  assertExists(data.bearingFS);
  
  // Stability checks - FS should be greater than minimum
  assertEquals(data.overturningFS >= 1.5, true, "Overturning FS should be >= 1.5");
  assertEquals(data.slidingFS >= 1.2, true, "Sliding FS should be >= 1.2");
});

Deno.test("calculate-retaining-wall - gravity wall 2.5m height", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-retaining-wall`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      wallHeight: 2.5,
      stemThicknessTop: 300,
      stemThicknessBottom: 400,
      baseWidth: 1800,
      baseThickness: 350,
      toeWidth: 500,
      soilUnitWeight: 19,
      soilFrictionAngle: 32,
      surchargeLoad: 5,
      concreteGrade: "C25",
      steelGrade: "Fy420",
      waterTableDepth: 4,
      backfillSlope: 0,
      allowableBearingPressure: 150
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.overturningFS);
  assertExists(data.slidingFS);
  assertExists(data.concreteVolume);
});

Deno.test("calculate-retaining-wall - high wall 5m with surcharge", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-retaining-wall`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      wallHeight: 5.0,
      stemThicknessTop: 300,
      stemThicknessBottom: 500,
      baseWidth: 3500,
      baseThickness: 500,
      toeWidth: 800,
      soilUnitWeight: 18,
      soilFrictionAngle: 28,
      surchargeLoad: 15,
      concreteGrade: "C35",
      steelGrade: "Fy500",
      waterTableDepth: 6,
      backfillSlope: 0,
      allowableBearingPressure: 200
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.stemReinforcement);
  assertExists(data.earthPressure);
});

Deno.test("calculate-retaining-wall - reinforcement details", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-retaining-wall`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      wallHeight: 4.0,
      stemThicknessTop: 250,
      stemThicknessBottom: 450,
      baseWidth: 2800,
      baseThickness: 450,
      toeWidth: 700,
      soilUnitWeight: 18,
      soilFrictionAngle: 30,
      surchargeLoad: 10,
      concreteGrade: "C30",
      steelGrade: "Fy420",
      waterTableDepth: 5,
      backfillSlope: 0,
      allowableBearingPressure: 175
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.stemReinforcement);
  assertExists(data.heelReinforcement);
  assertExists(data.toeReinforcement);
});

Deno.test("calculate-retaining-wall - CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-retaining-wall`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(response.status, 200);
  await response.text();
});
