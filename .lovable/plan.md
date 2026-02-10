
# Remove Floor Plan References from AYN Prompts

Both AYN instances (Telegram and Dashboard) still mention "floor plan generation" in their system prompts. Since the platform now focuses on compliance instead of floor plans, these references need to be updated.

## Changes

### 1. `supabase/functions/ayn-telegram-webhook/index.ts`
- Line 38: Change "floor plan generation" to "building code compliance checks" in the toolkit list

### 2. `supabase/functions/ayn-unified/systemPrompts.ts`
- Line 51: Change "Floor plan generation (architectural drawings with rooms, walls, doors, windows)" to "Building code compliance checks (IRC 2024 / NBC 2025)"
- Lines 167-171: Remove or keep commented-out floor plan parameter extraction block (already commented out, no action needed)

### 3. Redeploy both edge functions
- `ayn-telegram-webhook`
- `ayn-unified`

Two quick line edits and a redeploy -- that's it.
