

# Fix Terms Acceptance: Database as Source of Truth

## Problem

When the database returns `has_accepted_terms = false`, the current code falls through to check localStorage, allowing users to bypass the terms modal by manually setting a localStorage key via DevTools. This is a legal compliance risk.

## Change

**File: `src/hooks/useAuth.ts`** -- Replace the terms processing block inside `runQueries` (approximately lines 149-163).

**Current logic:**
- DB says accepted -> trust it, sync to localStorage
- DB says not accepted -> check localStorage as override (BUG)
- DB query failed -> check localStorage

**New logic:**
- DB says accepted -> trust it, sync to localStorage
- DB says not accepted -> trust DB, clear localStorage
- DB query failed (null result) -> use localStorage as temporary fallback only

**Before:**
```typescript
if (settingsData) {
  const dbTermsAccepted = settingsData?.[0]?.has_accepted_terms ?? false;
  if (dbTermsAccepted) {
    setHasAcceptedTerms(true);
    localStorage.setItem(`terms_accepted_${user.id}`, 'true');
  } else {
    const localTermsAccepted = localStorage.getItem(`terms_accepted_${user.id}`) === 'true';
    setHasAcceptedTerms(localTermsAccepted);
  }
} else {
  const localTermsAccepted = localStorage.getItem(`terms_accepted_${user.id}`) === 'true';
  setHasAcceptedTerms(localTermsAccepted);
}
```

**After:**
```typescript
if (settingsData) {
  const dbTermsAccepted = settingsData?.[0]?.has_accepted_terms ?? false;
  setHasAcceptedTerms(dbTermsAccepted);
  if (dbTermsAccepted) {
    localStorage.setItem(`terms_accepted_${user.id}`, 'true');
  } else {
    localStorage.removeItem(`terms_accepted_${user.id}`);
  }
} else {
  const localTermsAccepted = localStorage.getItem(`terms_accepted_${user.id}`) === 'true';
  setHasAcceptedTerms(localTermsAccepted);
}
```

One file, one block replacement. No other changes needed.

