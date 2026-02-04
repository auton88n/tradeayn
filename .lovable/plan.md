

## Remove Formulas & Move Detailed Results Below 3D Visualization

### Summary

Two changes needed:
1. **Remove formula display** from all results sections (protects backend calculation logic)
2. **Move the Detailed Results Panel** to appear AFTER the 3D visualization for all tools

---

### Current Layout vs. New Layout

```text
CURRENT:                           NEW:
┌──────────────────────┐          ┌──────────────────────┐
│ Calculator Form      │          │ Calculator Form      │
├──────────────────────┤          ├──────────────────────┤
│ Detailed Results     │  ──→     │ 3D Visualization     │
├──────────────────────┤          ├──────────────────────┤
│ 3D Visualization     │          │ Detailed Results     │
└──────────────────────┘          └──────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/engineering/results/BeamResultsSection.tsx` | Remove `formula` props from ResultRow calls |
| `src/components/engineering/results/SlabResultsSection.tsx` | Remove `formula` prop from Factored Load row |
| `src/components/engineering/workspace/EngineeringWorkspace.tsx` | Move DetailedResultsPanel below 3D visualization |

---

### Technical Details

**1. Remove Formulas from BeamResultsSection.tsx**

Lines to update:
- Line 88-95: Remove `formula` prop from Factored Load ResultRow
- Line 105-110: Remove `formula` prop from Maximum Moment ResultRow
- Line 111-116: Remove `formula` prop from Maximum Shear ResultRow

Before:
```tsx
<ResultRow 
  label="Factored Load" 
  value={factoredLoad.toFixed(2)} 
  unit="kN/m"
  formula={`(${dlFactor} × ${deadLoad.toFixed(1)}) + (${llFactor} × ${liveLoad.toFixed(1)})`}
  codeRef={isCSA ? 'CSA A23.3-24, 8.3.2' : 'ASCE 7-22'}
  highlight
/>
```

After:
```tsx
<ResultRow 
  label="Factored Load" 
  value={factoredLoad.toFixed(2)} 
  unit="kN/m"
  codeRef={isCSA ? 'CSA A23.3-24, 8.3.2' : 'ASCE 7-22'}
  highlight
/>
```

**2. Remove Formulas from SlabResultsSection.tsx**

Line 114-120: Remove `formula` prop from Factored Load ResultRow

**3. Move DetailedResultsPanel in EngineeringWorkspace.tsx**

Move the panel from lines 560-570 to AFTER the 3D visualization block (after line 581):

```tsx
{/* Calculator Form */}
{renderCalculatorForm()}

{/* 3D Visualization - skip for parking since it has its own */}
{selectedCalculator !== 'parking' && selectedCalculator !== 'column' && (
  <div className="h-[400px] md:h-[500px] bg-card border border-border/50 rounded-2xl overflow-hidden">
    {(Object.keys(currentInputs).length > 0 || calculationResult) ? (
      renderPreview()
    ) : (
      <PreviewPlaceholder calculatorType={selectedCalculator || undefined} />
    )}
  </div>
)}

{/* Detailed Results Panel - Shows when outputs exist (MOVED HERE) */}
{currentOutputs && selectedCalculator && (
  <Suspense fallback={<LoadingFallback />}>
    <DetailedResultsPanel
      calculatorType={selectedCalculator}
      inputs={currentInputs}
      outputs={currentOutputs}
      buildingCode={selectedBuildingCode}
    />
  </Suspense>
)}
```

---

### What Gets Removed

| Section | Formula Being Removed |
|---------|----------------------|
| Beam - Factored Load | `(1.25 × 15.0) + (1.5 × 10.0)` |
| Beam - Maximum Moment | `wL²/8 = 33.75 × 6² / 8` |
| Beam - Maximum Shear | `wL/2 = 33.75 × 6 / 2` |
| Slab - Factored Load | `(1.25 × DL) + (1.5 × LL)` |

---

### What Stays (Still Visible)

- All numerical results (values with units)
- Code references (e.g., `CSA A23.3-24, 8.3.2`)
- Design check pass/fail status
- Utilization percentages
- Copy-to-clipboard functionality

---

### Result

Engineers will see:
- 3D visualization first for visual understanding
- Detailed numerical results below with values and code citations
- No exposed calculation formulas (protects backend IP)

