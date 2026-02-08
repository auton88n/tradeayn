

# Remove Business Context Encryption

## Problem
The `business_context` field uses database-level encryption via RPC functions (`update_profile_business_context` / `get_profile_business_context`) that require a Vault encryption key. This key is not configured, causing every profile save to fail with "Encryption key not configured."

## What Changes

### 1. Database Migration (SQL)
- Add a new `business_context` column (plain `text`) to the `profiles` table
- The existing `business_context_encrypted` (bytea) column stays for now -- it contains no usable data since encryption was never configured

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_context text;
```

### 2. AccountPreferences.tsx -- Simplify Load and Save

**Loading (lines 62-108):**
- Add `business_context` to the initial SELECT query alongside `contact_person`, `company_name`, etc.
- Remove the separate async RPC call to `get_profile_business_context` entirely (the whole try/catch block at lines 100-108)

**Saving (lines 143-186):**
- Add `business_context` to the direct `.update()` call alongside the other fields
- Remove the separate RPC call to `update_profile_business_context` (lines 160-165) and its error handling
- Show the actual Supabase error message in the failure toast instead of a generic string

### 3. Also Fix: History Panel Lag (from approved plan)

In `ChatInput.tsx`:
- Limit rendered transcript messages to the most recent 20
- Add GPU acceleration hints (`will-change`, `contain`) to the panel container

## Files to Change

| File | Change |
|------|--------|
| Database migration | `ALTER TABLE profiles ADD COLUMN business_context text` |
| `AccountPreferences.tsx` | Remove both RPC calls; read/write `business_context` as plain column |
| `ChatInput.tsx` | Limit messages to 20 + GPU hints for smooth animation |

## What Stays Untouched
- The `business_context_encrypted` column remains (can be dropped later in a cleanup pass)
- The RPC functions stay in the database (harmless, nothing calls them after this change)
- The `ai_mode_configs` table stays as previously agreed
