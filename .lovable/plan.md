

## Critical Foundation Calculator Safety Fixes

### Issues Identified

After analyzing the edge function (`calculate-foundation/index.ts`), I found **4 critical safety issues**:

---

### Issue 1: FOS Applied Backwards (CRITICAL)

**Current Code (Line 102-104):**
```typescript
const allowableBearing = bearingCapacity / 1.5;  // WRONG!
const requiredArea = columnLoad / allowableBearing;
```

**Problem:** The code DIVIDES by 1.5, making the allowable bearing LOWER than input, resulting in LARGER footings. But then the actual pressure check on line 124 uses:
```typescript
const actualPressure = columnLoad / area;
```

This is inconsistent - if input is already allowable bearing (common practice), dividing by 1.5 again is over-conservative. But if input is ultimate bearing, the calculation is correct.

**Your Test Case:**
- Input: P = 1500 kN, q_allow = 200 kPa
- Current: allowable = 200/1.5 = 133 kPa → Area = 1500/133 = 11.3 m²
- Output shows: 1.4m × 3.4m = 4.76 m² ← **DOES NOT MATCH**

This suggests the calculator may be using moments incorrectly to REDUCE dimensions.

---

### Issue 2: Moment/Eccentricity Logic is WRONG (CRITICAL)

**Current Code (Lines 110-116):**
```typescript
if (momentX > 0 || momentY > 0) {
  const ex = columnLoad > 0 ? momentX / columnLoad : 0;
  const ey = columnLoad > 0 ? momentY / columnLoad : 0;
  length = Math.max(length, 6 * ex + columnWidth / 1000);
  width = Math.max(width, 6 * ey + columnDepth / 1000);
}
```

**Problems:**
1. `6 * ex` is the "middle third rule" check (e < L/6), but this sets minimum L = 6e, which is correct for preventing tension
2. However, this ONLY ensures e < L/6, it does NOT account for increased bearing pressure due to eccentricity
3. Maximum bearing pressure should be: `q_max = (P/A) × (1 + 6e/L)` but this is never calculated
4. The actual pressure check only uses `P/A` (uniform pressure assumption)

**With Your Inputs:**
- P = 1500 kN, Mx = 100 kN·m, My = 50 kN·m
- ex = 100/1500 = 0.067 m, ey = 50/1500 = 0.033 m
- Minimum L = 6 × 0.067 = 0.4 m (tiny!)
- Minimum W = 6 × 0.033 = 0.2 m (tiny!)

The moments barely affect the size because the eccentricities are small relative to the base area calculation.

---

### Issue 3: Maximum Bearing Pressure Not Calculated

**Should Calculate:**
```
q_max = (P/A) × (1 + 6*ex/L + 6*ey/B)
q_min = (P/A) × (1 - 6*ex/L - 6*ey/B)
```

**Current:** Only calculates `q_avg = P/A` and ignores moment effects on pressure distribution.

---

### Issue 4: No Eccentricity Limit Warning

The calculator doesn't warn when:
- `ex > L/6` (tension under footing - not allowed for soil)
- `ey > B/6` (tension under footing)

---

### Recommended Fixes

#### Fix 1: Correct Bearing Pressure Calculation

```typescript
// Calculate eccentricities
const ex = momentX / columnLoad;
const ey = momentY / columnLoad;

// Initial size based on uniform pressure
let length = Math.sqrt(columnLoad / bearingCapacity);
let width = length;

// Iterate to find size where q_max <= q_allowable
// q_max = (P/A) * (1 + 6*ex/L + 6*ey/B)
let iterations = 0;
while (iterations < 20) {
  const qMax = (columnLoad / (length * width)) * 
               (1 + 6 * ex / length + 6 * ey / width);
  
  if (qMax <= bearingCapacity) break;
  
  // Increase dimensions
  length *= 1.1;
  width *= 1.1;
  iterations++;
}

// Ensure middle third rule (no tension)
length = Math.max(length, 6 * ex);
width = Math.max(width, 6 * ey);
```

#### Fix 2: Return Pressure Distribution Values

```typescript
return {
  // ... existing outputs ...
  
  // Bearing pressure distribution
  qMax: Math.round(qMax * 10) / 10,
  qMin: Math.round(qMin * 10) / 10,
  qAvg: Math.round(qAvg * 10) / 10,
  
  // Eccentricity checks
  eccentricityX: Math.round(ex * 1000) / 1000,
  eccentricityY: Math.round(ey * 1000) / 1000,
  middleThirdOK: ex < length/6 && ey < width/6,
}
```

#### Fix 3: Update Results Panel

Add to `FoundationResultsSection.tsx`:
- **Bearing Pressure Distribution**: Show q_max, q_min, q_avg
- **Eccentricity Check**: Show ex, ey with middle third status
- **Design Check**: Add "Load within middle third" check

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/calculate-foundation/index.ts` | Fix bearing pressure calculation with eccentricity |
| `src/components/engineering/results/FoundationResultsSection.tsx` | Display q_max, q_min, eccentricity values |

---

### Updated Edge Function Logic

```typescript
// === CORRECTED FOUNDATION SIZING ===

// 1. Calculate eccentricities
const ex = momentX > 0 && columnLoad > 0 ? momentX / columnLoad : 0;
const ey = momentY > 0 && columnLoad > 0 ? momentY / columnLoad : 0;

// 2. Initial estimate (uniform pressure)
let length = Math.sqrt(columnLoad / bearingCapacity) * 1.2; // 20% margin
let width = length;

// 3. Iterate to satisfy q_max <= q_allowable
for (let i = 0; i < 25; i++) {
  const area = length * width;
  const qUniform = columnLoad / area;
  
  // Maximum pressure with biaxial eccentricity
  const qMax = qUniform * (1 + 6 * ex / length + 6 * ey / width);
  
  if (qMax <= bearingCapacity) break;
  
  // Increase both dimensions proportionally
  const factor = Math.sqrt(qMax / bearingCapacity);
  length = Math.ceil(length * factor * 10) / 10;
  width = Math.ceil(width * factor * 10) / 10;
}

// 4. Ensure middle third rule (no tension under footing)
length = Math.max(length, 6 * ex);
width = Math.max(width, 6 * ey);

// 5. Round to 100mm increments
length = Math.ceil(length * 10) / 10;
width = Math.ceil(width * 10) / 10;

// 6. Calculate final pressures
const area = length * width;
const qAvg = columnLoad / area;
const qMax = qAvg * (1 + 6 * ex / length + 6 * ey / width);
const qMin = qAvg * (1 - 6 * ex / length - 6 * ey / width);
const middleThirdOK = qMin >= 0;
```

---

### Updated Results Section Display

**New "Bearing Pressure" section:**
```
BEARING PRESSURE DISTRIBUTION
- Maximum Pressure (q_max): 185.4 kPa [CSA 21.2]
- Minimum Pressure (q_min): 102.6 kPa
- Average Pressure (q_avg): 144.0 kPa
- Allowable Bearing: 200 kPa
- Utilization: 93%

ECCENTRICITY CHECK
- ex = 0.067 m (Mx/P)
- ey = 0.033 m (My/P)
- Middle Third: OK (no tension)
```

---

### Verification with Your Test Case

**Inputs:**
- P = 1500 kN
- Mx = 100 kN·m, My = 50 kN·m
- q_allow = 200 kPa

**Expected with Correct Logic:**
- ex = 100/1500 = 0.067 m
- ey = 50/1500 = 0.033 m
- Start: L = W = sqrt(1500/200) = 2.74 m
- Check q_max = (1500/7.5) * (1 + 6×0.067/2.74 + 6×0.033/2.74)
- q_max = 200 × (1 + 0.146 + 0.072) = 200 × 1.218 = 243.6 kPa > 200 ← FAIL
- Increase to L = W = 3.0 m → Area = 9.0 m²
- q_max = (1500/9) × 1.218 = 203 kPa ← Still over
- Increase to L = W = 3.1 m → Area = 9.6 m²
- q_max = (1500/9.6) × 1.21 = 189 kPa ← OK

**Correct Output:** ~3.1m × 3.1m = 9.6 m² (not 4.76 m²)

---

### Implementation Order

1. Update `calculate-foundation/index.ts` with correct eccentricity logic
2. Add q_max, q_min, eccentricity values to response
3. Update `FoundationResultsSection.tsx` to display new values
4. Add "Middle Third Check" to design checks
5. Deploy and test with the user's test case

