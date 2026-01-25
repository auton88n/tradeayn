
## Reduce Chat Card Size in Sidebar

### Problem
The chat cards in the sidebar take up too much vertical space, showing fewer conversations in the visible area.

### Current Styling
- Card padding: `py-3.5` (14px top/bottom)
- Icon container: `w-8 h-8` (32px)
- Internal spacing: `space-y-2` (8px)
- Gap between icon and title: `gap-2.5` (10px)

### Proposed Changes

**File:** `src/components/dashboard/Sidebar.tsx`

| Element | Current | New | Savings |
|---------|---------|-----|---------|
| Card vertical padding | `py-3.5` (14px) | `py-2.5` (10px) | 8px total |
| Icon container | `w-8 h-8` | `w-6 h-6` | 8px height |
| Icon size | `w-4 h-4` | `w-3.5 h-3.5` | proportional |
| Icon-title gap | `gap-2.5` | `gap-2` | 2px |

### Code Changes

```tsx
// Line 541 - Reduce card padding
className={cn("flex-1 h-auto py-2.5 px-3 pr-6 rounded-xl cursor-pointer", ...)}

// Line 542 - Remove extra spacing
<div className="w-full min-w-0">  // Remove space-y-2

// Line 545 - Reduce icon-title gap
<div className="flex items-center gap-2 min-w-0 flex-1">

// Line 546 - Smaller icon container
<div className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">

// Line 547 - Smaller icon
<MessageSquare className="w-3.5 h-3.5 text-foreground/50" />
```

### Expected Result
- Chat cards will be approximately 30% more compact
- More conversations visible in the sidebar
- Visual hierarchy maintained with smaller but proportional elements
- Star icons remain fully visible with existing `pr-6` padding
