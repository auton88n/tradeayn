

# Add "Maximum Liability" Subsection to Section 5 (Payment Terms)

## What Changes

Add a new subsection called "Maximum Liability" at the end of Section 5 (Payment Terms), after the existing "Disputes" subsection in `src/pages/Terms.tsx`.

## Content

The new subsection will include:
- Title: "Maximum Liability"
- An introductory line: "In no event shall our total liability exceed the lesser of:"
- Two bullet points:
  - The amount you paid to AYN in the 12 months preceding any claim
  - $100 USD (or equivalent in your local currency)
- A closing paragraph about the limitation applying to all claims regardless of legal theory.

## Technical Detail

- Uses the existing `SubSection`, `BulletList`, and `<p>` components already in the file -- no new components needed.
- Inserted right after the "Disputes" subsection inside `PolicySection number="5"`.
- No other files affected.

