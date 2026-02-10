
# Replace Design Studio with Standalone Compliance Page

## Summary

Remove the entire Design Studio wrapper (sidebar, landing page, parking) and replace it with a standalone Compliance page at `/compliance`. The sidebar "Design" button becomes a "Compliance" button pointing to `/compliance`.

## Changes

### 1. Sidebar Button (`src/components/dashboard/Sidebar.tsx`)
- Rename "Design Studio Button" to "Compliance" button
- Change gradient from violet to teal (matching compliance branding)
- Change icon from `Ruler` to `ClipboardCheck`
- Change navigation from `/design` to `/compliance`
- Update mobile toast message accordingly

### 2. New Page: `src/pages/CompliancePage.tsx`
- Simple page that wraps `ComplianceWizard` with auth check (same pattern as `DesignWorkspacePage.tsx`)
- Header with Back button, "Code Compliance" title, teal branding
- No sidebar, no parking, no Design Studio shell -- just the compliance wizard directly
- Mobile block screen for small devices (same as current design page)

### 3. Route Update (`src/App.tsx`)
- Comment out the `/design` route (keep code)
- Add new `/compliance` route pointing to the new `CompliancePage`

### 4. Design Studio Files (keep but disconnect)
- `DesignWorkspace.tsx`, `DesignSidebar.tsx`, `DesignWorkspacePage.tsx` -- no changes needed, they just become unreachable since the route is commented out

## Technical Details

- The `CompliancePage` reuses the existing `ComplianceWizard` component directly -- no changes to compliance logic
- The `ParkingDesigner` lazy import and all parking references stay in the commented-out Design Studio code
- SEO title updates to "Code Compliance | Building Code Check"
- The teal gradient (`from-teal-600 to-cyan-600`) matches the existing compliance tool branding from `ComplianceWizard.tsx`
