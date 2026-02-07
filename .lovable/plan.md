

# Fix Terms and Privacy Pages: Remove RTL, Force LTR

## Problem

Both the Terms (`/terms`) and Privacy (`/privacy`) pages use `useLanguage()` to get `direction` and apply `dir={direction}` to the wrapper div. When the language is set to Arabic, these pages render in RTL, but the user wants them always LTR.

## Changes

### File: `src/pages/Terms.tsx`
- Remove the `useLanguage` import and hook call
- Remove `dir={direction}` from the wrapper div (defaults to LTR)

### File: `src/pages/Privacy.tsx`
- Remove the `useLanguage` import and hook call
- Remove `dir={direction}` from the wrapper div (defaults to LTR)

Both pages will always render left-to-right regardless of the selected language.

