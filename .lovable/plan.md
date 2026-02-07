
# Centralize Supabase Credentials

## Problem

The Supabase URL and anon key are copy-pasted across **8 files** in `src/`:

1. `src/integrations/supabase/client.ts`
2. `src/lib/supabaseApi.ts`
3. `src/hooks/useAuth.ts`
4. `src/hooks/useMessages.ts`
5. `src/components/AdminPanel.tsx`
6. `src/components/admin/AdminAIAssistant.tsx` (URL only)
7. `src/components/admin/TestResultsDashboard.tsx` (URL only)
8. `src/components/engineering/AICalculatorAssistant.tsx` and `EngineeringAIChat.tsx` (use `import.meta.env.VITE_*` which is unsupported)

If the project ID or key ever changes, every file must be updated manually -- error-prone and a maintenance risk.

## Solution

### Step 1: Create `src/config.ts`

A single source of truth exporting both values:

```typescript
export const SUPABASE_URL = 'https://dfkoxuokfkttjhfjcecx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';
```

### Step 2: Update all 8 files

Each file's local `SUPABASE_URL` / `SUPABASE_KEY` / `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY` declarations are **removed** and replaced with a single import:

```typescript
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config';
```

For files that only use the URL (e.g., `AdminAIAssistant.tsx`, `TestResultsDashboard.tsx`):

```typescript
import { SUPABASE_URL } from '@/config';
```

For files using the broken `import.meta.env.VITE_*` pattern (`AICalculatorAssistant.tsx`, `EngineeringAIChat.tsx`, `useAYN.ts`), those references are also replaced with the centralized import.

The `src/integrations/supabase/client.ts` file will import from `@/config` instead of declaring its own constants.

### Files changed

| File | Change |
|------|--------|
| `src/config.ts` | **New file** -- single source of truth |
| `src/integrations/supabase/client.ts` | Remove local constants, import from config |
| `src/lib/supabaseApi.ts` | Remove local constants, import from config |
| `src/hooks/useAuth.ts` | Remove local constants, import from config |
| `src/hooks/useMessages.ts` | Remove local constants, import from config |
| `src/components/AdminPanel.tsx` | Remove local constants, import from config |
| `src/components/admin/AdminAIAssistant.tsx` | Remove local URL, import from config |
| `src/components/admin/TestResultsDashboard.tsx` | Remove local URL, import from config |
| `src/components/engineering/AICalculatorAssistant.tsx` | Replace `import.meta.env.VITE_*` with config import |
| `src/components/engineering/EngineeringAIChat.tsx` | Replace `import.meta.env.VITE_*` with config import |
| `src/hooks/useAYN.ts` | Replace `import.meta.env.VITE_*` with config import |

Note: The `e2e/` test files and `supabase/functions/` edge functions are outside the app bundle and will keep their own constants since they run in different environments (Playwright/Deno).

### What this does NOT do

- Does not change any runtime behavior -- same values, just imported from one place
- Does not use environment variables (not supported in Lovable)
- Does not touch edge functions or e2e tests (different runtime contexts)
