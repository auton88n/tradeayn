

# Align Dashboard Dark Mode with Landing Page Theme

## Problem
The Dashboard's maintenance screen uses hardcoded Tailwind gray colors (`gray-900`, `gray-800`) which have a bluish tint, while the Landing Page uses pure near-black theme CSS variables (`bg-background`, `bg-card`). This creates two visually different dark modes.

## Fix
Replace hardcoded grays in `Dashboard.tsx` with theme-aware tokens.

## Technical Details

**File:** `src/components/Dashboard.tsx`

| Line | Current | New |
|------|---------|-----|
| 153 | `dark:from-gray-900 dark:to-gray-800` | `dark:from-background dark:to-background` |
| 155 | `dark:bg-gray-800` | `dark:bg-card` |
| 156 | `dark:bg-orange-900/30` | `dark:bg-orange-900/20` |

No other files need changes. The theme variables are already defined in `index.css` (dark `--background: 0 0% 4%`, `--card: 0 0% 6%`).
