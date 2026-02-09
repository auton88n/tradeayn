

# Fix 4 Floor Plan Issues: Open Concept, Grid Bubbles, Text Overlaps, Living Room Windows

## Overview

4 targeted fixes across 3 files. The open concept wall removal is the most critical -- the current filter has tolerance issues that let walls slip through.

---

## Fix 1: Force Open Concept Wall Removal

**File: `FloorPlanRenderer.tsx`** (lines 113-170)

The current `filterOpenConceptWalls` checks if a wall sits exactly at the boundary between kitchen and living rooms (within 0.5ft tolerance). This fails when:
- Rooms don't share an exact boundary (e.g., kitchen ends at y=18 but living starts at y=18.5)
- The wall extends beyond the overlap zone (wall goes from x=0 to x=40 but rooms only overlap x=12 to x=26)
- Multiple small walls make up the boundary instead of one long wall

**Fix**: Rewrite the filter to be much more aggressive:
- Increase tolerance from 0.5 to **1.5 feet** for boundary matching
- Instead of requiring the wall to sit exactly at a room edge, check if the wall falls **anywhere between** the two rooms (within their combined bounding box)
- For any interior/partition wall that runs between a kitchen-type room and a living/dining-type room with **any** horizontal or vertical overlap, remove it
- Add a secondary pass: if any room's name/type contains "kitchen" AND another contains "living" or "dining", and they are within 2ft of each other on one axis, remove ALL interior walls in that gap zone

This guarantees open concept works regardless of the AI's exact wall placement.

---

## Fix 2: Reduce Grid Bubbles to 5-7 Horizontal, 4-6 Vertical

**File: `GridBubbles.tsx`** (lines 25-38)

Replace `getGridPositions` with a smarter version that merges nearby positions:

- After collecting all room boundary positions, **merge positions that are less than 4ft apart** (keep the average of the merged group)
- Always keep position 0 and the total size (building corners)
- Cap at **7 positions max** for X-axis and **6 positions max** for Y-axis
- If still over the cap after merging, keep only the positions with the largest gaps between them (prioritize structural grid lines, not minor partitions)

This reduces a typical 13-bubble layout to 6-7 bubbles that mark major structural intersections only.

---

## Fix 3: Smart Room Labels with Abbreviations and Overlap Prevention

**File: `ArchitecturalSymbols.tsx`** (lines 342-392, `RoomLabel` component)

Add a new prop `compact` to `RoomLabel`:
- When `compact={true}`: show ONLY the abbreviated name, skip dimensions and SF text
- When `compact={false}` (default): show full name, dimensions, and SF as today

**File: `FloorPlanRenderer.tsx`** (lines 329-344, room labels section)

Add abbreviation logic before rendering labels:

```text
Abbreviation map:
- Names containing "closet" -> "CL"
- Names containing "walk-in" or "walk in" -> "W/W"  
- Names containing "ensuite" or "en-suite" -> "ENS"
- Names containing "powder" -> "PWD"
- Names containing "pantry" -> "PAN"
- Names containing "mudroom" -> "MUD"
- Names containing "laundry" -> "LAU"
- Names containing "mechanical" or "utility" -> "MECH"
- Names containing "hallway" or "hall" -> "HALL"
- Names containing "stairwell" or "stair" -> "STAIR"
```

Decision logic per room:
1. Calculate room area in SF (`room.width * room.depth`)
2. If area < 40 SF: use abbreviated name, set `compact={true}` (no dimensions/SF)
3. If area < 80 SF: use abbreviated name, still show dimensions but skip SF
4. If area >= 80 SF: use full name, show everything

This prevents labels from overflowing small closets and utility rooms while keeping full detail on major rooms.

---

## Fix 4: Add Windows to Living Room Exterior Walls

**File: `FloorPlanRenderer.tsx`** (lines 190-195, `processedData` useMemo)

After the open concept wall filter but before `processWalls`, add a post-processing step that ensures living room exterior walls have windows:

- Find the living room(s) in `floor.rooms`
- For each exterior wall that borders the living room (wall runs along the room's edge on x=0, x=totalWidth, y=0, or y=totalDepth), check if any window already exists on that wall within the living room's span
- If no window exists on that wall segment, **inject 2 windows** into the `floor.windows` array:
  - Each window: 48" wide, positioned at 1/3 and 2/3 along the living room's wall span
  - Type: "picture" for large living room windows
  - Sill height: 24"
  - Height: 60"
- This runs client-side so it catches cases where the AI forgot to add windows

---

## Files Modified (3 total)

| File | Changes |
|------|---------|
| `FloorPlanRenderer.tsx` | Fix 1 (aggressive open concept filter), Fix 3 (label abbreviation logic), Fix 4 (inject living room windows) |
| `GridBubbles.tsx` | Fix 2 (merge nearby positions, cap at 7/6) |
| `ArchitecturalSymbols.tsx` | Fix 3 (add `compact` prop to RoomLabel) |

---

## Implementation Order

1. `GridBubbles.tsx` -- Merge + cap grid positions (smallest change, big readability improvement)
2. `ArchitecturalSymbols.tsx` -- Add `compact` prop to RoomLabel
3. `FloorPlanRenderer.tsx` -- All three fixes (open concept, label abbreviations, living room windows)

---

## Technical Notes

### Open Concept Filter Rewrite
The key change is moving from exact-boundary matching to zone-based matching. Instead of checking "is this wall at y=18 and does kitchen end at y=18 and living start at y=18?", the new logic checks "is this interior wall within the bounding box that spans from kitchen to living, with any overlap on the perpendicular axis?" This catches walls that the AI placed slightly off-grid.

### Grid Bubble Merging Algorithm
```text
1. Collect all positions [0, 4, 6, 10, 14, 18, 22, 24, 26, 30, 34, 38, 42]
2. Sort ascending
3. Walk through: if gap to previous kept position < 4ft, skip (merge into previous)
4. Result: [0, 6, 14, 22, 30, 38, 42] = 7 positions
5. If still > 7, drop positions with smallest gaps to neighbors
```

### Label Sizing
At 1:48 scale, a 40 SF room (e.g., 5'x8' closet) is about 32x51 SVG units. A full 3-line label (name + dims + SF) needs ~15 SVG units height. An abbreviated single-line label needs ~5 SVG units. The 40 SF threshold ensures labels fit their rooms.

### Living Room Window Injection
Windows are injected into the mutable copy of `floor.windows` before passing to `processWalls`. Each injected window gets a unique ID (`injected-win-living-{index}`). The wall_id is matched by finding the exterior wall that runs along the living room's exterior edge. If no matching wall_id is found (rare edge case), the injection is skipped for that edge.
