

# Add "Design" Workspace (Remove "New" from Sidebar)

## Overview

Replace the sidebar "New" button with a "Design" button. This button navigates to a new `/design` route that reuses the same workspace layout as `/engineering` but only shows 3 tools: **Architectural Drawings**, **Compliance Checker**, and **Parking Designer**.

---

## Changes

### 1. Create Design Workspace Page

**New file: `src/pages/DesignWorkspacePage.tsx`**

Copy the structure of `EngineeringWorkspacePage.tsx` but wrap a new `DesignWorkspace` component instead. Same auth check, same mobile block.

### 2. Create Design Workspace Component

**New file: `src/components/design/DesignWorkspace.tsx`**

A simplified version of `EngineeringWorkspace.tsx` that:
- Has its own sidebar with only 3 tools: Drawings, Compliance, Parking
- Reuses the same lazy-loaded calculator components (`DrawingGenerator`, `ComplianceWizard`, `ParkingDesigner`)
- Same header layout but branded "Design Studio" instead of "Civil Engineering Studio"
- No building code selector needed (these tools don't use structural codes)
- No 3D preview panel (Drawings and Compliance don't use it; Parking has its own built-in)
- Keeps the bottom chat bar for AI assistance

### 3. Create Design Sidebar

**New file: `src/components/design/DesignSidebar.tsx`**

A simplified sidebar with only 3 items:

| Tool | Icon | Gradient |
|------|------|----------|
| Architectural Drawings | Ruler | slate to gray |
| Code Compliance | ClipboardCheck | teal to cyan |
| Parking Designer | Car | indigo to violet |

Same collapsible behavior as `CalculatorSidebar` but no building code selector section.

### 4. Update Sidebar

**File: `src/components/dashboard/Sidebar.tsx`**

- Remove the "New Chat" button (lines 422-436)
- Replace with a "Design" button that navigates to `/design`
- Style: gradient button similar to "Eng" but with a purple/violet color scheme
- Icon: `Ruler` or `Palette`
- Same mobile toast behavior as Eng button

### 5. Add Route

**File: `src/App.tsx`**

Add a new route:
```text
/design -> DesignWorkspacePage
```

---

## Sidebar Layout (Before/After)

```text
Before: [Eng] [+ New]
After:  [Eng] [Design]
```

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/DesignWorkspacePage.tsx` | Create -- auth wrapper for design workspace |
| `src/components/design/DesignWorkspace.tsx` | Create -- workspace with 3 tools |
| `src/components/design/DesignSidebar.tsx` | Create -- sidebar with 3 items only |
| `src/components/dashboard/Sidebar.tsx` | Edit -- replace "New" with "Design" button |
| `src/App.tsx` | Edit -- add `/design` route |

