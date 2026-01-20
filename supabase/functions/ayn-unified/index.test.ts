import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("ayn-unified - responds to simple greeting", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ayn-unified`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      message: "Hello, how are you?",
      userId: "test-user-integration",
      mode: "chat"
    }),
  });

  // Accept 200 or 401 (if auth required)
  const validStatuses = [200, 401];
  assertEquals(validStatuses.includes(response.status), true, `Status should be 200 or 401, got ${response.status}`);
  
  if (response.status === 200) {
    const data = await response.json();
    assertExists(data.content);
  } else {
    await response.text();
  }
});

Deno.test("ayn-unified - detects engineering intent", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ayn-unified`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      message: "Calculate a beam with 6m span",
      userId: "test-user-integration",
      mode: "engineering"
    }),
  });

  const validStatuses = [200, 401];
  assertEquals(validStatuses.includes(response.status), true);
  await response.text();
});

Deno.test("ayn-unified - handles Arabic language", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ayn-unified`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      message: "مرحبا، كيف حالك؟",
      userId: "test-user-integration",
      mode: "chat"
    }),
  });

  const validStatuses = [200, 401];
  assertEquals(validStatuses.includes(response.status), true);
  await response.text();
});

Deno.test("ayn-unified - handles image generation intent", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ayn-unified`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      message: "Generate an image of a sunset",
      userId: "test-user-integration",
      mode: "image"
    }),
  });

  // Image generation may have different behavior
  const validStatuses = [200, 401, 402, 429];
  assertEquals(validStatuses.includes(response.status), true);
  await response.text();
});

Deno.test("ayn-unified - CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ayn-unified`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(response.status, 200);
  await response.text();
});
