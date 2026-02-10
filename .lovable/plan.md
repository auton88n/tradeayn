

# Fix Terms Acceptance + Add Consent Audit Log

## Two Problems Found

### Problem 1: PATCH silently succeeds with zero rows updated
The `supabaseApi.patch()` sends `Prefer: return=minimal`, which means Supabase returns HTTP 200 even when **zero rows are updated**. So if a user's `user_settings` row doesn't exist for any reason, the PATCH "succeeds" but nothing changes. The modal closes, user gets in, then next page load it checks the database again and `has_accepted_terms` is still `false` -- so the modal comes back.

**Fix:** Change the PATCH to use `Prefer: return=representation` so we get the updated row back. If the response is empty (no rows matched), fall back to a POST insert. This guarantees the write actually lands.

### Problem 2: No audit trail for consent
There's no proof that a user accepted the terms. The `user_settings` table just has a boolean flag that can be toggled. For legal compliance, you need an immutable log.

**Fix:** Create a `terms_consent_log` table that records every acceptance with a timestamp, IP info, and which version of the terms they accepted. This is append-only -- users can read their own records but never update or delete them.

---

## Changes

### 1. Database: New `terms_consent_log` table

```
terms_consent_log
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- terms_version (text) -- e.g. "2026-02-07"
- privacy_accepted (boolean)
- terms_accepted (boolean)
- ai_disclaimer_accepted (boolean)
- accepted_at (timestamptz, default now())
- user_agent (text, nullable)
```

RLS policies:
- Users can INSERT their own consent records
- Users can SELECT their own records
- No UPDATE or DELETE allowed (immutable audit log)

### 2. `src/hooks/useAuth.ts` -- Fix acceptTerms

- Pass `Prefer: return=representation` header on the PATCH so we can verify it actually updated a row
- If PATCH returns empty array (no row found), fall back to POST insert
- After successfully writing to `user_settings`, also INSERT a row into `terms_consent_log` with the current terms version and all three checkbox states
- Include `navigator.userAgent` for extra audit proof

### 3. `src/components/shared/TermsModal.tsx` -- Pass checkbox details

- Change `onAccept` prop to pass the three checkbox states to the parent so the consent log can record exactly what was checked
- Updated signature: `onAccept: (consent: { privacy: boolean; terms: boolean; aiDisclaimer: boolean }) => void`

### 4. `src/components/Dashboard.tsx` -- Wire up new signature

- Update the `onAccept` call to pass consent details through to `auth.acceptTerms`

---

## Technical Summary

| Location | Change |
|---|---|
| Database migration | Create `terms_consent_log` table with RLS (insert + select own, no update/delete) |
| `src/hooks/useAuth.ts` | Fix PATCH to verify success, add POST fallback, write consent log entry |
| `src/components/shared/TermsModal.tsx` | Pass checkbox states through `onAccept` callback |
| `src/components/Dashboard.tsx` | Wire updated `onAccept` signature |

