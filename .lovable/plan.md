

# Fix Dark Mode Card Background Mismatch

## What's Changing

Update **only the dark mode** background class on 5 service cards in the "Six Ways We Help" bento grid.

- Light mode (`bg-neutral-50`) stays exactly as-is
- Dark mode changes from `dark:bg-neutral-900/80` to `dark:bg-card`

This uses your existing `--card` CSS variable (#0F0F0F) instead of the mismatched #171717 at 80% opacity.

## File

**`src/components/LandingPage.tsx`** -- 5 occurrences of `dark:bg-neutral-900/80` replaced with `dark:bg-card` (lines ~534, 563, 594, 626, 657).

No other files or modes affected.

