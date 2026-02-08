

# Origin Validation for Sensitive Edge Functions

## Overview

Add an origin validation guard to sensitive state-changing edge functions as a defense-in-depth measure against CSRF. While the current risk is low (custom headers like `apikey` and `Authorization` are not auto-sent by browsers), locking down `Access-Control-Allow-Origin: *` on privileged endpoints is good practice.

## Important: Which Functions to Protect

Not all listed functions should get origin validation:

- **`approve-access`** and **`approve-pin-change`** are GET-based endpoints triggered by clicking email links. They authenticate via cryptographic tokens in the URL, not browser auth. Adding origin validation would **break** them. They are excluded.
- **`stripe-webhook`** is called by Stripe servers, not browsers. Excluded.

Functions that **will** get origin validation (all use POST + JWT auth):

| Function | Operation |
|---|---|
| `delete-account` | Permanently deletes user and all data |
| `set-admin-pin` | Changes admin PIN |
| `verify-admin-pin` | Grants admin panel access |
| `create-checkout` | Creates Stripe checkout session |

## Changes

### 1. New file: `supabase/functions/_shared/originGuard.ts`

A small helper that validates the `Origin` or `Referer` header against a whitelist of allowed origins:

```
ALLOWED_ORIGINS:
  - https://aynn.io
  - https://www.aynn.io
  - https://ayn-insight-forge.lovable.app  (published URL)
  - http://localhost:5173  (dev)
  - http://localhost:8080  (dev)
```

Also allows requests with **no** Origin header (e.g., server-to-server calls, Postman) since those are not browser CSRF. The guard specifically blocks requests where an Origin **is present** but does not match the whitelist -- which is the CSRF scenario.

### 2. Update 4 edge functions

Each gets two lines added after the CORS preflight check:

```typescript
import { validateOrigin } from '../_shared/originGuard.ts';

// After OPTIONS check:
if (!validateOrigin(req)) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized origin' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

Functions updated:
- `supabase/functions/delete-account/index.ts`
- `supabase/functions/set-admin-pin/index.ts`
- `supabase/functions/verify-admin-pin/index.ts`
- `supabase/functions/create-checkout/index.ts`

### 3. Update CORS headers on these 4 functions

Change `Access-Control-Allow-Origin` from `*` to the request's origin (if allowed), strengthening the browser-level CORS protection:

```typescript
const origin = req.headers.get('Origin') || '';
const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## What is NOT changed

- `approve-access` -- email link, token-based auth, no browser session involved
- `approve-pin-change` -- same as above
- `stripe-webhook` -- called by Stripe servers, validates webhook signature
- AI edge functions -- already protected by required custom headers
- No client-side changes needed (the browser already sends Origin automatically)

