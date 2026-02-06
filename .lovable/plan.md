

# Fix: History Button Styling and Panel Performance

## Changes

### 1. Make History toggle look like a proper button (not full-width bar)

Currently the collapsed toggle is `w-full` spanning the entire width. Change it to an inline, centered, compact button with proper button styling:

- Remove `w-full` -- use `inline-flex` instead
- Wrap in a centered container (`flex justify-center`)
- Add a slightly more prominent button look (rounded-full pill shape, subtle shadow)

### 2. Fix laggy open animation

The lag comes from the spring animation on `height: 'auto'` combined with `AnimatePresence`. Fix by:

- Replace the heavy spring transition with a simple `tween` (duration: 0.2s, ease-out)
- Remove the `y: -10` shift (unnecessary extra calculation)
- Use `layout` approach or simple opacity fade instead of animating height from 0 to auto (which forces reflow)

## Technical Details

### File: `src/components/dashboard/ChatHistoryCollapsible.tsx`

**Toggle button (lines 134-152)** -- change from full-width bar to centered pill button:

```tsx
{!isOpen && (
  <div className="flex justify-center">
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-2",
        "px-4 py-2 rounded-full",
        "border border-border bg-card/80 backdrop-blur-sm shadow-sm",
        "text-sm text-muted-foreground",
        "hover:bg-muted/50 hover:text-foreground",
        "transition-colors"
      )}
    >
      <Clock className="h-4 w-4" />
      <span>History</span>
      <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
        {messages.length}
      </span>
    </motion.button>
  </div>
)}
```

**Panel animation (lines 76-80)** -- simplify for snappy open/close:

```tsx
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto' }}
  exit={{ opacity: 0, height: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
  className="overflow-hidden"
>
```

This removes the spring physics (which cause the bouncy lag) and the y-axis shift, replacing them with a fast 200ms ease-out transition.
