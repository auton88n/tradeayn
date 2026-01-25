
## Fix Landing Page Issues

This plan addresses three issues:
1. Remove duplicate Privacy Policy from the signup form checkbox
2. Fix the ticketing mockup's edge/line visual problem  
3. Improve clarity and visibility of the engineering mockup

---

## Changes Overview

### 1. Remove Privacy Policy Link from Signup Checkbox
**File: `src/components/auth/AuthModal.tsx`**

The current signup form has:
> "I agree to the Terms & Conditions and Privacy Policy"

Since users will see the full TermsModal (with the complete Privacy Policy) when they first log in, this creates duplication.

**Change:** Simplify the checkbox label to just reference Terms:
> "I agree to the Terms & Conditions"

Remove the `{' '}{t('auth.termsAnd')}{' '}` and the Privacy Policy link from lines 567-576.

---

### 2. Fix Ticketing Mockup Edge/Line Issue
**File: `src/components/services/TicketingMockup.tsx`**

The QR code container and grid have visible edge artifacts due to:
- Gap spacing between grid cells (2px gaps)
- Rounded corners on tiny cells creating visual inconsistency

**Changes:**
- Remove the gap between QR grid cells (`gap-[2px]` → `gap-0`)
- Make the QR cells slightly larger for better visibility
- Add a subtle inner shadow to the QR container to smooth edges
- Ensure proper border-radius consistency

---

### 3. Improve Engineering Mockup Clarity
**File: `src/components/services/EngineeringMockup.tsx`**

The mockup is hard to read due to:
- Very low opacity on building floors (`from-neutral-900/80`)
- Faint cyan colors with low contrast (`text-cyan-400`)
- Small text sizes (`text-[10px]`)

**Changes:**
- Increase opacity on building floor backgrounds
- Boost cyan text contrast (from `text-cyan-400` to `text-cyan-300`)
- Increase font size on key labels from 10px to 11-12px
- Add stronger glow/shadow to the floating result card
- Increase contrast on the "Safe Design" indicator
- Make windows more visible with higher opacity

---

## Technical Details

```text
┌─────────────────────────────────────────────────────────┐
│              AuthModal.tsx (Signup Checkbox)            │
├─────────────────────────────────────────────────────────┤
│ BEFORE:                                                 │
│ "I agree to the Terms & Conditions and Privacy Policy"  │
│                                                         │
│ AFTER:                                                  │
│ "I agree to the Terms & Conditions"                     │
│ (Privacy Policy link removed - covered in TermsModal)   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              TicketingMockup.tsx (QR Fix)               │
├─────────────────────────────────────────────────────────┤
│ • Remove gap-[2px] from grid (makes cells flush)        │
│ • Increase cell size from implicit 2-3px to 4px         │
│ • Add box-shadow for smoother container edges           │
│ • Use proper 7×7 grid sizing                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           EngineeringMockup.tsx (Clarity Fix)           │
├─────────────────────────────────────────────────────────┤
│ • Building floors: neutral-800/90 (was /80)             │
│ • Text color: text-cyan-300 (was cyan-400)              │
│ • Labels: text-[11px] or [12px] (was [10px])            │
│ • Windows: opacity 0.6-0.8 (was 0.4-0.8)                │
│ • Result card: stronger shadow & border                 │
│ • "Safe Design" indicator: brighter emerald             │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Edit

| File | Change |
|------|--------|
| `src/components/auth/AuthModal.tsx` | Remove Privacy Policy link from terms checkbox |
| `src/components/services/TicketingMockup.tsx` | Fix QR code grid gaps and edge lines |
| `src/components/services/EngineeringMockup.tsx` | Increase contrast and text clarity |

---

## Expected Result

1. **Signup form** will show a cleaner, non-redundant terms checkbox
2. **Ticketing mockup** will display a clean QR code without visible edge artifacts
3. **Engineering mockup** will be crisp and readable with proper contrast for all labels and the building visualization
