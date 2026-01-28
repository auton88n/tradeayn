
# Regional Grading Standards Implementation Plan

## Overview

This implementation adds USA and Canada regional grading standards to the Grading Designer tool, providing code-compliant slope limits, permit thresholds, excavation requirements, and compaction specifications. The design follows the same pattern used for building code selection (ACI/CSA) in structural calculators.

---

## Architecture

```text
+---------------------+     +----------------------+     +-----------------------+
|  GradingRegion      | --> | gradingStandards.ts  | --> | GradingDesignerPanel  |
|  Selector (UI)      |     | (standards + helpers)|     | (validation + display)|
+---------------------+     +----------------------+     +-----------------------+
        |                           |                            |
        v                           v                            v
  EngineeringSession         GRADING_STANDARDS              GradingResults
  Context (state)            object (data)                  (compliance display)
```

---

## Files to Create

### 1. `src/lib/gradingStandards.ts` (New File)

Central configuration file containing all regional grading standards.

**Types to define:**
```typescript
export type GradingRegion = 'USA' | 'CANADA';
export type SoilType = 'STABLE_ROCK' | 'TYPE_A' | 'TYPE_B' | 'TYPE_C';

export interface StormWaterRequirements {
  permitTriggerArea: number;        // acres (USA) or hectares (Canada)
  permitTriggerAreaUnit: string;    // 'acres' or 'hectares'
  permitAuthority: string;          // 'EPA' or 'Provincial/Municipal'
  permitName: string;               // 'NPDES CGP' or 'ECA/Permit'
  swpppRequired: boolean;
  codeReference: string;            // 'EPA 2022 CGP' or 'Provincial regulations'
}

export interface ExcavationRequirements {
  maxUnprotectedDepth: number;      // feet (USA) or meters (Canada)
  maxUnprotectedDepthUnit: string;
  slopesByType: Record<SoilType, { angle: number; ratio: string }>;
  codeReference: string;            // 'OSHA 29 CFR 1926 Subpart P'
}

export interface DrainageRequirements {
  foundationSlope: { percent: number; distance: number; unit: string };
  imperviousSurfaceSlope: { percent: number; distance: number; unit: string };
  minSiteSlope: number;             // percent
  maxFillSlope: { percent: number; ratio: string };
  codeReference: string;            // 'IBC 2024 Section 1804.4'
}

export interface CompactionRequirement {
  application: string;
  requirement: string;              // '95% Standard Proctor'
  standard: string;                 // 'ASTM D698'
}

export interface CompactionRequirements {
  items: CompactionRequirement[];
  codeReference: string;
  frostProtectionNote?: string;     // Canada only
}

export interface GradingStandards {
  region: GradingRegion;
  flag: string;
  displayName: string;
  stormWater: StormWaterRequirements;
  excavation: ExcavationRequirements;
  drainage: DrainageRequirements;
  compaction: CompactionRequirements;
  codeDisplayText: string;          // For info boxes
}
```

**GRADING_STANDARDS object:**

| Region | Storm Water | Excavation | Drainage | Compaction |
|--------|-------------|------------|----------|------------|
| USA | EPA 2022 CGP, >=1 acre triggers permit | OSHA 29 CFR 1926 Subpart P (90deg rock, 53deg Type A, 45deg Type B, 34deg Type C) | IBC 2024 1804.4: 5% for 10ft foundation, 2% for 10ft impervious, max 50% fill | ASTM D698/D1557: 95% structural, 95-98% pavement, 90-95% utility |
| Canada | Provincial permits, ~0.4 ha typical | Provincial OHS (similar to OSHA) | NBCC 2025: 5% for 1.8m foundation, 1-2% min, max 33% fill | CSA A23.1:24 + ASTM: similar + frost protection notes |

**Helper functions:**
- `getGradingStandards(region: GradingRegion): GradingStandards`
- `validateSlope(slope: number, type: 'foundation' | 'impervious' | 'fill', standards: GradingStandards): ValidationResult`
- `checkPermitRequirements(disturbedAreaAcres: number, standards: GradingStandards): PermitCheckResult`
- `getExcavationSlope(soilType: SoilType, standards: GradingStandards): { angle: number; ratio: string }`
- `getCompactionRequirements(application: string, standards: GradingStandards): CompactionRequirement`

---

## Files to Modify

### 2. `src/contexts/EngineeringSessionContext.tsx`

Add grading region state (similar to nbccVersion):

```typescript
// Add to interface
gradingRegion: GradingRegion;
setGradingRegion: (region: GradingRegion) => void;

// Add state in provider
const [gradingRegion, setGradingRegion] = useState<GradingRegion>('USA');
```

### 3. `src/components/engineering/GradingDesignerPanel.tsx`

**Add region selector at top of form:**
- Import `GradingRegionSelector` component
- Add region state from context or local
- Pass region to generate-grading-design edge function
- Display validation results with compliance status

**Add new sections after design generation:**

A. **Permit Requirements Alert** (if area >= threshold)
```text
+------------------------------------------+
| [AlertTriangle] PERMIT REQUIRED          |
|                                          |
| Disturbed area: 2.5 acres                |
| Threshold: >= 1 acre (USA)               |
| Permit: NPDES CGP                        |
| Authority: EPA                           |
| SWPPP Required: Yes                      |
| Reference: EPA 2022 CGP                  |
+------------------------------------------+
```

B. **Slope Validation Panel**
```text
+------------------------------------------+
| Slope Compliance                         |
|                                          |
| Average Site Slope: 3.2%     [PASS]      |
| Foundation Drainage: 5% min  [PASS]      |
| Max Fill Slope: 45%          [WARNING]   |
|   > Limit: 50% (2:1)                     |
|   Consider retaining wall if > 50%       |
|                                          |
| Reference: IBC 2024 Section 1804.4       |
+------------------------------------------+
```

C. **Compaction Requirements Table**
```text
+------------------------------------------+
| Compaction Requirements                  |
+------------------------------------------+
| Application        | Requirement         |
|--------------------+---------------------|
| Structural fill    | 95% Std Proctor     |
| Under pavements    | 95-98% Mod Proctor  |
| Utility trenches   | 90-95%              |
+------------------------------------------+
| Reference: ASTM D698, D1557             |
+------------------------------------------+
```

D. **Code References** (Collapsible)
```text
+------------------------------------------+
| [v] Code References                      |
|                                          |
| Storm Water: EPA 2022 CGP                |
| Excavation: OSHA 29 CFR 1926 Subpart P   |
| Drainage: IBC 2024 Section 1804.4        |
| Compaction: ASTM D698-12(R2021)          |
+------------------------------------------+
```

### 4. `src/pages/AIGradingDesigner.tsx`

Similar changes to standalone page:
- Add region selector in header or form
- Display compliance information in results

### 5. `src/components/engineering/GradingRequirements.tsx`

Add region selector dropdown above the requirements textarea:
```tsx
<div>
  <Label>Region</Label>
  <Select value={region} onValueChange={setRegion}>
    <SelectItem value="USA">United States (EPA/OSHA/IBC)</SelectItem>
    <SelectItem value="CANADA">Canada (CCME/CSA/Provincial)</SelectItem>
  </Select>
</div>
```

Update preset templates to be region-aware (slope limits vary).

### 6. `src/components/engineering/GradingResults.tsx`

Add new sections in the Details tab:
- Permit Requirements Alert (conditional)
- Slope Validation panel
- Compaction Requirements table
- Code References collapsible

---

## New Component

### 7. `src/components/engineering/GradingRegionSelector.tsx` (New File)

Follows same pattern as `BuildingCodeSelector.tsx`:
- Dropdown with flag and region name
- Shows active standards summary
- Styled consistently with other selectors

```tsx
const GRADING_REGIONS = [
  {
    id: 'USA',
    name: 'United States',
    flag: 'US flag',
    standards: 'EPA/OSHA/IBC',
  },
  {
    id: 'CANADA',
    name: 'Canada',
    flag: 'CA flag',
    standards: 'CCME/CSA/Provincial',
  },
];
```

---

## Validation Logic

### Pre-Generation Validation
Before calling edge function:
1. Validate input slopes against regional limits
2. Check if site area triggers permit requirements
3. Warn about excavation depth considerations

### Post-Generation Validation
After receiving design results:
1. Compare designed slopes to code limits
2. Flag violations (foundation < 5%, fill > max)
3. Provide remediation suggestions (retaining wall, re-grade)

### Critical Validations Table

| Check | USA Limit | Canada Limit | Severity |
|-------|-----------|--------------|----------|
| Foundation slope < min | < 5% | < 5% | Error |
| Fill slope > max | > 50% (2:1) | > 33% (3:1) | Error (suggest retaining wall) |
| Site area >= permit | >= 1 acre | >= 0.4 ha | Warning |
| Excavation > unprotected | > 5 ft | > 1.5 m | Warning (protection required) |

---

## Info Box Updates

Dynamic text based on selected region:

**USA:**
```
Using EPA 2022 CGP, OSHA 29 CFR 1926, IBC 2024, ASTM D698/D1557
Grading requirements validated against US standards.
Verify local municipal requirements with building department.
```

**Canada:**
```
Using CSA A23.1:24, Provincial OHS, NBCC 2025, CCME Guidelines
Grading requirements validated against Canadian standards.
Verify provincial/municipal requirements with local authority.
```

---

## Implementation Sequence

1. **Create `src/lib/gradingStandards.ts`** - Define all types, standards data, and helper functions
2. **Update `EngineeringSessionContext`** - Add `gradingRegion` state
3. **Create `GradingRegionSelector.tsx`** - Reusable region selector component
4. **Update `GradingRequirements.tsx`** - Add region selector to form
5. **Update `GradingDesignerPanel.tsx`** - Integrate region, pass to edge function
6. **Update `GradingResults.tsx`** - Add compliance display sections
7. **Update `AIGradingDesigner.tsx`** - Mirror changes for standalone page

---

## Styling Guidelines

Following existing patterns:
- Region selector: Same style as `BuildingCodeSelector`
- Alerts: `variant="warning"` for permits, `variant="destructive"` for violations
- Tables: Same style as `GradingResults` cost breakdown table
- Info boxes: `bg-muted rounded-lg` with proper spacing
- Collapsible: Use shadcn `Collapsible` component with `ChevronDown` icon

---

## Technical Notes

1. **Standards Accuracy** (Verified January 2026):
   - USA: EPA 2022 CGP (Modified April 2025, expires Feb 2027), OSHA 29 CFR 1926 Subpart P, IBC 2024, ASTM D698-12(R2021)/D1557-12(R2021)
   - Canada: CSA A23.1:24 (14th edition), CCME Guidelines (March 2025), NBCC 2025, Provincial OHS

2. **Edge Function Update**: The `generate-grading-design` function should receive `region` parameter to include region-specific recommendations in AI output

3. **Measurement Units**:
   - USA: feet, acres
   - Canada: meters, hectares
   - Internal calculations in metric, display in regional units

4. **Canada Provincial Note**: Storm water permits are provincial/municipal, not federal. Show "Verify with provincial authority" message.

---

## Effort Estimate

| Task | Time |
|------|------|
| Create gradingStandards.ts | 2 hours |
| GradingRegionSelector component | 1 hour |
| Update EngineeringSessionContext | 30 mins |
| Update GradingRequirements | 1 hour |
| Update GradingDesignerPanel | 2 hours |
| Update GradingResults | 2 hours |
| Update AIGradingDesigner | 1 hour |
| Testing and refinement | 1-2 hours |
| **Total** | **10-12 hours** |
