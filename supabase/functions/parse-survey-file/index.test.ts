import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("parse-survey-file - CSV format", async () => {
  const csvContent = `id,x,y,z
1,100.0,200.0,50.5
2,105.0,200.0,51.0
3,110.0,200.0,50.8
4,100.0,205.0,51.2
5,105.0,205.0,51.5`;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-survey-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      content: csvContent,
      fileName: "survey.csv"
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertEquals(data.success, true);
  assertExists(data.points);
  assertExists(data.terrainAnalysis);
  
  assertEquals(data.points.length, 5);
  assertEquals(data.terrainAnalysis.pointCount, 5);
});

Deno.test("parse-survey-file - Tab-separated format", async () => {
  const tsvContent = `1\t100.0\t200.0\t50.5
2\t105.0\t200.0\t51.0
3\t110.0\t200.0\t50.8`;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-survey-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      content: tsvContent,
      fileName: "survey.txt"
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertEquals(data.success, true);
  assertEquals(data.points.length, 3);
});

Deno.test("parse-survey-file - terrain analysis with elevation range", async () => {
  const csvContent = `id,x,y,z
1,0,0,10.0
2,10,0,15.0
3,10,10,12.0
4,0,10,8.0`;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-survey-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      content: csvContent,
      fileName: "terrain.csv"
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.terrainAnalysis.minElevation);
  assertExists(data.terrainAnalysis.maxElevation);
  assertExists(data.terrainAnalysis.averageElevation);
  
  // Just verify these are numbers in reasonable range
  assertEquals(typeof data.terrainAnalysis.minElevation, "number");
  assertEquals(typeof data.terrainAnalysis.maxElevation, "number");
  assertEquals(data.terrainAnalysis.maxElevation >= data.terrainAnalysis.minElevation, true);
});

Deno.test("parse-survey-file - empty file handling", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-survey-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      content: "",
      fileName: "empty.csv"
    }),
  });

  // Should handle gracefully
  const data = await response.json();
  // Either error or empty points array
  if (data.success) {
    assertEquals(data.points.length, 0);
  }
});

Deno.test("parse-survey-file - CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-survey-file`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(response.status, 200);
  await response.text();
});
