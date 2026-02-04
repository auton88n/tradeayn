

## M-N Interaction Diagram for Column Calculator

### Overview

Add a professional axial-moment interaction diagram to the column results section, providing engineers with instant visual confirmation of design adequacy. The diagram will display the column capacity envelope with the applied load point plotted for immediate verification.

---

### Visual Design

```text
┌──────────────────────────────────────────────────────────────────┐
│  M-N Interaction Diagram                                         │
│                                                                   │
│  Pn (kN)                                                          │
│    │                                                              │
│ P0 ├─●─────────────────  ← Pure Compression (P0)                  │
│    │   ●                                                          │
│    │     ●                                                        │
│    │       ●  Capacity Curve                                      │
│    │         ●                                                    │
│ Pd ├─────────────★───●──  ← Applied Load Point (Pd, Md)           │
│    │               ●                                              │
│    │             ●  ← Balanced Point (Pb, Mb)                     │
│    │           ●                                                  │
│    │         ●                                                    │
│    │       ●                                                      │
│    │     ●                                                        │
│    │   ●                                                          │
│  0 └───────────────────────────────────────────── Mn (kN·m)       │
│    0                Mb                      M0                    │
│                                                                   │
│  Legend:  ● Capacity Curve   ★ Applied Load   ─ Balanced Point    │
│                                                                   │
│  Status: ✓ INSIDE CAPACITY ENVELOPE - ADEQUATE                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### Technical Approach

**Backend Enhancement** - Update the column calculation to generate interaction curve points:

1. **Generate 15-20 points** along the capacity envelope:
   - Pure compression point (P0, M=0)
   - Points in compression-controlled zone
   - Balanced failure point (Pb, Mb)
   - Points in tension-controlled zone
   - Pure bending point (P=0, M0)

2. **Calculation methodology** (simplified for rectangular sections):
   - Vary neutral axis depth `c` from full depth to zero
   - For each `c`, calculate corresponding Pn and Mn
   - Apply phi factors based on strain conditions (CSA/ACI)

**Frontend Component** - Create InteractionDiagram using recharts:

1. **ScatterChart** with capacity curve as connected points
2. **Applied load point** as distinct marker (star)
3. **Reference lines** for balanced point
4. **Color-coded zones**: compression (blue), tension (orange)
5. **Status indicator** based on point location

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/engineeringCalculations.ts` | Add `generateInteractionCurve()` function and include curve data in `calculateColumn()` output |
| `src/components/engineering/results/ColumnResultsSection.tsx` | Import and render new `InteractionDiagram` component |
| `src/components/engineering/results/InteractionDiagram.tsx` | **NEW** - Recharts-based M-N diagram component |
| `src/components/engineering/results/index.ts` | Export new component |

---

### Interaction Curve Generation Logic

```typescript
interface InteractionPoint {
  P: number;  // Axial capacity (kN)
  M: number;  // Moment capacity (kN·m)
  type: 'compression' | 'balanced' | 'tension';
}

function generateInteractionCurve(
  b: number,      // Width (mm)
  h: number,      // Depth (mm)
  As: number,     // Steel area (mm²)
  fcd: number,    // Design concrete strength (MPa)
  fyd: number,    // Design steel strength (MPa)
  cover: number   // Cover (mm)
): InteractionPoint[] {
  const points: InteractionPoint[] = [];
  const d = h - cover - 10;  // Effective depth
  const dPrime = cover + 10; // Compression steel depth
  const epsilon_cu = 0.0035; // Ultimate concrete strain
  const epsilon_y = fyd / 200000; // Yield strain
  
  // Pure compression (c → ∞)
  const P0 = 0.8 * (0.85 * fcd * b * h + As * fyd) / 1000;
  points.push({ P: P0, M: 0, type: 'compression' });
  
  // Vary c from h to 0
  const cValues = [
    h, 0.9*h, 0.8*h, 0.7*h,  // Compression zone
    d * epsilon_cu / (epsilon_cu + epsilon_y),  // Balanced
    0.5*d, 0.4*d, 0.3*d, 0.2*d, 0.1*d, 0.05*d  // Tension zone
  ];
  
  for (const c of cValues) {
    // Calculate strains
    const epsilon_s = epsilon_cu * (d - c) / c;
    const epsilon_sPrime = epsilon_cu * (c - dPrime) / c;
    
    // Steel stresses (capped at yield)
    const fs = Math.min(epsilon_s * 200000, fyd);
    const fsPrime = Math.min(epsilon_sPrime * 200000, fyd);
    
    // Forces
    const a = 0.8 * c; // Stress block depth
    const Cc = 0.85 * fcd * b * Math.min(a, h);
    const Cs = (As / 2) * fsPrime;
    const Ts = (As / 2) * fs;
    
    // Axial and moment
    const Pn = (Cc + Cs - Ts) / 1000;
    const Mn = (Cc * (h/2 - a/2) + Cs * (h/2 - dPrime) + Ts * (d - h/2)) / 1e6;
    
    const isBalanced = Math.abs(c - d * epsilon_cu / (epsilon_cu + epsilon_y)) < 5;
    points.push({
      P: Math.max(Pn, 0),
      M: Math.max(Mn, 0),
      type: isBalanced ? 'balanced' : (c > d * 0.6 ? 'compression' : 'tension')
    });
  }
  
  // Pure bending (P = 0)
  // ... calculate M0
  
  return points.filter(p => p.P >= 0 && p.M >= 0);
}
```

---

### InteractionDiagram Component

```tsx
// src/components/engineering/results/InteractionDiagram.tsx

import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  curvePoints: Array<{ P: number; M: number; type: string }>;
  appliedP: number;  // Applied axial load (kN)
  appliedM: number;  // Applied moment (kN·m)
  buildingCode: 'CSA' | 'ACI';
}

export const InteractionDiagram: React.FC<Props> = ({
  curvePoints, appliedP, appliedM, buildingCode
}) => {
  // Determine if load point is inside capacity envelope
  const isAdequate = checkInsideEnvelope(curvePoints, appliedP, appliedM);
  
  // Find balanced point
  const balancedPoint = curvePoints.find(p => p.type === 'balanced');
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">
        M-N Interaction Diagram
      </h4>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="M"
              name="Moment"
              unit=" kN·m"
              domain={[0, 'auto']}
            />
            <YAxis
              type="number"
              dataKey="P"
              name="Axial"
              unit=" kN"
              domain={[0, 'auto']}
            />
            
            {/* Capacity curve */}
            <Scatter
              name="Capacity Envelope"
              data={curvePoints}
              line={{ stroke: '#3b82f6', strokeWidth: 2 }}
              fill="#3b82f6"
              shape="circle"
            >
              {curvePoints.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.type === 'compression' ? '#3b82f6' : 
                        entry.type === 'balanced' ? '#f59e0b' : '#22c55e'}
                />
              ))}
            </Scatter>
            
            {/* Applied load point */}
            <Scatter
              name="Applied Load"
              data={[{ P: appliedP, M: appliedM }]}
              fill="#ef4444"
              shape="star"
            />
            
            {/* Balanced point reference */}
            {balancedPoint && (
              <ReferenceLine
                y={balancedPoint.P}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label="Balanced"
              />
            )}
            
            <Tooltip />
            <Legend />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      {/* Status indicator */}
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg text-sm",
        isAdequate 
          ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
          : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
      )}>
        {isAdequate ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Load point INSIDE capacity envelope - ADEQUATE
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4" />
            Load point OUTSIDE capacity envelope - INADEQUATE
          </>
        )}
      </div>
    </div>
  );
};
```

---

### Data Flow

```text
ColumnCalculator
    │
    ▼
calculateColumn() ───► Returns outputs including:
    │                   - interactionCurve: InteractionPoint[]
    │                   - appliedP: number
    │                   - appliedM: number
    ▼
ColumnResultsSection
    │
    ▼
InteractionDiagram ───► Renders recharts ScatterChart
                        with capacity curve and load point
```

---

### Updated Column Outputs

Add to `calculateColumn()` return object:

```typescript
return {
  // ... existing outputs ...
  
  // Interaction diagram data
  interactionCurve: generateInteractionCurve(b, h, AsProvided, fcd, fyd, cover),
  appliedP: axialLoad,
  appliedM: Math.sqrt(Mdx * Mdx + Mdy * Mdy), // Resultant moment for biaxial
  balancedPoint: { P: Pb, M: Mb },
  pureCompression: P0,
  pureBending: M0,
};
```

---

### Integration into ColumnResultsSection

Add after the "Load Analysis" section:

```tsx
{/* Interaction Diagram */}
{outputs.interactionCurve && outputs.interactionCurve.length > 0 && (
  <>
    <Separator />
    <InteractionDiagram
      curvePoints={outputs.interactionCurve}
      appliedP={axialLoad}
      appliedM={Number(outputs.designMomentX) || 0}
      buildingCode={buildingCode}
    />
  </>
)}
```

---

### Implementation Order

1. Create `InteractionDiagram.tsx` component with recharts visualization
2. Add `generateInteractionCurve()` helper function to `engineeringCalculations.ts`
3. Update `calculateColumn()` to include interaction curve data in output
4. Update `ColumnResultsSection.tsx` to render the diagram
5. Export from `index.ts`
6. Test with various load combinations

---

### Expected Outcome

After implementation, engineers will see:

- Visual capacity envelope showing safe design region
- Applied load point clearly marked
- Instant pass/fail indication
- Color-coded zones (compression/balanced/tension)
- Professional diagram suitable for reports

