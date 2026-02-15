

## Fix Drag & Drop on Chart Analyzer Upload Zone

### Problem

The drag-and-drop zone in ChartAnalyzer has two bugs:

1. **Flickering drag state**: `onDragLeave` fires when the cursor moves over any child element (icon, text, format badges) inside the Card, causing `isDragOver` to reset to `false`. This makes the visual highlight flicker and can cause the drop to seem broken.

2. **No `onDragEnter`**: The zone only uses `onDragOver` to set the drag state, but doesn't properly handle enter/leave with a counter -- so child element boundaries constantly toggle the state.

### Fix

**File:** `src/components/dashboard/ChartAnalyzer.tsx`

Replace the simple `isDragOver` boolean with a **drag counter** pattern (the standard fix for nested drag events):

- Add a `useRef<number>(0)` drag counter
- `onDragEnter`: increment counter, set `isDragOver = true`
- `onDragLeave`: decrement counter, if counter reaches 0, set `isDragOver = false`
- `onDrop`: reset counter to 0, set `isDragOver = false`, handle file
- `onDragOver`: just `e.preventDefault()` (no state changes)

This ensures the highlight stays active while dragging over child elements and only clears when the cursor truly leaves the Card boundary.

### Technical Details

```text
// New ref
const dragCounter = useRef(0);

// Handlers
onDragEnter: increment counter, set isDragOver(true), preventDefault
onDragLeave: decrement counter, if 0 then isDragOver(false)
onDragOver:  preventDefault only (keeps drop allowed)
onDrop:      counter = 0, isDragOver(false), handle file
```

| File | Change |
|------|--------|
| `src/components/dashboard/ChartAnalyzer.tsx` | Add drag counter ref, replace inline drag handlers with proper enter/leave/over/drop using counter pattern |

