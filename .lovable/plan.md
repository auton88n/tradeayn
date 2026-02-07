

# Fix Loading-to-Loaded Eye Color Flash

## Problem

The eye loader shows for ~2 seconds with mismatched colors compared to the actual EmotionalEye, causing a visible flash -- most notably a white-to-black pupil jump and a #0A0A0A-to-#171717 outer circle shift.

## Changes

**File: `src/components/ui/page-loader.tsx`**

Update all 4 loader variants (AYNLoader, PageLoader, DashboardLoader, AdminLoader):

1. **Outer circle**: `bg-background` → `bg-neutral-100 dark:bg-neutral-900`
2. **Inner ring**: `bg-background/80` → `bg-neutral-200/80 dark:bg-neutral-900/80`
3. **Emotional ring**: `bg-muted/50` → `bg-neutral-300/50 dark:bg-neutral-700/50` + add `blur-sm` for glow consistency
4. **Center pupil**: `bg-foreground` → `bg-neutral-900 dark:bg-black`
5. **Brain icon**: `text-background` → `text-neutral-100 dark:text-neutral-400`
6. **Sync comment**: Add `// Keep in sync with EmotionalEye dark mode colors` at the top of the file

AdminLoader retains its purple-tinted glow but gets the same structural fixes.

No other files affected.

