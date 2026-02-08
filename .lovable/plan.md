

# Skeleton Loading States for Key Pages

## Overview

Replace the generic `PageLoader` spinner with route-specific skeleton screens that mirror each page's layout. This eliminates perceived loading time by showing a content-shaped placeholder instead of a centered spinner.

## Current State

- All lazy-loaded routes share a single `<Suspense fallback={<PageLoader />}>` in `App.tsx` -- a centered animated eye with "Loading..." text
- The `Skeleton` component already exists with a shimmer animation
- The `Index` page already uses `<DashboardLoader />` for its authenticated view
- Engineering workspace already uses inline `<LoadingFallback />` skeletons

## Changes

### 1. New file: `src/components/ui/skeleton-layouts.tsx`

Four skeleton layouts matching actual page structures:

- **`LandingPageSkeleton`** -- Hero section shape: large title block, subtitle, CTA buttons, service cards grid
- **`SettingsSkeleton`** -- Sidebar + form fields: navigation pills on left, labeled input blocks on right
- **`EngineeringSkeleton`** -- Toolbar + split panel: calculator selector strip, input fields on left, 3D preview area on right
- **`ServicePageSkeleton`** -- Generic service page: hero banner, feature cards, CTA section

All built from the existing `Skeleton` component with appropriate sizing and spacing.

### 2. Update: `src/App.tsx`

Wrap groups of routes in nested `<Suspense>` boundaries with matching skeleton fallbacks:

```text
Routes layout:
  /                    -> LandingPageSkeleton (or DashboardLoader if auth check pending)
  /settings            -> SettingsSkeleton
  /pricing             -> SettingsSkeleton (similar form layout)
  /engineering/*       -> EngineeringSkeleton
  /services/*          -> ServicePageSkeleton
  everything else      -> PageLoader (current default, kept as outer fallback)
```

The outer `<Suspense fallback={<PageLoader />}>` remains as a catch-all. Per-route Suspense boundaries are added inside individual `<Route>` elements so each page gets its own skeleton while loading.

### 3. No changes to existing component-level Suspense

The engineering workspace, calculation results, and 3D visualizations already have their own granular Suspense fallbacks. Those stay as-is.

## Technical Details

- Each skeleton uses `min-h-screen` to prevent layout shift
- Skeletons include `bg-background` to match the app theme
- The shimmer animation from the existing `Skeleton` component provides visual feedback
- Import is kept lightweight -- just the `Skeleton` component, no additional dependencies

## Files changed

| File | Change |
|------|--------|
| `src/components/ui/skeleton-layouts.tsx` | New -- 4 skeleton layout components |
| `src/App.tsx` | Add per-route Suspense boundaries with matching skeletons |

