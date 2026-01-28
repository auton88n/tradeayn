

# Add NBCC Version Dropdown for CSA Code Selection

## Current State
- `BuildingCodeSelector` allows switching between ACI and CSA
- No option to select between NBCC 2020 and NBCC 2025 when CSA is chosen
- Just a static note mentioning NBCC 2025 exists

## Proposed Solution
Add a secondary dropdown that appears **only when CSA is selected**, allowing users to choose between NBCC 2020 (default/recommended) and NBCC 2025.

---

## Implementation

### 1. Add NBCC Version Type and State

**File**: `src/lib/buildingCodes/types.ts`

Add new type:
```typescript
export type NBCCVersion = '2020' | '2025';
```

### 2. Add NBCC State to Session Context

**File**: `src/contexts/EngineeringSessionContext.tsx`

Add state:
```typescript
const [nbccVersion, setNbccVersion] = useState<NBCCVersion>('2020');
```

Add to context value:
```typescript
nbccVersion,
setNbccVersion,
```

### 3. Update BuildingCodeSelector with Secondary Dropdown

**File**: `src/components/engineering/BuildingCodeSelector.tsx`

When CSA is selected, show a second dropdown below:

```
+------------------------------------------+
| 🇨🇦 CSA                              ▼  |  <- Existing dropdown
+------------------------------------------+

+------------------------------------------+
| NBCC Edition                             |
| +--------------------------------------+ |
| | ✓ NBCC 2020 (Recommended)         ▼ | |  <- NEW dropdown (only for CSA)
| +--------------------------------------+ |
|                                          |
| Options:                                 |
| ✓ NBCC 2020 (Recommended)                |
|   Currently adopted across Canada        |
|                                          |
| ⏱ NBCC 2025 (New)                        |
|   Provincial adoption pending            |
+------------------------------------------+
```

When NBCC 2025 is selected, show warning:
```
[⚠️ Warning Box]
Verify NBCC 2025 has been adopted in your 
jurisdiction before using for permits.
```

### 4. Update Calculator Info Boxes

When CSA + NBCC 2025 is selected, show amber warning instead of the standard note.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/buildingCodes/types.ts` | Add `NBCCVersion` type |
| `src/contexts/EngineeringSessionContext.tsx` | Add `nbccVersion` state + setter |
| `src/components/engineering/BuildingCodeSelector.tsx` | Add NBCC version dropdown when CSA selected |

---

## UI Behavior

1. User selects **ACI** → No NBCC dropdown shown
2. User selects **CSA** → NBCC dropdown appears below with:
   - **NBCC 2020 (Recommended)** - green checkmark, default
   - **NBCC 2025 (New)** - amber clock icon
3. Selecting NBCC 2025 shows jurisdiction warning
4. Calculator info boxes update dynamically based on selection

---

## Effort
~1 hour implementation

