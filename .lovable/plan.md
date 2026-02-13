

# Remove "Export Your Data" Section

## What changes
Remove the "Export Your Data" row (label, description, and Export button) from the Privacy Settings page so users cannot download their data.

## Technical Details

**File:** `src/components/settings/PrivacySettings.tsx`

- Delete the entire `<div>` block (approximately lines 131-143) that contains the "Export Your Data" label, description, and the Export button.
- Also remove the now-unused `handleExportData` function and the `Download` icon import if no longer referenced elsewhere.

