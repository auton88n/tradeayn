

## Fix: Save to Portfolio Dialog Not Receiving Calculator Data

### Problem Analysis

The Save to Portfolio dialog shows zeros because the workspace's `currentInputs` and `currentOutputs` state variables are **not being updated** by most calculators.

```text
Data Flow (Current - Broken):

┌──────────────────┐     ┌────────────────────────┐     ┌─────────────────────┐
│ BeamCalculator   │     │ EngineeringWorkspace   │     │ SaveDesignDialog    │
│                  │     │                        │     │                     │
│ formData = {     │     │ currentInputs = {}     │────►│ inputs = {} (EMPTY) │
│   span: '6.0',   │  ✗  │ currentOutputs = null  │     │ outputs = null      │
│   deadLoad: '15' │ ──► │                        │     │                     │
│ }                │     │ (never receives data)  │     │ Shows 0m, 0 kN/m    │
└──────────────────┘     └────────────────────────┘     └─────────────────────┘
```

**Root Cause:** 
- The workspace passes `onInputChange` callback to calculators (line 203)
- **BeamCalculator** doesn't have `onInputChange` in its props interface and never calls it
- **FoundationCalculator**, **SlabCalculator**, **RetainingWallCalculator** - same issue
- Only **ColumnCalculator** and **GradingDesigner** properly call `onInputChange?.(newInputs)`

### Solution

Update each calculator to:
1. Add `onInputChange?: (inputs: Record<string, any>) => void` to its props interface
2. Call `onInputChange?.(inputs)` when form data changes
3. Also sync inputs when component mounts (to pass default values)

```text
Data Flow (Fixed):

┌──────────────────┐     ┌────────────────────────┐     ┌─────────────────────┐
│ BeamCalculator   │     │ EngineeringWorkspace   │     │ SaveDesignDialog    │
│                  │     │                        │     │                     │
│ formData = {     │     │ currentInputs = {      │────►│ inputs = {          │
│   span: '6.0',   │ ──► │   span: 6.0,           │     │   span: 6.0, ...    │
│   deadLoad: '15' │  ✓  │   deadLoad: 15, ...    │     │ }                   │
│ }                │     │ }                      │     │                     │
│                  │     │                        │     │                     │
│ onInputChange?.  │     │ currentOutputs = {     │────►│ outputs = {         │
│   (formData)     │     │   totalDepth: 650,...  │     │   totalDepth: 650   │
│                  │     │ }                      │     │ }                   │
└──────────────────┘     └────────────────────────┘     └─────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/engineering/BeamCalculator.tsx` | Add `onInputChange` prop, call it on input changes + mount |
| `src/components/engineering/FoundationCalculator.tsx` | Add `onInputChange` prop, call it on input changes + mount |
| `src/components/engineering/SlabCalculator.tsx` | Add `onInputChange` prop, call it on input changes + mount |
| `src/components/engineering/RetainingWallCalculator.tsx` | Add `onInputChange` prop, call it on input changes + mount |

---

### Technical Implementation Details

**For each calculator, the pattern is:**

1. **Update Props Interface**
```typescript
interface BeamCalculatorProps {
  // ... existing props
  onInputChange?: (inputs: Record<string, any>) => void;
}
```

2. **Extract prop in component**
```typescript
const BeamCalculator = forwardRef<BeamCalculatorRef, BeamCalculatorProps>(
  ({ onCalculate, isCalculating, setIsCalculating, userId, onReset, onInputChange }, ref) => {
```

3. **Call on mount to sync default values**
```typescript
useEffect(() => {
  const inputs = {
    span: parseFloat(formData.span),
    deadLoad: parseFloat(formData.deadLoad),
    // ... all fields
  };
  onInputChange?.(inputs);
}, []);
```

4. **Call on every input change**
```typescript
const handleInputChange = (field: string, value: string) => {
  const newFormData = { ...formData, [field]: value };
  setFormData(newFormData);
  
  // Sync to parent
  onInputChange?.({
    span: parseFloat(newFormData.span),
    deadLoad: parseFloat(newFormData.deadLoad),
    // ... all fields as numbers
  });
};
```

---

### Expected Outcome

After fix:
- Dialog shows **Span: 6m** (actual input value)
- Dialog shows **Load: 25 kN/m** (dead + live)
- Dialog shows **Size: 300x650mm** (from outputs)
- Dialog shows **Reinforcement: 7Ø25** (from outputs)
- Portfolio saves complete data for history

### Notes
- The `ColumnCalculator` already implements this pattern correctly (line 106)
- No changes needed to `SaveDesignDialog.tsx` - it correctly reads `inputs` and `outputs` props
- No changes needed to `EngineeringWorkspace.tsx` - it already passes `onInputChange` callback
- The `ParkingDesigner` uses a different approach (passes data directly to dialog) so no changes needed there

