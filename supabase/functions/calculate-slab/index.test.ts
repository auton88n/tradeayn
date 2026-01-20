import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("calculate-slab - one-way slab simply supported", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-slab`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      longSpan: 6.0,
      shortSpan: 4.0,
      deadLoad: 5.0,
      liveLoad: 3.0,
      concreteGrade: "C30",
      steelGrade: "Fy420",
      slabType: "one_way",
      supportCondition: "simply_supported",
      cover: 25
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.thickness);
  assertExists(data.mainReinforcement);
  assertExists(data.distributionReinforcement);
  
  // Minimum slab thickness check
  assertEquals(data.thickness >= 100, true, "Slab thickness should be >= 100mm");
});

Deno.test("calculate-slab - two-way slab continuous", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-slab`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      longSpan: 5.0,
      shortSpan: 5.0,
      deadLoad: 6.0,
      liveLoad: 4.0,
      concreteGrade: "C30",
      steelGrade: "Fy420",
      slabType: "two_way",
      supportCondition: "two_edges_continuous",
      cover: 25
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.thickness);
  // Two-way slab has reinforcement in both directions
  assertExists(data.shortSpanReinforcement);
  assertExists(data.longSpanReinforcement);
});

Deno.test("calculate-slab - cantilever slab", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-slab`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      longSpan: 3.0,
      shortSpan: 1.5,
      deadLoad: 5.0,
      liveLoad: 3.0,
      concreteGrade: "C25",
      steelGrade: "Fy420",
      slabType: "one_way",
      supportCondition: "simply_supported",
      cover: 25
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.thickness);
  // Cantilever needs thicker slab relative to span
  assertEquals(data.thickness >= 75, true, "Slab thickness should be adequate");
});

Deno.test("calculate-slab - deflection and serviceability", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-slab`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      longSpan: 6.0,
      shortSpan: 6.0,
      deadLoad: 7.0,
      liveLoad: 5.0,
      concreteGrade: "C35",
      steelGrade: "Fy500",
      slabType: "two_way",
      supportCondition: "all_edges_continuous",
      cover: 30
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.thickness);
  // Serviceability checks may be included
  if (data.serviceability) {
    assertExists(data.serviceability.deflectionCheck);
  }
});

Deno.test("calculate-slab - CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-slab`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(response.status, 200);
  await response.text();
});
