

# Fix: History Button and Animation in ChatInput

## Problem

The previous fix was applied to the wrong file (`ChatHistoryCollapsible.tsx`, which is not imported anywhere). The actual History button and expandable panel live in `src/components/dashboard/ChatInput.tsx`.

## Issues

1. The History button (line 713) is a plain text element -- no border, shadow, or pill shape to indicate it's clickable
2. The history panel (lines 443-456) animates with `height: 0 -> auto` using a spring transition, which causes layout jank

## Changes

### File: `src/components/dashboard/ChatInput.tsx`

**1. History toggle button (line 713)** -- Make it look like a proper pill button:

Current:
```
className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
```

Updated:
```
className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
           border border-border bg-card/80 backdrop-blur-sm
           text-sm text-muted-foreground shadow-sm
           hover:bg-muted/50 hover:text-foreground hover:shadow-md
           active:scale-95 transition-all cursor-pointer"
```

**2. Panel open animation (lines 443-456)** -- Replace height animation with opacity + slide:

Current:
```
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

Updated:
```
initial={{ opacity: 0, y: -8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
transition={{ duration: 0.2, ease: 'easeOut' }}
```

Only one file is modified: `ChatInput.tsx`.
