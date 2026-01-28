
# Remove Saudi Arabia References & Update AI Knowledge for USA/Canada Only

## Summary

This plan removes all Saudi Arabia building code references (SBC 304, MOT, SAR currency, Saudi cities) from the entire codebase and updates all AI systems to only reference USA (ACI 318-25) and Canada (CSA A23.3-24) standards. It also removes cost estimation logic that uses Saudi Riyal (SAR) pricing.

---

## Files to Modify

### 1. Frontend Library - Engineering Knowledge Base

**`src/lib/engineeringKnowledge.ts`**

Remove the entire `saudiBuildingCode` section (lines 203-228):
```typescript
// DELETE THIS ENTIRE SECTION:
saudiBuildingCode: {
  version: "SBC 304-2018",
  requirements: {
    concreteGradeMin: 25,
    coverForExposure: "SBC Table 7.7.1",
    seismicZones: { Riyadh, Jeddah, Dammam, Makkah, Madinah },
    fireRating: {...}
  },
  loadRequirements: {
    windSpeed: { Riyadh, Jeddah, coastal }
  }
}
```

Add new regional grading standards knowledge (USA EPA/OSHA/IBC, Canada CSA/CCME/NBCC) to match the gradingStandards.ts file.

### 2. Frontend Library - AYN Personality

**`src/lib/aynPersonality.ts`**

Update line 86 - change default building code reference:
```typescript
// BEFORE:
- building code requirements (${engineeringContext?.buildingCode || 'SBC/IBC'})

// AFTER:
- building code requirements (${engineeringContext?.buildingCode || 'ACI 318-25/CSA A23.3-24'})
```

Update line 158 - remove 'sbc' from engineering keywords:
```typescript
// BEFORE:
'engineering', 'civil', 'construction', 'building code', 'sbc', 'ibc'

// AFTER:
'engineering', 'civil', 'construction', 'building code', 'aci', 'csa', 'ibc'
```

### 3. Frontend Hook - Messages

**`src/hooks/useMessages.ts`**

Update line 346 - remove SBC default building code:
```typescript
// BEFORE:
buildingCode: userProfile?.business_type ? 'SBC 304-2018' : undefined,

// AFTER:
buildingCode: userProfile?.business_type ? 'ACI 318-25' : undefined,
```

### 4. Frontend Component - Engineering Benchmark

**`src/components/admin/test-results/EngineeringBenchmark.tsx`**

Update line 44 - replace SBC_304 with CSA:
```typescript
// BEFORE:
standardsCompliance: { ACI_318: boolean; EUROCODE_2: boolean; SBC_304: boolean };

// AFTER:
standardsCompliance: { ACI_318: boolean; CSA_A23_3: boolean; EUROCODE_2: boolean };
```

---

## Edge Functions to Update

### 5. Main AI Chat - ayn-unified

**`supabase/functions/ayn-unified/index.ts`**

Update line 343 - replace SBC reference with USA/Canada codes:
```typescript
// BEFORE:
- building codes: ${context.buildingCode || 'SBC 304 (Saudi), ACI 318, IBC'}

// AFTER:
- building codes: ${context.buildingCode || 'ACI 318-25 (USA), CSA A23.3-24 (Canada)'}
```

Add regional grading standards knowledge to the engineering mode prompt:
```
GRADING STANDARDS (USA/Canada):

USA Standards:
- Storm Water: EPA 2022 CGP - permits required ≥1 acre
- Excavation: OSHA 29 CFR 1926 Subpart P
  * Stable rock: 90°, Type A: 53°, Type B: 45°, Type C: 34°
- Drainage: IBC 2024 Section 1804.4
  * Foundation: 5% slope for 10ft, Max fill: 50% (2:1)
- Compaction: ASTM D698/D1557 - 95% Standard Proctor

CANADA Standards:
- Storm Water: Provincial permits ~0.4 hectares
- Excavation: Provincial OHS - max unprotected 1.5m
- Drainage: NBCC 2025
  * Foundation: 5% slope for 1.8m, Max fill: 33% (3:1)
- Compaction: CSA A23.1:24 with frost protection

Apply standards based on user's selected region.
```

### 6. Engineering AI Agent

**`supabase/functions/engineering-ai-agent/index.ts`**

Update line 247 - replace SBC with CSA:
```typescript
// BEFORE:
- reference codes (ACI 318, SBC 304, Eurocode 2) when relevant

// AFTER:
- reference codes (ACI 318-25, CSA A23.3-24, Eurocode 2) when relevant
```

### 7. Engineering AI Analysis - Remove SAR Cost Estimation

**`supabase/functions/engineering-ai-analysis/index.ts`**

Remove all cost estimation logic (lines 69-79 and 105-114) that uses SAR pricing. Remove the entire `costEstimate` array generation:

```typescript
// DELETE these sections:
// Cost estimate (Saudi Riyal)
const concretePrice = inputs.concreteGrade === 'C30' ? 310 : 280;
const concreteCost = outputs.concreteVolume * concretePrice;
const steelCost = outputs.steelWeight * 2.7; // ~2700 SAR/ton
...
```

Update the return type to not include costEstimate, or return an empty array.

### 8. Engineering AI Validator

**`supabase/functions/engineering-ai-validator/index.ts`**

Update lines 61-63 and 1064-1067 and 1102-1105 - replace SBC_304 with CSA_A23_3:
```typescript
// BEFORE:
standardsCompliance: {
  ACI_318: boolean;
  EUROCODE_2: boolean;
  SBC_304: boolean;
};

// AFTER:
standardsCompliance: {
  ACI_318: boolean;
  CSA_A23_3: boolean;
  EUROCODE_2: boolean;
};
```

### 9. AI UX Tester

**`supabase/functions/ai-ux-tester/index.ts`**

Update lines 94-103 - change Saudi persona to Canadian:
```typescript
// BEFORE:
{
  id: 'arabic_engineer',
  name: 'مهندس سعودي',
  description: 'Saudi engineer preferring Arabic interface',
  ...
}

// AFTER:
{
  id: 'canadian_engineer',
  name: 'Canadian Engineer',
  description: 'Canadian engineer using CSA standards',
  language: 'en',
  expertise: 'intermediate',
  patience: 'medium',
  deviceType: 'desktop',
  typingSpeed: 45,
  readingSpeed: 280,
}
```

---

## Changes Summary Table

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/engineeringKnowledge.ts` | Delete section | Remove entire `saudiBuildingCode` object |
| `src/lib/aynPersonality.ts` | Update text | Replace SBC with ACI/CSA references |
| `src/hooks/useMessages.ts` | Update default | Change default building code from SBC to ACI |
| `src/components/admin/.../EngineeringBenchmark.tsx` | Update type | Replace SBC_304 with CSA_A23_3 |
| `supabase/functions/ayn-unified/index.ts` | Update prompt | Add USA/Canada grading standards, remove SBC |
| `supabase/functions/engineering-ai-agent/index.ts` | Update prompt | Replace SBC with CSA references |
| `supabase/functions/engineering-ai-analysis/index.ts` | Remove logic | Delete SAR cost estimation entirely |
| `supabase/functions/engineering-ai-validator/index.ts` | Update type | Replace SBC_304 with CSA_A23_3 |
| `supabase/functions/ai-ux-tester/index.ts` | Update persona | Change Saudi persona to Canadian |

---

## AI Knowledge Updates

All engineering AI systems will be updated to include:

1. **Structural Codes**: ACI 318-25 (USA) and CSA A23.3-24 (Canada) only
2. **Load Codes**: ASCE 7-22 (USA) and NBCC 2020/2025 (Canada)
3. **Grading Standards**:
   - USA: EPA 2022 CGP, OSHA 29 CFR 1926, IBC 2024, ASTM D698/D1557
   - Canada: Provincial OHS, NBCC 2025, CSA A23.1:24
4. **Slope Limits**:
   - USA: Max fill 50% (2:1), Foundation 5% for 10ft
   - Canada: Max fill 33% (3:1), Foundation 5% for 1.8m

---

## Deployment Notes

- 6 edge functions require redeployment after changes
- No database schema changes required
- Frontend changes will take effect immediately after build
- Existing calculations remain unaffected (SBC compliance field will be unused)

---

## Effort Estimate

| Task | Time |
|------|------|
| Update engineeringKnowledge.ts | 15 min |
| Update aynPersonality.ts | 10 min |
| Update useMessages.ts | 5 min |
| Update EngineeringBenchmark.tsx | 10 min |
| Update ayn-unified edge function | 30 min |
| Update engineering-ai-agent | 10 min |
| Update engineering-ai-analysis | 20 min |
| Update engineering-ai-validator | 15 min |
| Update ai-ux-tester | 10 min |
| Testing | 30 min |
| **Total** | **~2.5 hours** |
