

## Redesign Sidebar Tool Buttons

### Overview

Restyle the three tool buttons (Engineering, Compliance, Charts) from cramped gradient pills into a clean card-style grid layout. All three buttons stay -- no removals.

### Design

A 3-item grid layout (1 column on narrow sidebar, adapts naturally). Each button becomes a mini card with:

- Subtle themed background with border (no heavy gradient fills)
- Icon in a soft gradient circle
- Title + short subtitle
- Hover lift/glow effect

```text
+------------------+------------------+------------------+
|  [icon]          |  [icon]          |  [icon]          |
|  Engineering     |  Compliance      |  Charts          |
|  Design Tools    |  Code Check      |  Analysis        |
+------------------+------------------+------------------+
```

### Technical Details

**File: `src/components/dashboard/Sidebar.tsx`** (lines 390-468)

Replace the current `flex gap-2` row with a `grid grid-cols-3 gap-2` layout. Each button changes from a gradient pill to:

```text
className="flex-1 flex flex-col items-center gap-1.5 h-auto py-3 px-2 rounded-xl 
  bg-card/60 border border-border/50 hover:border-[color]/40 hover:bg-card/80
  hover:shadow-lg text-foreground transition-all duration-200 backdrop-blur-sm"
```

Each icon gets a soft gradient container:
- Engineering: `from-cyan-500/15 to-blue-500/15` with cyan icon
- Compliance: `from-teal-500/15 to-emerald-500/15` with teal icon
- Charts: `from-amber-500/15 to-orange-500/15` with amber icon

Title in `text-xs font-semibold`, subtitle in `text-[9px] text-muted-foreground`.

### Files

| File | Change |
|------|--------|
| `src/components/dashboard/Sidebar.tsx` | Restyle 3 buttons as card-style grid items |

