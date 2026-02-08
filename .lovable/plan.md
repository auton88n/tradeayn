

# AI-Powered Floor Plan Upload for Compliance Checker

## What Changes

Replace the 6-step manual measurement wizard (Rooms, Windows, Stairs, Doors/Hallways, Fire Safety, Review) with a single "Upload Design" step. The AI reads the floor plan using vision and extracts all measurements automatically. Users verify the extracted data in editable cards, then run the compliance check.

## New Flow

```text
Step 1: Project Setup (keep as-is)
Step 2: Upload Design (NEW -- replaces steps 2-6)
Step 3: Results (keep as-is)

Small link under upload: "Don't have drawings? Enter manually" -> old wizard
```

---

## New Edge Function: `analyze-floor-plan`

**File:** `supabase/functions/analyze-floor-plan/index.ts`

Accepts a base64-encoded floor plan (PDF or image) plus the project's unit system and code system. Sends it to the Lovable AI Gateway using Gemini 3 Flash with vision, using tool calling to extract structured JSON output.

The extraction prompt asks the AI to identify:
- Room names, types, areas, shortest dimensions, ceiling heights
- Window sizes per room (glazing area, openable area, egress details, sill heights)
- Stair dimensions (width, riser, tread, headroom, flight height, handrails, landings)
- Door widths and heights, hallway widths
- Fire safety indicators (smoke alarms shown, garage separation details)
- Number of storeys visible

The tool call schema maps directly to the `compliance_inputs` table columns, so the AI returns an array of `ComplianceInput` objects ready to save.

For PDFs: use the Lovable AI Gateway's `type: "file"` format with `filename` and `file_data` fields (per the existing parse-pdf-drawing pattern documented in memory).

For images: use the standard `image_url` format with base64 data URL.

The function returns the extracted inputs plus a confidence score and any notes from the AI about what it could or could not read.

**Config:** Add `[functions.analyze-floor-plan]` with `verify_jwt = true` to `supabase/config.toml`.

---

## New Step Component: `DesignUploadStep.tsx`

**File:** `src/components/engineering/compliance/steps/DesignUploadStep.tsx`

Three states:

**State 1 -- Upload Zone:**
- Large drag-and-drop area styled like the existing `FileUploadZone` component
- Heading: "Upload Your Floor Plan"
- Subtext: "Drop your floor plan here -- AYN will read it and extract all measurements automatically"
- Accepts: PDF, PNG, JPG (validated on client)
- Max size: 10MB
- Small link below: "Don't have drawings? Enter measurements manually" (triggers callback to switch to manual wizard mode)
- On file drop/select: convert to base64, show upload progress, call `analyze-floor-plan` edge function

**State 2 -- Analyzing (loading):**
- Animated spinner with "AYN is reading your floor plan..."
- Progress indicator showing steps: Uploading -> Analyzing -> Extracting data

**State 3 -- Review Extracted Data:**
- Editable cards grouped by category (Rooms, Windows, Stairs, Doors, Fire Safety)
- Each card shows the AI-extracted value with an edit icon
- Yellow highlight on fields the AI marked as low-confidence
- "Add Room" / "Add Window" buttons to manually add items the AI missed
- "Confirm & Run Check" button at the bottom
- "Re-upload" link to go back to State 1

---

## New Hook: `useFloorPlanAnalysis.ts`

**File:** `src/components/engineering/compliance/hooks/useFloorPlanAnalysis.ts`

Manages:
- File selection and validation (PDF/PNG/JPG, max 10MB)
- Base64 conversion
- Calling the `analyze-floor-plan` edge function via `supabase.functions.invoke`
- Storing extracted `ComplianceInput[]` data
- Loading/error states
- Confidence scores per extracted item

---

## Modified: `ComplianceWizard.tsx`

Restructure the wizard to support two modes:

**AI Mode (default):**
- Steps: `['Project Setup', 'Upload Design', 'Results']`
- Step 2 renders `<DesignUploadStep />`
- On "Confirm & Run Check", the extracted inputs feed directly into `handleRunCheck` (same compliance engine)

**Manual Mode (fallback):**
- Steps: `['Project Setup', 'Rooms', 'Windows', ..., 'Review', 'Results']` (current flow)
- Activated by clicking "Enter measurements manually" link in DesignUploadStep
- A `useState<'ai' | 'manual'>` controls which mode is active
- Back button from manual mode step 2 returns to the AI upload step

The step indicators update dynamically based on the active mode.

---

## Modified Files Summary

| File | Change |
|------|--------|
| `supabase/functions/analyze-floor-plan/index.ts` | NEW -- Edge function for AI vision extraction |
| `supabase/config.toml` | Add `[functions.analyze-floor-plan]` entry |
| `src/components/engineering/compliance/steps/DesignUploadStep.tsx` | NEW -- Upload + review UI |
| `src/components/engineering/compliance/hooks/useFloorPlanAnalysis.ts` | NEW -- Upload and extraction logic |
| `src/components/engineering/compliance/ComplianceWizard.tsx` | Restructure to AI mode (default) + manual mode (fallback) |

No changes needed to the compliance engine, results step, or database schema -- the extracted data maps to the same `ComplianceInput` interface.

---

## AI Extraction Prompt (used in edge function)

The system prompt instructs the AI to act as an architectural plan reader. It specifies:
- Extract every room with name, type, area, shortest dimension
- Extract window data per room (glazing area, openable area, egress status, sill height)
- Extract stair dimensions if visible
- Extract door widths and hallway widths
- Note any fire safety features visible (alarm symbols, garage separation notations)
- Use the specified unit system (imperial or metric)
- Return structured JSON via tool calling that matches the ComplianceInput schema
- Include a confidence score (0-1) for each extracted item
- Include notes about anything unclear or not visible in the drawing

---

## Build Order

1. Create `analyze-floor-plan` edge function + add to config.toml
2. Create `useFloorPlanAnalysis` hook
3. Create `DesignUploadStep` component
4. Modify `ComplianceWizard` to support AI mode (default) + manual mode (fallback)
5. Deploy and test

