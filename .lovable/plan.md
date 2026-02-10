
# Hide Architectural Drawings Feature & Remove from AYN

## What This Does

Hides the Architectural Drawings tool from the Design Studio sidebar and landing page, and removes the floor plan generation capability from AYN's chat (both intent detection and handling). No code is deleted -- everything is commented out or removed from arrays so it can be re-enabled later.

## Changes

### 1. Design Studio Sidebar (`src/components/design/DesignSidebar.tsx`)
- Comment out the `drawings` entry in the `designTools` array (lines 27-32), same way `parking` is already commented out

### 2. Design Studio Workspace (`src/components/design/DesignWorkspace.tsx`)
- Remove the `DrawingGenerator` lazy import (line 14)
- Comment out the `case 'drawings'` block in `renderToolForm` (lines 64-69)
- Remove "Architectural Drawings" from the landing page feature cards (line 111)

### 3. AYN Intent Detector (`supabase/functions/ayn-unified/intentDetector.ts`)
- Comment out the `floorPlanKeywords` array and the `floor_plan` return line

### 4. AYN System Prompts (`supabase/functions/ayn-unified/systemPrompts.ts`)
- Remove the "Floor plan generation" line from "WHAT YOU CAN DO" section
- Comment out the `floor_plan` intent prompt block

### 5. AYN Unified Handler (`supabase/functions/ayn-unified/index.ts`)
- Comment out the `FLOOR_PLAN_CREDIT_COST` constant
- Remove `floor_plan` from `FALLBACK_CHAINS`
- Comment out the entire `if (intent === 'floor_plan')` handler block

### 6. Client-Side Intent Detection (`src/hooks/useMessages.ts`)
- Remove floor plan regex from `detectIntent()`
- Remove `'floor_plan'` from `requiresNonStreaming` array
- Remove the `isGeneratingFloorPlan` state setter block

### 7. Edge functions deployment
- Redeploy `ayn-unified` with floor plan handling removed
- `render-floor-plan-svg` and `generate-floor-plan-layout` stay deployed but unused (no deletion)
