

# PropertySection with "Do You Have a Lot?" Toggle

## Overview

Create `PropertySection.tsx` as part of the new Configure Wizard. It has two modes controlled by a toggle at the top:

- **"Yes, I have a lot"** -- Full property form with lot dimensions, setbacks, street direction, driveway, features
- **"Not yet -- just exploring"** -- Minimal form with only front-facing direction preference and optional view preference

## Component Structure

### Toggle at Top

A styled two-option toggle (using chip/pill buttons, not a Switch) centered at the top of the section:

```text
[ Yes, I have a lot ]  [ Not yet -- just exploring ]
```

Default selection: **"Not yet -- just exploring"** (most users won't have lot info)

### Mode: "Just Exploring" (Default)

Only two fields shown:

1. **Front of house direction** -- "Which direction would you like the front of your house to face?"
   - 4 pill buttons: North / South / East / West
   - Optional (can be left unselected)
   - Helper text: "This helps AYN plan sunlight in your rooms"

2. **View preference** (optional)
   - "Is there a direction you'd love views toward?"
   - Same 4 direction pills + "No preference" option

### Mode: "I Have a Lot"

Full form with these groups:

**Lot Dimensions**
- Lot shape: 4 pill buttons (Rectangle / Square / L-shaped / Irregular)
- Lot width (ft): number input, placeholder "e.g., 60"
- Lot depth (ft): number input, placeholder "e.g., 120"

**Street & Orientation**
- Street direction: 4 pill buttons (North / South / East / West) -- "Which side of your lot faces the street?"
- Driveway location: 3 pill buttons (Left / Right / Center)

**Setbacks**
- Toggle: "Use local defaults" (on) / "Enter manually" (off)
- When manual: 4 number inputs in a 2x2 grid -- Front, Rear, Left Side, Right Side (in feet)
- Default values: Front 25, Rear 20, Left 5, Right 5

**Lot Features** (all optional toggles/selectors)
- Trees to preserve: Yes / No toggle
- Slope: 3 pills (Flat / Gentle / Steep)
- View direction: 4 direction pills + "None"
- Neighbor proximity: Per-side selector (Left: Close/Medium/Far, Right: Close/Medium/Far)

## Props Interface

```text
interface PropertyData {
  has_specific_lot: boolean;
  // Lot dimensions (only when has_specific_lot)
  lot_shape?: 'rectangle' | 'square' | 'l-shaped' | 'irregular';
  lot_width_ft?: number;
  lot_depth_ft?: number;
  // Orientation
  street_direction?: 'north' | 'south' | 'east' | 'west';
  preferred_front_direction?: 'north' | 'south' | 'east' | 'west';
  driveway_location?: 'left' | 'right' | 'center';
  // Setbacks
  use_default_setbacks?: boolean;
  setbacks?: { front: number; rear: number; left: number; right: number };
  // Features
  trees_to_preserve?: boolean;
  slope?: 'flat' | 'gentle' | 'steep';
  view_direction?: 'north' | 'south' | 'east' | 'west' | 'none';
  neighbor_proximity?: { left: string; right: string };
}

interface PropertySectionProps {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
}
```

## UI Patterns

- Uses the same pill button pattern as `DrawingRequestForm` (rounded-full buttons with active/inactive states)
- Uses `InputSection` wrapper for collapsible sub-groups within the section
- Number inputs use the existing `Input` component with type="number"
- Toggle for "use local defaults" uses the existing `Switch` component
- Framer Motion `AnimatePresence` for smooth show/hide of mode-specific fields

## File

| File | Action |
|------|--------|
| `src/components/engineering/drawings/configure/PropertySection.tsx` | Create |
| `src/components/engineering/drawings/configure/types.ts` | Create (includes PropertyData + other config types needed later) |

## Types File

The `types.ts` file will include `PropertyData` plus the full `DesignConfiguration` interface (with property as one field) so other sections can import from the same place. Property-specific types are defined first; remaining section types use placeholder interfaces that will be filled in when those sections are built.

