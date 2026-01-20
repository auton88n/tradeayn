import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || "https://dfkoxuokfkttjhfjcecx.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/calculate-foundation`;

Deno.test("calculate-foundation returns valid results", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      columnLoad: 1000,
      momentX: 50,
      momentY: 30,
      columnWidth: 400,
      columnDepth: 400,
      bearingCapacity: 150,
      concreteGrade: "C30"
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertExists(data.length);
  assertExists(data.width);
  assertExists(data.depth);
  assert(data.length > 0, "Foundation length should be positive");
  assert(data.width > 0, "Foundation width should be positive");
  assert(data.depth > 0, "Foundation depth should be positive");
});

Deno.test("calculate-foundation handles high eccentricity", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      columnLoad: 800,
      momentX: 150, // High moment
      momentY: 100,
      columnWidth: 350,
      columnDepth: 350,
      bearingCapacity: 120,
      concreteGrade: "C25"
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertExists(data.length);
  // High moment should result in larger footing
  assert(data.length >= data.width * 0.8, "High eccentricity should result in reasonable dimensions");
});

Deno.test("calculate-foundation returns reinforcement details", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      columnLoad: 1200,
      momentX: 80,
      momentY: 60,
      columnWidth: 450,
      columnDepth: 450,
      bearingCapacity: 180,
      concreteGrade: "C35"
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertExists(data.reinforcementX);
  assertExists(data.reinforcementY);
  assertExists(data.concreteVolume);
  assertExists(data.steelWeight);
});

Deno.test("calculate-foundation respects bearing capacity", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      columnLoad: 2000,
      momentX: 100,
      momentY: 100,
      columnWidth: 500,
      columnDepth: 500,
      bearingCapacity: 100, // Low bearing capacity
      concreteGrade: "C30"
    }),
  });

  const data = await response.json();
  
  assertEquals(response.status, 200);
  // Low bearing capacity should result in larger footing area
  const area = data.length * data.width;
  assert(area >= 20, "Low bearing capacity should result in larger footing");
});

Deno.test("calculate-foundation handles CORS preflight", async () => {
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
