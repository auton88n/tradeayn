

# Consolidate Duplicate REST API Helpers into `supabaseApi`

## Overview

Remove the local `fetchFromSupabase` and `fetchWithRetry` functions duplicated across `useAuth.ts` and `useMessages.ts`, replacing all their calls with the centralized `supabaseApi` from `src/lib/supabaseApi.ts`.

## Current Duplication

There are 3 separate implementations:

| Location | Functions | Differences |
|----------|-----------|-------------|
| `src/lib/supabaseApi.ts` | `supabaseApi.get/post/patch/delete/rpc/fetch` | 15s timeout, AbortController, structured error messages, configurable Prefer header |
| `src/hooks/useAuth.ts` | `fetchFromSupabase`, `fetchWithRetry` | No timeout, retry with 300ms delay, returns null on failure, special POST/upsert handling |
| `src/hooks/useMessages.ts` | `fetchFromSupabase`, `fetchWithRetry` | `fetchWithRetry` wraps raw `fetch()` (not REST API), 1s retry delay, returns Response object (different signature) |

## Changes

### 1. Update `src/lib/supabaseApi.ts` -- Add retry helper

Add a `getWithRetry` convenience method that wraps `supabaseApi.get` with retry logic (matching useAuth's pattern of returning `null` on failure instead of throwing):

```typescript
async getWithRetry<T = unknown>(
  endpoint: string, 
  token: string, 
  retries = 2
): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await this.get<T>(endpoint, token);
    } catch {
      if (attempt === retries) return null;
      await new Promise(r => setTimeout(r, 300));
    }
  }
  return null;
}
```

### 2. Update `src/hooks/useAuth.ts`

- **Remove**: `fetchFromSupabase` (lines 12-39) and `fetchWithRetry` (lines 42-62)
- **Remove**: `SUPABASE_URL` and `SUPABASE_ANON_KEY` imports from `@/config` (no longer needed directly)
- **Remove**: unused `QUERY_TIMEOUT_MS` constant
- **Add**: `import { supabaseApi } from '@/lib/supabaseApi'`
- **Replace** all `fetchFromSupabase(endpoint, token)` calls with `supabaseApi.get(endpoint, token)`
- **Replace** all `fetchWithRetry(endpoint, token)` calls with `supabaseApi.getWithRetry(endpoint, token)`
- **Replace** the raw `fetch()` in `acceptTerms` with `supabaseApi.post()` using a custom `Prefer: resolution=merge-duplicates` header

Affected call sites:
- `checkAccess` (line 81)
- `checkAdminRole` (line 105)
- `loadUserProfile` (line 121)
- `acceptTerms` (lines 138-151) -- uses POST with custom Prefer header
- `runQueries` in useEffect (lines 190-193) -- 4 parallel `fetchWithRetry` calls

### 3. Update `src/hooks/useMessages.ts`

- **Remove**: `fetchFromSupabase` (lines 44-62) -- the GET-only REST helper
- **Remove**: `SUPABASE_ANON_KEY` from `@/config` import (keep `SUPABASE_URL` -- still needed for edge function URLs and inline REST calls that use specific Prefer headers)
- **Add**: `import { supabaseApi } from '@/lib/supabaseApi'`
- **Keep**: `fetchWithRetry` (lines 25-41) -- this one is different, it wraps raw `fetch()` for edge function calls (not REST API), returns a `Response` object for streaming, and handles specific HTTP status codes (429, 402, 403). It cannot be replaced by `supabaseApi`.
- **Replace** `fetchFromSupabase` call at line 150 (`loadMessages`) with `supabaseApi.get()`
- **Replace** `fetchFromSupabase` call at line 709 (usage check) with `supabaseApi.get()`

The following raw `fetch()` calls in `useMessages.ts` stay as-is because they have specialized behavior:
- Line 240: `rpc/increment_usage` -- RPC call (could use `supabaseApi.rpc` but has specific error handling flow)
- Line 371: `fetchWithRetry` for edge function -- returns Response object for streaming
- Lines 623-651: Chat session check/create -- inline REST with specific headers
- Lines 657-694: Message save -- bulk POST with specific payload

### 4. No changes to `src/lib/supabaseApi.ts` API surface

The existing `get`, `post`, `patch`, `delete`, `rpc`, and `fetch` methods remain unchanged. Only the new `getWithRetry` method is added.

## What stays the same

- `useMessages.ts` `fetchWithRetry` (the edge function retry wrapper) -- different purpose, different signature
- All inline `fetch()` calls for edge functions, RPC, and bulk inserts -- these have specialized headers, response handling, or return raw Response objects
- SSE streaming code
- Error handling patterns within each hook

## Files changed

| File | Change |
|------|--------|
| `src/lib/supabaseApi.ts` | Add `getWithRetry` method |
| `src/hooks/useAuth.ts` | Remove local helpers, use `supabaseApi.get` and `supabaseApi.getWithRetry` |
| `src/hooks/useMessages.ts` | Remove local `fetchFromSupabase`, use `supabaseApi.get` for 2 call sites |

