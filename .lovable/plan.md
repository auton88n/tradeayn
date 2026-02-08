
# Remove Dead Engineering Edge Functions

## Overview

Delete 5 unused edge function directories and clean up all references to them in the frontend code.

## Deletions

### Edge Function Directories (10 files total)

Delete these 5 directories entirely:

- `supabase/functions/calculate-beam/` (index.ts + index.test.ts)
- `supabase/functions/calculate-column/` (index.ts + index.test.ts)
- `supabase/functions/calculate-slab/` (index.ts + index.test.ts)
- `supabase/functions/calculate-foundation/` (index.ts + index.test.ts)
- `supabase/functions/calculate-retaining-wall/` (index.ts + index.test.ts)

Also delete these 5 deployed edge functions from Supabase using the delete tool.

### Reference Cleanup

**`src/constants/apiEndpoints.ts`** (lines 20-24) -- Remove these 5 entries from `API_ENDPOINTS`:
- `CALCULATE_BEAM`
- `CALCULATE_COLUMN`
- `CALCULATE_FOUNDATION`
- `CALCULATE_SLAB`
- `CALCULATE_RETAINING_WALL`

**`src/components/admin/TestResultsDashboard.tsx`** (line 385) -- Update the bug hunter endpoints array to remove the dead calculator references, keeping only `'support-bot'` (or other valid endpoints).

## What is NOT changed

- `src/lib/engineeringCalculations.ts` (the real client-side calculator code)
- `src/lib/buildingCodes/` directory
- Other engineering edge functions (`engineering-ai-chat`, `engineering-ai-agent`, etc.)
