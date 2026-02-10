

# Update Tutorial to Match Current App State

## What's Wrong

The tutorial has outdated content that doesn't match the current app:

1. **"documents" step** -- says "AYN creates stunning PDFs and Excel files" but there's no `DocumentsIllustration` component (it falls back to MeetAynIllustration)
2. **"engineering" step** -- says "6 professional calculators" but the illustration shows 7 (includes "Parking" which is disabled). The actual active calculators are: Grading, Beam, Foundation, Column, Slab, Retaining Wall (6 total)
3. **Step order and relevance** -- the "micro-behaviors" illustration exists but isn't used; the "documents" step has no visual
4. **Engineering illustration shows "Parking"** which is commented out/hidden

## Changes

### 1. Update `src/types/tutorial.types.ts`

Revise the tutorial steps to better reflect what exists:

| Step | Before | After |
|------|--------|-------|
| meet-ayn | (keep) | No change |
| emotions | (keep) | No change |
| empathy | (keep) | No change |
| chat | "Use the mode selector" | Keep, minor wording tweak |
| **documents** | "AYN creates stunning PDFs and Excel files" | **Remove** -- documents are generated via chat, not a standalone feature worth a tutorial step |
| files | "Upload documents or images" | Keep as-is |
| credits | (keep) | No change |
| engineering | "6 professional calculators" | Update to "6 structural calculators: Beam, Column, Slab, Foundation, Retaining Wall, and AI Grading" |
| navigation | (keep) | No change |
| profile | (keep) | No change |
| **compliance** | (doesn't exist) | **Add** -- "Check designs against IRC 2024 and NBC 2025 building codes" -- this is a current standalone feature |

Final step count: 10 steps (remove documents, add compliance)

### 2. Update `src/components/tutorial/TutorialIllustrations.tsx`

- **Remove** the `DocumentsIllustration` reference (doesn't exist anyway, just clean up the unused import in TutorialPage)
- **Fix `EngineeringIllustration`**: Remove "Parking" from the calculator list, update subtitle from "7 Professional Calculators" to "6 Structural Calculators"
- **Add `ComplianceIllustration`**: A new illustration showing a building code checklist with pass/fail indicators, matching the compliance wizard feature

### 3. Update `src/components/tutorial/TutorialPage.tsx`

- Update the `illustrations` mapping to include `'compliance'` and remove `'documents'`
- The mapping already falls back to `MeetAynIllustration` for unknown IDs, so this is mostly cleanup

### Summary of file changes

| File | Change |
|------|--------|
| `src/types/tutorial.types.ts` | Remove "documents" step, add "compliance" step, update engineering description |
| `src/components/tutorial/TutorialIllustrations.tsx` | Fix engineering illustration (remove Parking), add ComplianceIllustration |
| `src/components/tutorial/TutorialPage.tsx` | Update illustrations mapping |

