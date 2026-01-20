import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("generate-dxf - beam cross-section", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-dxf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      type: "beam",
      inputs: {
        span: 6,
        beamWidth: 300
      },
      outputs: {
        beamWidth: 300,
        beamDepth: 500,
        numberOfBars: 4,
        barDiameter: 20
      }
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.dxfContent);
  assertStringIncludes(data.dxfContent, "SECTION");
  assertStringIncludes(data.dxfContent, "ENTITIES");
  assertStringIncludes(data.dxfContent, "EOF");
});

Deno.test("generate-dxf - foundation plan", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-dxf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      type: "foundation",
      inputs: {
        columnWidth: 400,
        columnDepth: 400
      },
      outputs: {
        length: 2.5,
        width: 2.5
      }
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.dxfContent);
  assertStringIncludes(data.dxfContent, "FOUNDATION_OUTLINE");
  assertStringIncludes(data.dxfContent, "COLUMN");
});

Deno.test("generate-dxf - parking layout", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-dxf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      type: "parking",
      inputs: {
        siteLength: 50,
        siteWidth: 30
      },
      outputs: {
        totalSpaces: 25,
        accessibleSpaces: 2,
        evSpaces: 3,
        layout: {
          spaces: [
            { x: 0, y: 0, width: 2.5, length: 5, type: "standard" },
            { x: 2.5, y: 0, width: 2.5, length: 5, type: "accessible" }
          ],
          aisles: [
            { x: 0, y: 5, width: 6, height: 20 }
          ]
        }
      }
    }),
  });

  assertEquals(response.status, 200);
  const data = await response.json();
  
  assertExists(data.dxfContent);
  assertStringIncludes(data.dxfContent, "SITE_BOUNDARY");
  assertStringIncludes(data.dxfContent, "PARKING_SPACE");
});

Deno.test("generate-dxf - CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-dxf`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(response.status, 200);
  await response.text();
});
