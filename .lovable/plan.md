
# Multi-Region Building Code System - Complete Implementation Plan

## Overview

Transform the engineering tools from hardcoded Saudi (SBC) standards to a flexible, user-configurable system supporting **ACI 318-25 (USA)**, **CSA A23.3-24 (Canada)**, and **Custom** configurations. This affects all 7 engineering tools.

## Current State Analysis

| Component | Current Issue |
|-----------|--------------|
| `engineeringCalculations.ts` | Hardcoded `1.4D + 1.6L` load factors, `0.17√f'c` shear, `0.0018` min reinforcement |
| `user_preferences` table | Defaults to `building_code: 'SBC'`, `currency: 'SAR'`, `region: 'SA'` |
| Edge functions | `generate-grading-design/index.ts` has "Saudi earthwork prices" in SAR |
| UI components | BeamCalculator shows "ACI 318 / Eurocode 2" but uses mixed values |

## Phase 1: Building Codes Configuration Module

### New Files to Create

**File 1: `src/lib/buildingCodes/index.ts`**
Central export file for all building code configurations.

**File 2: `src/lib/buildingCodes/types.ts`**
```text
BuildingCodeConfig interface with:
├── id: 'ACI' | 'CSA' | 'CUSTOM'
├── name, fullName, version, country, flag
├── loadFactors: { dead, deadOnly, live, wind, seismic, snow }
├── resistanceFactors: { flexure, shear, compressionTied, compressionSpiral }
├── stressBlock: { alpha1, beta1 } (functions for CSA, values for ACI)
├── reinforcement: { minFlexural, minColumn, maxColumn, tempShrinkage }
├── shear: { method, vcFormula, beta, maxSpacing }
├── deflection: { floor, roof, afterPartitions, cantilever }
├── concrete: { Ec formula, minFc, maxFc }
├── cover: { interior, exterior, earth, aggressive }
├── stability: { overturningFOS, slidingFOS, bearingFOS }
└── parking: { accessibleStall, accessibleAisle, standard }
```

**File 3: `src/lib/buildingCodes/aci-318-25.ts`**
```text
ACI 318-25 / ASCE 7-22 Configuration:
├── Load Factors: 1.2D + 1.6L (1.4D alone), W=1.0, S=1.0, E=1.0
├── Resistance Factors: φ_flexure=0.90, φ_shear=0.75, φ_compression=0.65/0.75
├── Stress Block: α1=0.85, β1=0.85→0.65 (stepped formula)
├── Min Reinforcement: 0.0018 (slabs), 0.01-0.08 (columns)
├── Shear: 0.17λ√f'c (simplified), Table 22.5.5.1 method
├── Stirrup Spacing: min(d/2, 600mm)
├── Punching: min of 3 formulas (Table 22.6.5.2)
├── Deflection: L/360 (floors), L/480 (partitions)
├── Concrete: Ec = 4700√f'c (MPa)
└── Parking: ADA 2010 - 2440mm stall, 1525mm aisle
```

**File 4: `src/lib/buildingCodes/csa-a23-3-24.ts`**
```text
CSA A23.3-24 / NBC 2025 Configuration:
├── Load Factors: 1.25D + 1.5L, W=1.4, S=1.5, E=1.0
├── Resistance Factors: φc=0.65, φs=0.85 (more conservative!)
├── Stress Block: α1=0.85-0.0015f'c, β1=0.97-0.0025f'c (linear formulas)
├── Min Reinforcement: 0.002 (slabs), 0.01-0.04 (columns)
├── Shear: MCFT method, β=0.18 with stirrups
├── Stirrup Spacing: min(0.7dv, 600mm)
├── Punching: 0.38√f'c coefficient
├── Deflection: L/240 (immediate), L/480 (partitions)
├── Concrete: Ec = 4500√f'c (MPa)
└── Parking: CSA B651 - 2600mm stall, 2000mm aisle
```

**File 5: `src/lib/buildingCodes/geotechnical.ts`**
```text
Geotechnical Safety Factors (Code-independent):
├── Foundation Bearing: FOS 2.0-3.0 (soil), 1.5-2.0 (rock)
├── Overturning: FOS 2.0 (soil), 1.5 (rock)
├── Sliding: FOS 1.5-2.0
└── Note: Standard practice, verify with geotechnical engineer
```

**File 6: `src/lib/buildingCodes/calculator.ts`**
Helper functions that apply the selected code to calculations:
- `getLoadFactors(code, loadCase)`
- `getStressBlockParams(code, fck)`
- `getShearStrength(code, fck, bw, d, hasMinStirrups)`
- `getMinReinforcement(code, elementType, Ag)`
- `getMaxStirrupSpacing(code, d, dv)`

## Phase 2: Database Schema Updates

**Migration: Update `user_preferences` defaults**
```sql
-- Change defaults from Saudi to neutral/user-selected
ALTER TABLE user_preferences 
  ALTER COLUMN building_code SET DEFAULT 'ACI',
  ALTER COLUMN currency SET DEFAULT 'USD',
  ALTER COLUMN region SET DEFAULT 'US';

-- Add custom code storage
ALTER TABLE user_preferences
  ADD COLUMN custom_code_config JSONB DEFAULT NULL;
```

**New Table: `building_code_presets` (optional, for user-saved configs)**
```sql
CREATE TABLE building_code_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Phase 3: Client-Side Calculation Updates

**File: `src/lib/engineeringCalculations.ts`**

### Beam Calculator Changes (Lines 56-96)
```text
BEFORE: const factoredLoad = 1.4 * deadLoad + 1.6 * liveLoad;
AFTER:  const factoredLoad = code.loadFactors.dead * deadLoad + code.loadFactors.live * liveLoad;

BEFORE: const Vc = 0.17 * Math.sqrt(fck) * width * d;
AFTER:  const Vc = getShearStrength(code, fck, width, d, hasMinStirrups);

BEFORE: Math.min(d / 2, 300)
AFTER:  getMaxStirrupSpacing(code, d, dv)
```

### Slab Calculator Changes (Lines 156-189)
```text
BEFORE: const Wu = 1.4 * deadLoad + 1.6 * liveLoad;
AFTER:  const Wu = code.loadFactors.dead * deadLoad + code.loadFactors.live * liveLoad;

BEFORE: const rhoMin = 0.0018;
AFTER:  const rhoMin = code.reinforcement.minFlexural; // 0.0018 ACI, 0.002 CSA
```

### Column Calculator Changes (Lines 397-450)
```text
Apply φc/φs (CSA) vs φ (ACI) approach
Update min/max reinforcement ratios per code
```

### Foundation Calculator Changes
```text
Update punching shear coefficient: 0.33 (ACI) vs 0.38 (CSA)
Apply correct resistance factors
```

### Retaining Wall Calculator Changes
```text
Use geotechnical FOS values from config
Apply code-specific load combinations
```

## Phase 4: Edge Function Updates

### Files to Modify (5 structural calculators)
- `supabase/functions/calculate-beam/index.ts`
- `supabase/functions/calculate-slab/index.ts`
- `supabase/functions/calculate-column/index.ts`
- `supabase/functions/calculate-foundation/index.ts`
- `supabase/functions/calculate-retaining-wall/index.ts`

Each will accept a `buildingCode` parameter and apply the corresponding factors.

### Grading Designer - Remove Saudi Pricing
**File: `supabase/functions/generate-grading-design/index.ts`**

```text
BEFORE (Lines 31-38):
// Saudi earthwork prices
const EARTHWORK_PRICES = {
  excavation: 25,      // SAR/m³
  ...
};

AFTER:
// Accept pricing from request body (user-configured)
const { points, terrainAnalysis, requirements, earthworkPrices, currency } = await req.json();

const EARTHWORK_PRICES = earthworkPrices || {
  excavation: 45,      // Default USD/m³
  fill: 55,
  compaction: 15,
  disposal: 25,
  surveyingPerHectare: 500,
};
```

Also update the AI prompt to remove "Consider Saudi building code requirements."

### Parking Designer - Add Accessibility Presets
**File: `src/components/engineering/ParkingDesigner.tsx`**

```text
Add accessibility standard selection:
├── ADA 2010 (USA): 2440mm stall + 1525mm aisle
├── CSA B651 (Canada): 2600mm stall + 2000mm aisle
└── Custom: User-defined dimensions
```

## Phase 5: UI/Settings Integration

### New Component: `src/components/settings/BuildingCodeSettings.tsx`
```text
Building Code Settings Panel:
├── Code Selection Dropdown: [ACI 318-25 🇺🇸] [CSA A23.3-24 🇨🇦] [Custom]
├── If Custom selected:
│   ├── Load Factors section (editable inputs)
│   ├── Resistance Factors section
│   ├── Reinforcement Limits section
│   └── Save as Preset button
├── Preview: Shows key values for selected code
└── Currency selector: USD / CAD / Custom
```

### Calculator UI Updates
Update info boxes in all 5 structural calculators:

**BeamCalculator.tsx (Lines 286-290)**
```text
BEFORE: "Uses ACI 318 / Eurocode 2 methods with load factors: 1.4 DL + 1.6 LL"
AFTER:  Dynamic display based on selected code:
        - ACI: "ACI 318-25 / ASCE 7-22: 1.2D + 1.6L, φ = 0.90"
        - CSA: "CSA A23.3-24 / NBC 2025: 1.25D + 1.5L, φc = 0.65"
```

### Results Display Updates
Each calculator result will show:
```text
┌─────────────────────────────────────────┐
│ Design Code: CSA A23.3-24 (June 2024)   │
│ Reference: Clause 11 - MCFT Shear       │
│ Load Combination: 1.25D + 1.5L          │
└─────────────────────────────────────────┘
```

## Phase 6: Context Integration

**File: `src/contexts/EngineeringSessionContext.tsx`**

Add building code to session context:
```text
EngineeringSessionContextValue:
├── currentBuildingCode: BuildingCodeConfig
├── setBuildingCode: (code: 'ACI' | 'CSA' | 'CUSTOM') => void
├── customCodeConfig: Partial<BuildingCodeConfig> | null
└── getAIContext() now includes active building code
```

## Implementation Sequence

```text
Week 1: Core Infrastructure
├── Day 1-2: Create building code config files (types, ACI, CSA, geotechnical)
├── Day 3: Create calculator helper functions
├── Day 4: Update engineeringCalculations.ts (client-side)
└── Day 5: Database migration + user preferences update

Week 2: Edge Functions & UI
├── Day 1-2: Update all 5 structural edge functions
├── Day 3: Update grading designer (remove SAR, add user pricing)
├── Day 4: Update parking designer (accessibility presets)
└── Day 5: Create BuildingCodeSettings component

Week 3: Integration & Testing
├── Day 1: Integrate settings into user preferences page
├── Day 2: Update all calculator info boxes
├── Day 3: Update engineering test suite for both codes
├── Day 4: QA testing with real calculations
└── Day 5: Documentation and code review
```

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Code storage | User preferences + optional presets table | Simple default, power-user flexibility |
| Calculation approach | Pass code config to functions | Single source of truth, testable |
| Custom code validation | Zod schema | Prevent invalid configurations |
| Default code | ACI 318-25 | Larger user base, well-documented |
| Pricing for grading | User-input with defaults | Global applicability |

## Files Summary

### New Files (6)
```text
src/lib/buildingCodes/
├── index.ts           # Barrel export
├── types.ts           # TypeScript interfaces
├── aci-318-25.ts      # USA config
├── csa-a23-3-24.ts    # Canada config
├── geotechnical.ts    # Stability factors
└── calculator.ts      # Helper functions
```

### Modified Files (15+)
```text
src/lib/engineeringCalculations.ts
src/contexts/EngineeringSessionContext.tsx
src/components/engineering/BeamCalculator.tsx
src/components/engineering/SlabCalculator.tsx
src/components/engineering/ColumnCalculator.tsx
src/components/engineering/FoundationCalculator.tsx
src/components/engineering/RetainingWallCalculator.tsx
src/components/engineering/ParkingDesigner.tsx
src/components/engineering/GradingDesignerPanel.tsx
src/components/engineering/GradingResults.tsx
supabase/functions/calculate-beam/index.ts
supabase/functions/calculate-slab/index.ts
supabase/functions/calculate-column/index.ts
supabase/functions/calculate-foundation/index.ts
supabase/functions/calculate-retaining-wall/index.ts
supabase/functions/generate-grading-design/index.ts
supabase/functions/apply-design-optimizations/index.ts
```

## Verification Checklist

After implementation, verify:
- [ ] ACI 318-25 calculations match expected values (1.2D+1.6L, φ=0.90)
- [ ] CSA A23.3-24 calculations match expected values (1.25D+1.5L, φc=0.65)
- [ ] Stress block formulas work correctly for both codes
- [ ] Shear calculations use correct method (ACI table vs CSA MCFT)
- [ ] Min reinforcement differs correctly (0.0018 vs 0.002)
- [ ] Grading designer accepts custom pricing in any currency
- [ ] Parking designer shows correct accessibility dimensions
- [ ] User preferences persist across sessions
- [ ] Engineering test suite passes for both codes
