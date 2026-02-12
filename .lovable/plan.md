
# Replace All Lovable Project URLs with aynn.io

## Summary
9 files still reference `ayn-insight-forge.lovable.app` instead of `aynn.io`. All occurrences will be updated to use the production domain.

## Changes

### 1. `supabase/functions/create-checkout/index.ts` (line 65)
Replace fallback origin from `https://ayn-insight-forge.lovable.app` to `https://aynn.io`

### 2. `supabase/functions/customer-portal/index.ts` (line 52)
Replace fallback origin from `https://ayn-insight-forge.lovable.app` to `https://aynn.io`

### 3. `supabase/functions/_shared/originGuard.ts` (line 4)
Keep `ayn-insight-forge.lovable.app` in the ALLOWED_ORIGINS list (it should remain as an allowed origin for backward compatibility), but ensure `aynn.io` is the primary/first entry (already is).

### 4. `supabase/functions/ai-visual-tester/index.ts` (line 407)
Replace default `siteUrl` from `https://ayn-insight-forge.lovable.app` to `https://aynn.io`

### 5. `supabase/functions/ai-website-crawler/index.ts` (line 58)
Replace default `SITE_URL` from `https://ayn-insight-forge.lovable.app` to `https://aynn.io`

### 6. `supabase/functions/ayn-marketing-webhook/index.ts` (line 470)
Replace health check URL from `https://ayn-insight-forge.lovable.app` to `https://aynn.io`

### 7. `supabase/functions/ayn-marketing-proactive-loop/index.ts` (line 223)
Replace site URL from `https://ayn-insight-forge.lovable.app` to `https://aynn.io`

### 8. `e2e/playwright.config.ts` (line 23)
Replace `baseURL` from `https://ayn-insight-forge.lovable.app` to `https://aynn.io`

### 9. `e2e/tests/stress/stress-tests.spec.ts` (lines 12, 29, 36, 50)
Replace all 4 hardcoded URLs from `https://ayn-insight-forge.lovable.app` to `https://aynn.io`

### Deployment
Redeploy all affected edge functions: `create-checkout`, `customer-portal`, `ai-visual-tester`, `ai-website-crawler`, `ayn-marketing-webhook`, `ayn-marketing-proactive-loop`

## Note
The `originGuard.ts` file will keep `ayn-insight-forge.lovable.app` in its allowed origins list so that the Lovable preview still works during development. No functional URLs or fallbacks will use it though.
