
# Remove Saudi Code & Cost Estimation + Improve AI Grading Knowledge

## Summary
This plan addresses three key changes:
1. Remove Saudi code references - only keep USA and Canada
2. Remove cost estimation features (unreliable numbers)
3. Update AI edge functions to understand regional grading codes and formulas

---

## Files to Modify

### 1. Frontend - Remove Saudi Code Option

**`src/components/engineering/DesignReviewMode.tsx`**
- Line 420-428: Change "Verify Saudi Code Compliance" to "Verify Regional Code Compliance"
- Update description from "Check against MOT standards" to "Check against USA (OSHA/IBC) or Canada (CSA/NBCC) standards"

### 2. Frontend - Remove Cost Display

**`src/components/engineering/GradingResults.tsx`**
- Lines 231-251: Remove the entire Cost Breakdown card section
- Remove `DollarSign` icon import (line 2)
- Keep the volume summary and design parameters (those are useful)

**`src/components/engineering/GradingPDFReport.tsx`**
- Lines 761-780: Remove the "COST ESTIMATE (SAR)" section from PDF
- Keep the component props but don't render cost breakdown
- Update props interface to make cost props optional (lines 32-35)

**`src/components/engineering/GradingDesignerPanel.tsx`**
- Lines 57-58: Remove `costBreakdown` and `totalCost` state
- Lines 101-103: Remove cost-related state updates from response
- Lines 221-227: Remove cost props from `GradingResults` component

### 3. Edge Functions - Remove Cost Calculation & Add Regional Knowledge

**`supabase/functions/generate-grading-design/index.ts`**
- Remove `EarthworkPrices` interface (lines 31-37)
- Remove `DEFAULT_EARTHWORK_PRICES` constant (lines 39-46)
- Remove cost calculation logic (lines 191-204)
- Update AI prompt to include regional grading standards knowledge:

**New AI Prompt Structure:**
```
REGIONAL GRADING STANDARDS (verified January 2026):

USA Standards:
- Storm Water: EPA 2022 CGP - permits required ≥1 acre disturbed
- Excavation: OSHA 29 CFR 1926 Subpart P
  * Stable rock: 90° vertical
  * Type A soil: 53° (3/4:1 ratio)
  * Type B soil: 45° (1:1 ratio)
  * Type C soil: 34° (1.5:1 ratio)
- Drainage: IBC 2024 Section 1804.4
  * Foundation: 5% slope for 10 feet minimum
  * Impervious surfaces: 2% slope for 10 feet
  * Maximum fill slope: 50% (2:1)
- Compaction: ASTM D698 (Standard Proctor), D1557 (Modified)
  * Structural fill: 95% Standard Proctor
  * Under pavements: 95-98% Modified Proctor
  * Utility trenches: 90-95%

CANADA Standards:
- Storm Water: Provincial/Municipal permits ~0.4 hectares
- Excavation: Provincial OHS (similar to OSHA)
  * Unprotected depth limit: 1.5m (vs 5 feet USA)
- Drainage: NBCC 2025
  * Foundation: 5% slope for 1.8m minimum
  * Minimum site slope: 1-2%
  * Maximum fill slope: 33% (3:1) - more conservative than USA
- Compaction: CSA A23.1:24 + ASTM
  * Similar to USA with frost protection considerations

Apply the appropriate standards based on the user's selected region: {region}
```

- Return response without cost fields (keep design, fglPoints)

**`supabase/functions/analyze-autocad-design/index.ts`**
- Lines 221-245: Update `checkCompliance` section to use regional standards instead of Saudi MOT
- Lines 297-338: Update AI prompt to reference USA/Canada instead of Saudi
- Lines 375-386: Remove cost estimates calculation
- Remove SAR currency references throughout

**Updated Compliance Check Logic:**
```typescript
if (options.checkCompliance && region) {
  const slopes = calculateSlopes(designPoints);
  
  if (region === 'USA') {
    // IBC 2024 Section 1804.4 checks
    const steepFillSlopes = slopes.filter(s => s.percentage > 50);
    if (steepFillSlopes.length > 0) {
      problems.push({
        severity: 'critical',
        type: 'code_violation',
        message: `${steepFillSlopes.length} locations exceed 50% (2:1) maximum fill slope per IBC 2024`,
        impact: 'Non-compliant - consider retaining wall'
      });
    }
  } else if (region === 'CANADA') {
    // NBCC 2025 checks
    const steepFillSlopes = slopes.filter(s => s.percentage > 33);
    if (steepFillSlopes.length > 0) {
      problems.push({
        severity: 'critical',
        type: 'code_violation',
        message: `${steepFillSlopes.length} locations exceed 33% (3:1) maximum fill slope per NBCC 2025`,
        impact: 'Non-compliant - consider retaining wall'
      });
    }
  }
}
```

### 4. Update Type Definitions

**`src/components/engineering/GradingResults.tsx`**
- Make `costBreakdown` and `totalCost` optional in props:
```typescript
interface GradingResultsProps {
  design: GradingDesign | null;
  costBreakdown?: CostBreakdown | null;  // Now optional
  totalCost?: number;                    // Now optional
  fglPoints: Point[];
  projectName: string;
}
```

---

## Visual Changes

### Before (Analysis Options)
```
✓ Calculate Cut/Fill Volumes
✓ Find Design Problems  
✓ Suggest Cost Optimizations
✓ Check Drainage Adequacy
✓ Verify Saudi Code Compliance  ← REMOVE
```

### After (Analysis Options)
```
✓ Calculate Cut/Fill Volumes
✓ Find Design Problems  
✓ Suggest Optimizations          ← Rename (remove "Cost")
✓ Check Drainage Adequacy
✓ Verify Regional Code Compliance ← NEW (USA/Canada based on region)
```

### Cost Section - REMOVED
The "Cost Estimate (USD)" card in results will be completely removed since the prices are not accurate.

---

## AI Knowledge Enhancement

The edge functions will be updated with comprehensive knowledge of:

| Standard | USA | Canada |
|----------|-----|--------|
| Permit Trigger | ≥1 acre (EPA CGP) | ≥0.4 ha (Provincial) |
| Max Fill Slope | 50% (2:1) | 33% (3:1) |
| Foundation Drainage | 5% for 10 ft | 5% for 1.8m |
| Excavation Protection | >5 ft | >1.5m |
| Compaction Standard | ASTM D698/D1557 | CSA A23.1:24 |

This knowledge will be embedded in the AI prompts so the AI can:
1. Apply correct slope limits based on region
2. Reference correct code sections in recommendations
3. Flag violations according to regional standards
4. Provide region-specific drainage recommendations

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/engineering/DesignReviewMode.tsx` | Update compliance label from Saudi to Regional |
| `src/components/engineering/GradingResults.tsx` | Remove cost breakdown section |
| `src/components/engineering/GradingPDFReport.tsx` | Remove cost section from PDF |
| `src/components/engineering/GradingDesignerPanel.tsx` | Remove cost state and props |
| `supabase/functions/generate-grading-design/index.ts` | Remove cost calc, add regional standards to AI prompt |
| `supabase/functions/analyze-autocad-design/index.ts` | Replace Saudi with USA/Canada compliance, remove costs |

---

## Implementation Notes

1. **Edge function changes require redeployment** - Functions will be deployed automatically
2. **No database changes** - All changes are frontend and edge function only
3. **Existing data unaffected** - Old designs will still display (cost fields just won't show)
4. **Region parameter** - Already being passed from frontend to edge functions

---

## Effort Estimate

| Task | Time |
|------|------|
| Update DesignReviewMode | 15 min |
| Remove cost from GradingResults | 20 min |
| Remove cost from GradingPDFReport | 20 min |
| Update GradingDesignerPanel | 15 min |
| Update generate-grading-design function | 45 min |
| Update analyze-autocad-design function | 45 min |
| Testing | 30 min |
| **Total** | **~3 hours** |
