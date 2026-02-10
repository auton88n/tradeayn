
# Add Terms Consent Log Viewer to Admin Panel

## What's Missing
The `terms_consent_log` table was created in the database, but there's no section in the Admin Panel to view it. We need to add a new admin sidebar tab and a viewer component so you can see proof of who accepted the terms.

## Changes

### 1. New Component: `src/components/admin/TermsConsentViewer.tsx`
A new admin section that:
- Fetches all records from `terms_consent_log` (admin RLS policy already allows this)
- Displays a table with columns: User, Terms Version, Privacy, Terms, AI Disclaimer, Accepted At, User Agent
- Each checkbox state shown as a green checkmark or red X
- Includes a search bar to filter by user
- Shows total count of consent records
- Sorted by most recent first

### 2. Update `src/components/admin/AdminSidebar.tsx`
- Add `'terms-consent'` to the `AdminTabId` type
- Add a new sidebar entry in the main sections (under "Main" group, after "Users") with a `FileCheck` icon

### 3. Update `src/components/AdminPanel.tsx`
- Import `TermsConsentViewer`
- Add `{activeTab === 'terms-consent' && <TermsConsentViewer />}` to the tab content rendering block

## Technical Details

### Data Fetching
The component will use `supabaseApi.get()` (matching the existing pattern used throughout the admin panel) to query:
```
terms_consent_log?select=*&order=accepted_at.desc
```

To show user info alongside consent records, it will also fetch profiles to map `user_id` to a display name/email.

### UI Layout
- Summary cards at top: Total Acceptances count
- Searchable/filterable table below
- Each row shows: user name, terms version, three boolean columns (privacy/terms/ai disclaimer) with visual indicators, timestamp, and truncated user agent

### No new dependencies needed
Uses existing UI components (Card, Badge, Table patterns) already in the project.
