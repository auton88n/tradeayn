

# Full App Audit: Active vs. Deleted Features + Cleanup Plan

## Current State of the App

### ACTIVE Services (Landing Page + Routes)

| # | Service | Route | Landing Section | Status |
|---|---------|-------|----------------|--------|
| 1 | Premium Content Creator Sites | `/services/content-creator-sites` + `/apply` | Section 01 | Active |
| 2 | Custom AI Agents | `/services/ai-agents` + `/apply` | Section 02 | Active |
| 3 | Process Automation | `/services/automation` + `/apply` | Section 03 | Active |
| 4 | AI Employees | `/services/ai-employee` + `/apply` | Section 04 | Active |
| 5 | Civil Engineering Calculators | `/engineering` + `/services/civil-engineering` | Section 05 | Active |
| 6 | Smart Ticketing System | `/services/ticketing` + `/apply` | Section 06 | Active |

### ACTIVE Engineering Tools (Inside `/engineering` workspace)

| Tool | Sidebar Entry | Status |
|------|--------------|--------|
| AI Grading Designer | Yes | Active |
| Beam Design | Yes | Active |
| Foundation Design | Yes | Active |
| Column Design | Yes | Active |
| Slab Design | Yes | Active |
| Retaining Wall | Yes | Active |

### ACTIVE Standalone Sections

| Section | Route | Status |
|---------|-------|--------|
| Building Code Compliance | `/compliance` | Active (also accessible from Design Studio) |
| AI Grading Designer | `/engineering/grading` | Active (standalone page) |
| Support/Tickets | `/support` | Active |
| Pricing | `/pricing` | Active |
| Settings | `/settings` | Active |
| Admin Panel | Dashboard tab | Active |

### AYN AI Assistant

The main AYN chat is active and handles: regular chat, engineering analysis, document generation, image generation/editing, file analysis, and web search. Floor plan generation intent is commented out and falls back to regular chat.

---

## DELETED/HIDDEN Features (Still Have Dead Code)

### 1. Design Studio (`/design` route) -- COMMENTED OUT
- **Route:** Commented out in `App.tsx` (line 43, 95)
- **Constant:** Commented out in `routes.ts` (line 12)
- **Files still exist:** `src/pages/DesignWorkspacePage.tsx`, `src/components/design/DesignWorkspace.tsx`, `src/components/design/DesignSidebar.tsx`
- **Status:** Disabled. Only shows Code Compliance (which is already at `/compliance`). The Design Studio is a dead wrapper.

### 2. Parking Designer -- COMMENTED OUT
- **Sidebar:** Removed from `CalculatorSidebar.tsx`
- **Workspace:** Commented out in `EngineeringWorkspace.tsx` (lines 27, 38, 380-385, 471-472)
- **Files still exist:** Full parking directory with 15+ files:
  - `src/components/engineering/ParkingDesigner.tsx`
  - `src/components/engineering/ParkingLayout2D.tsx`
  - `src/components/engineering/ParkingVisualization3D.tsx`
  - `src/components/engineering/parking/` (boundary/, components/, context/, types/, utils/)
- **AI Chat:** Has commented-out parking suggestions in `EngineeringAIChat.tsx`

### 3. Floor Plan Generator -- DISABLED
- **Intent detection:** Commented out in `ayn-unified/intentDetector.ts`
- **Handler:** Disabled in `ayn-unified/index.ts` (falls back to chat)
- **Edge functions still deployed:**
  - `generate-floor-plan-layout/` -- Full floor plan AI generator
  - `generate-design/` -- Design generation function
  - `render-floor-plan-svg/` -- SVG renderer for floor plans
  - `analyze-floor-plan/` -- Floor plan analyzer for compliance
- **API endpoints defined:** `GENERATE_FLOOR_PLAN_LAYOUT`, `PARSE_DXF_DESIGN`, `ANALYZE_AUTOCAD_DESIGN`, `APPLY_DESIGN_OPTIMIZATIONS` in `apiEndpoints.ts`

### 4. Architectural Drawings Generator -- HIDDEN
- **Sidebar:** Not in `CalculatorSidebar.tsx`
- **Workspace:** Still renders `DrawingGenerator` for `case 'drawings'` (line 398-403)
- **DesignSidebar:** Commented out "Architectural Drawings" option
- **Files still exist:** `src/components/engineering/drawings/` directory (DrawingGenerator.tsx, DrawingRefinement.tsx, DrawingRequestForm.tsx, DrawingViewer.tsx, engine/, hooks/, configure/)

### 5. Design Lab Link -- BROKEN
- `SavedImagesGallery.tsx` has "Open in Design LAB" button that navigates to `/design-lab` -- a route that doesn't exist

### 6. AutoCAD/DXF Design Analysis -- STALE
- API endpoints `PARSE_DXF_DESIGN`, `ANALYZE_AUTOCAD_DESIGN`, `APPLY_DESIGN_OPTIMIZATIONS` still defined
- Edge functions `parse-dxf-design/`, `analyze-autocad-design/`, `apply-design-optimizations/` still deployed
- Not referenced by any active UI

---

## What Needs Cleanup

### Files to DELETE (dead code from deleted features):

**Design Studio (wrapper page):**
- `src/pages/DesignWorkspacePage.tsx`
- `src/components/design/DesignWorkspace.tsx`
- `src/components/design/DesignSidebar.tsx`

**Parking Designer (all files):**
- `src/components/engineering/ParkingDesigner.tsx`
- `src/components/engineering/ParkingLayout2D.tsx`
- `src/components/engineering/ParkingVisualization3D.tsx`
- `src/components/engineering/parking/` (entire directory)
- `src/components/engineering/SaveDesignDialog.tsx` (parking-specific)

**Architectural Drawings (all files):**
- `src/components/engineering/drawings/` (entire directory)

### Files to EDIT (remove dead references):

1. **`src/App.tsx`** -- Remove commented-out Design import and route
2. **`src/constants/routes.ts`** -- Remove commented-out DESIGN route
3. **`src/constants/apiEndpoints.ts`** -- Remove `GENERATE_FLOOR_PLAN_LAYOUT`, `PARSE_DXF_DESIGN`, `ANALYZE_AUTOCAD_DESIGN`, `APPLY_DESIGN_OPTIMIZATIONS`
4. **`src/components/engineering/workspace/EngineeringWorkspace.tsx`** -- Remove all commented-out parking/drawing imports and cases; remove `DrawingGenerator` lazy import and case
5. **`src/components/engineering/workspace/CalculatorSidebar.tsx`** -- Remove `'drawings'` from `CalculatorType` union; remove unused `Car`, `Ruler`, `ClipboardCheck` icon imports
6. **`src/components/engineering/EngineeringAIChat.tsx`** -- Remove commented-out parking suggestions
7. **`src/components/dashboard/SavedImagesGallery.tsx`** -- Remove broken "Open in Design LAB" button/handler
8. **`supabase/functions/ayn-unified/index.ts`** -- Remove all commented-out floor plan code
9. **`supabase/functions/ayn-unified/intentDetector.ts`** -- Remove commented-out floor plan keywords
10. **`supabase/functions/ayn-unified/systemPrompts.ts`** -- Remove commented-out floor plan prompt section
11. **`supabase/functions/_shared/aynBrand.ts`** -- Verify services list mentions "Engineering Consultation Tools" (not floor plans/parking/drawings)

### Edge Functions to DELETE (no longer used):

- `generate-floor-plan-layout/`
- `generate-design/`
- `render-floor-plan-svg/`
- `analyze-autocad-design/`
- `apply-design-optimizations/`
- `parse-dxf-design/`

**NOTE:** Keep `analyze-floor-plan/` -- it is actively used by the Compliance Checker to extract room data from uploaded plans.

### Edge Functions to KEEP (actively used):

All AYN workforce functions, engineering AI functions, auth, payments, support, email, analytics, marketing, and `analyze-floor-plan` (compliance).

---

## Summary

The app currently has **6 active services** on the landing page, **6 structural calculators** + **grading** + **compliance** in the engineering workspace, and a full **10-employee AI workforce**. The dead code from 4 deleted features (Design Studio, Parking Designer, Floor Plan Generator, Architectural Drawings) spans roughly 30+ files and 6 edge functions that should be removed to keep the codebase clean.

