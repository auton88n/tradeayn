

# Fix Dark Mode Inconsistency Between Dashboard and Landing Page

## Problem
The Dashboard's maintenance/blocked screen uses **hardcoded Tailwind gray colors** (e.g., `gray-900`, `gray-800`) which have a bluish tint, while the Landing Page uses **theme CSS variables** (`bg-background`, `bg-card`) that resolve to pure near-black values. This creates visually different "dark modes" across the two pages.

| Component | Current Dark Value | Actual Color |
|---|---|---|
| Landing Page background | `bg-background` (via `--background: 0 0% 4%`) | `#0a0a0a` (pure near-black) |
| Dashboard maintenance | `dark:from-gray-900` | `#111827` (bluish dark) |
| Dashboard cards | `dark:bg-gray-800` | `#1f2937` (bluish gray) |

## Fix
Replace all hardcoded gray colors in `Dashboard.tsx` with theme-aware tokens that match the landing page.

**File:** `src/components/Dashboard.tsx` (lines 153-169)

### Changes

**Line 153** - Main container gradient:
- From: `dark:from-gray-900 dark:to-gray-800`
- To: `dark:from-background dark:to-background`

**Line 155** - Card background:
- From: `bg-white dark:bg-gray-800`
- To: `bg-white dark:bg-card`

**Line 156** - Icon circle:
- From: `dark:bg-orange-900/30`
- To: `dark:bg-orange-900/20` (minor, keeps consistency)

**Line 169** - Info box:
- From: `dark:bg-orange-900/20`
- To: stays the same (already uses opacity-based approach, acceptable)

This ensures both pages share the same dark mode palette defined by the CSS custom properties.

