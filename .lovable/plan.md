

# Fix: History Button Styling, Centering, and Smooth Open Animation

## Issues to Fix

1. **Not button-like** -- The History toggle looks like a plain text bar spanning full width. Users don't recognize it as clickable.
2. **Not centered** -- It stretches `w-full` instead of being a compact, centered button.
3. **Laggy opening** -- The panel animates upward with `height: 0 -> auto` using a spring transition, which causes jank because the browser must calculate the auto height mid-animation.

## Changes

### File: `src/components/dashboard/ChatHistoryCollapsible.tsx`

**1. Toggle button (lines 134-152)** -- Replace the full-width bar with a compact, centered, pill-shaped button:

- Remove `w-full` so it auto-sizes to content
- Wrap in a `flex justify-center` container
- Add `shadow-sm hover:shadow-md` and `active:scale-95` for tactile feedback
- Keep the Clock icon, "History" text, and message count badge

**2. Panel open animation (lines 76-80)** -- Replace the spring-based height animation with a simpler, faster transition to eliminate lag:

- Change from `height: 0 -> auto` (causes layout thrashing) to a simple `opacity + y` slide-down
- Use `transition={{ duration: 0.2, ease: 'easeOut' }}` instead of a spring
- Remove `height` from the animation entirely since animating to `height: auto` is what causes the jank

## Technical Details

Toggle button becomes:
```
<div className="flex justify-center">
  <motion.button
    className="inline-flex items-center gap-2 px-5 py-2 rounded-full
               border border-border bg-card/80 backdrop-blur-sm
               text-sm text-muted-foreground shadow-sm
               hover:bg-muted/50 hover:text-foreground hover:shadow-md
               active:scale-95 transition-all cursor-pointer"
  >
    ...
  </motion.button>
</div>
```

Panel animation becomes:
```
initial={{ opacity: 0, y: -8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
transition={{ duration: 0.2, ease: 'easeOut' }}
```

Only one file is modified: `ChatHistoryCollapsible.tsx`.
