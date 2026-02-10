
# Remove Skeleton Loading Screens

## Summary

Replace all skeleton loading screens with the simple `PageLoader` spinner that already exists in the project. The skeleton layout components and file will be kept but unused (commented out import).

## Changes

### 1. Update Route Fallbacks (`src/App.tsx`)

Replace every `<Suspense fallback={<SomeSkeleton />}>` with `<Suspense fallback={<PageLoader />}>` across all routes:

- `/` -- `LandingPageSkeleton` becomes `PageLoader`
- `/settings` -- `SettingsSkeleton` becomes `PageLoader`
- `/pricing` -- `SettingsSkeleton` becomes `PageLoader`
- All `/services/*` routes -- `ServicePageSkeleton` becomes `PageLoader`
- `/engineering`, `/compliance`, `/engineering/grading` -- `EngineeringSkeleton` becomes `PageLoader`

Remove the import of `LandingPageSkeleton, SettingsSkeleton, EngineeringSkeleton, ServicePageSkeleton` from `skeleton-layouts.tsx` (already importing `PageLoader`).

### 2. Keep Files (no deletion)

- `src/components/ui/skeleton-layouts.tsx` -- stays in codebase, just unused
- `src/components/ui/skeleton.tsx` -- stays (used by the sidebar's `SidebarMenuSkeleton` which is a shadcn primitive, and possibly chat loading states)

### What Won't Change

- The `Skeleton` base component stays since it's part of shadcn/ui primitives
- The sidebar chat history skeleton loader in `Sidebar.tsx` stays (it's inline, not from skeleton-layouts)
- `PageLoader` and `AYNLoader` / `DashboardLoader` stay as-is
