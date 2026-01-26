
# Fix Engineering Back Button Navigation

## Summary

Update the "Back" button in the Engineering Workspace to navigate to the AYN dashboard (`/`) instead of the Civil Engineering service page (`/services/civil-engineering`).

---

## Current Behavior

When at the calculator selection screen (no calculator open), clicking "Back" navigates to:
```
/services/civil-engineering
```

## Expected Behavior

The "Back" button should navigate to the main AYN dashboard:
```
/
```

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/engineering/workspace/EngineeringWorkspace.tsx` | Update line 151 from `/services/civil-engineering` to `/` |

---

## Implementation

**Line 142-153 (handleBack function):**

```text
Before:
const handleBack = () => {
  if (selectedCalculator) {
    setSelectedCalculator(null);
    setCurrentInputs({});
    setCurrentOutputs(null);
    setCalculationResult(null);
  } else {
    navigate('/services/civil-engineering');  // ← Wrong destination
  }
};

After:
const handleBack = () => {
  if (selectedCalculator) {
    setSelectedCalculator(null);
    setCurrentInputs({});
    setCurrentOutputs(null);
    setCalculationResult(null);
  } else {
    navigate('/');  // ← Navigate to AYN dashboard
  }
};
```

---

## Optional Enhancement

Import and use the centralized route constant for type-safety:

```typescript
import { ROUTES } from '@/constants/routes';

// Then in handleBack:
navigate(ROUTES.HOME);
```

---

## Expected Result

- Clicking "Back" from a calculator → returns to calculator selection
- Clicking "Back" from calculator selection → returns to AYN dashboard (`/`)
