
# Implement Floor Plan Generation in AYN Chat

## Summary

Wire up AYN's dashboard chat so users can request floor plans conversationally. AYN detects the intent, extracts parameters, calls the existing `generate-floor-plan-layout` edge function, renders an SVG server-side, uploads it to Supabase Storage, and returns a download link -- just like PDF/Excel documents work today.

## Changes

### 1. Intent Detection -- Add `floor_plan` Keywords

**File: `supabase/functions/ayn-unified/intentDetector.ts`**

Add a new `floorPlanKeywords` array before the existing keyword checks (must be checked BEFORE `engineeringKeywords` since "design" overlaps):

- English: "floor plan", "house plan", "home layout", "design a house", "design me a home", "design a home", "architectural drawing", "home design", "house design", "design a floor plan"
- Arabic: "مخطط", "تصميم بيت", "تصميم منزل", "رسم معماري", "مخطط طابق", "تصميم دار"
- French: "plan de maison", "plan d'etage", "concevoir une maison"

Returns `'floor_plan'` intent.

**File: `src/hooks/useMessages.ts`**

Add floor plan detection in the client-side `detectIntent()` function (around line 304-322):
- Add regex: `/floor plan|house plan|home layout|design a house|design me a|مخطط|تصميم بيت|تصميم منزل|plan de maison/`
- Returns `'floor_plan'`
- Add `'floor_plan'` to the `requiresNonStreaming` array (line 327)
- Add a `isGeneratingFloorPlan` visual state similar to `isGeneratingDocument`

### 2. System Prompt -- Teach AYN About Floor Plans

**File: `supabase/functions/ayn-unified/systemPrompts.ts`**

Two changes:

a) Update "WHAT YOU CAN DO DIRECTLY" section (line 48-53) to add:
```
- Floor plan generation (architectural drawings with rooms, walls, doors, windows -- ask user for bedrooms, bathrooms, style, and target square footage)
```

b) Add a new `floor_plan` intent block (after the `document` block, around line 158):
```
FLOOR PLAN PARAMETER EXTRACTION MODE:
Extract these parameters from the user's request. Respond ONLY with valid JSON:
{
  "style_preset": "modern" | "modern_farmhouse" | "craftsman" | "colonial" | "ranch" | "mediterranean" | "coastal" | "mid_century_modern" | "mountain_lodge" | "minimalist" | "traditional",
  "num_bedrooms": number (default 3),
  "num_bathrooms": number (default 2),
  "target_sqft": number (default 1800),
  "num_storeys": 1 or 2 (default 1),
  "has_garage": boolean (default true),
  "garage_type": "attached_2car" | "attached_3car" | "detached" | "none",
  "custom_description": "any additional details from the user"
}

If the user is vague (e.g., "design me a house"), use sensible defaults and proceed.
```

### 3. Floor Plan Handler in `ayn-unified/index.ts`

**File: `supabase/functions/ayn-unified/index.ts`**

Add a new `floor_plan` intent block after the `document` block (after line 814), modeled on the document flow:

1. Check premium tier (same as document -- free users get upgrade prompt, admins bypass)
2. Call LLM with the `floor_plan` system prompt to extract params JSON from user message
3. Parse the JSON params
4. Call `generate-floor-plan-layout` internally via fetch (same pattern as `generate-document` call on line 735)
5. If layout JSON returned successfully, call `render-floor-plan-svg` to get SVG string
6. Upload SVG to `floor-plans` storage bucket using the service client
7. Get public URL
8. Return response with `documentUrl`, `documentName`, `documentType: 'svg'`

Also add `floor_plan` to `FALLBACK_CHAINS` (same models as engineering).

Credit cost: 35 credits per floor plan (between PDF at 30 and the complexity involved).

### 4. New Edge Function: `render-floor-plan-svg`

**File: `supabase/functions/render-floor-plan-svg/index.ts`**

A server-side SVG renderer that takes layout JSON and produces an SVG string. This replicates the core rendering logic from `FloorPlanRenderer.tsx` but outputs raw SVG XML without React/DOM.

The function will:
- Accept layout JSON via POST body
- Process walls using the same geometry logic (simplified for server-side -- straight segments, thickness offsets)
- Render room rectangles with labels and area text
- Render wall segments as filled rectangles (exterior hatched, interior solid)
- Render door symbols (line + arc) at opening positions
- Render window symbols (three parallel lines) at opening positions
- Render dimension chains on all four sides
- Include a title block at the bottom
- Return the complete SVG as a string

Scale: 1/4" = 1'-0" (1:48), targeting a 36"x24" sheet (ARCH D).

Drawing constants reused from `drawingConstants.ts` (hardcoded in the edge function since it can't import from `src/`).

**File: `supabase/config.toml`** -- Add entry:
```toml
[functions.render-floor-plan-svg]
verify_jwt = false
```

### 5. Storage Bucket for Floor Plans

**Database migration:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('floor-plans', 'floor-plans', true);

CREATE POLICY "Authenticated users can upload floor plans"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'floor-plans');

CREATE POLICY "Public can read floor plans"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'floor-plans');

CREATE POLICY "Users can delete own floor plans"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'floor-plans' AND (storage.foldername(name))[1] = auth.uid()::text);
```

Files will be stored as `{userId}/{timestamp}-{style}.svg`.

### 6. Client-Side Response Handling

**File: `src/hooks/useMessages.ts`**

The existing non-streaming response handler (lines 537-596) already handles `documentUrl` / `documentName` / `documentType` and renders `DocumentDownloadButton`. SVG files will work automatically through this path since:
- `documentAttachment` is created from `webhookData.documentUrl` (line 574)
- The `DocumentDownloadButton` component handles any file type generically

The only addition needed is the visual indicator state for "Generating floor plan..." similar to the document generation indicator.

## File Summary

| File | Action |
|------|--------|
| `supabase/functions/ayn-unified/intentDetector.ts` | Add floor_plan keywords |
| `supabase/functions/ayn-unified/systemPrompts.ts` | Add floor plan capability + intent prompt |
| `supabase/functions/ayn-unified/index.ts` | Add floor_plan handler block + fallback chain |
| `supabase/functions/render-floor-plan-svg/index.ts` | **New** -- server-side SVG renderer |
| `supabase/config.toml` | Add render-floor-plan-svg entry |
| `src/hooks/useMessages.ts` | Add floor_plan intent detection + visual state |
| Database migration | Create floor-plans storage bucket + RLS policies |

## Build Order

1. Storage bucket migration (prerequisite for uploads)
2. `render-floor-plan-svg` edge function (new file)
3. `intentDetector.ts` (add keywords)
4. `systemPrompts.ts` (add capability + prompt)
5. `ayn-unified/index.ts` (add handler + fallback chain)
6. `config.toml` (add function entry)
7. `useMessages.ts` (client-side intent + visual state)
8. Deploy edge functions
