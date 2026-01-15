# Advanced Parking Designer - Technical Roadmap

## Vision Statement

Transform the parking designer from a rigid rectangular-grid tool into an **intelligent, canvas-based design system** that adapts to real-world site complexity. Engineers draw their actual site, place constraints, and AI generates optimized layouts respecting all realities.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  Canvas Editor  │  │  3D Visualizer  │  │  Results Dashboard  │  │
│  │  (Interactive)  │  │  (Three.js)     │  │  (Metrics/Export)   │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │
│           │                    │                      │             │
│  ┌────────┴────────────────────┴──────────────────────┴──────────┐  │
│  │                     Site Data Context                          │  │
│  │  (Polygon, Obstacles, Entries, Zones, Generated Layout)        │  │
│  └────────────────────────────────┬──────────────────────────────┘  │
├───────────────────────────────────┼─────────────────────────────────┤
│                        LOGIC LAYER                                  │
├───────────────────────────────────┼─────────────────────────────────┤
│  ┌────────────────────────────────┴──────────────────────────────┐  │
│  │                  Geometry Engine (Client)                      │  │
│  │  - Polygon operations (union, difference, offset)              │  │
│  │  - Point-in-polygon tests                                      │  │
│  │  - Aisle pathfinding                                           │  │
│  │  - Space placement algorithms                                  │  │
│  └────────────────────────────────┬──────────────────────────────┘  │
│                                   │                                 │
│  ┌────────────────────────────────┴──────────────────────────────┐  │
│  │                  AI Optimization Engine (Edge)                 │  │
│  │  - Layout generation                                           │  │
│  │  - Zone optimization                                           │  │
│  │  - Traffic flow analysis                                       │  │
│  │  - Constraint satisfaction                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  Supabase DB    │  │  Supabase       │  │  Edge Functions     │  │
│  │  (Projects)     │  │  Storage (DXF)  │  │  (AI Processing)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Core Site Model

```typescript
interface ParkingSite {
  id: string;
  name: string;
  
  // Site boundary (Phase 1)
  boundary: Polygon;
  
  // Constraints (Phase 2)
  obstacles: Obstacle[];
  setbacks: Setback[];
  
  // Access points (Phase 3)
  entries: EntryPoint[];
  exits: ExitPoint[];
  
  // Zones (Phase 4)
  zones: ParkingZone[];
  
  // Generated layout
  layout: GeneratedLayout | null;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface Polygon {
  points: Point2D[];
  holes?: Polygon[]; // For interior cutouts
}

interface Point2D {
  x: number; // meters from origin
  y: number;
}

interface Obstacle {
  id: string;
  type: 'building' | 'tree' | 'utility' | 'drainage' | 'custom';
  shape: Polygon | Circle;
  buffer: number; // Required clearance in meters
  label?: string;
  isRemovable: boolean;
}

interface Circle {
  center: Point2D;
  radius: number;
}

interface EntryPoint {
  id: string;
  position: Point2D;
  direction: number; // Angle in degrees
  width: number; // Lane width
  type: 'entry' | 'exit' | 'bidirectional';
  lanes: number;
}

interface ParkingZone {
  id: string;
  boundary: Polygon;
  config: ZoneConfig;
  priority: number; // For AI optimization order
}

interface ZoneConfig {
  spaceType: 'standard' | 'compact' | 'accessible' | 'ev' | 'motorcycle' | 'loading';
  angle: 0 | 30 | 45 | 60 | 90;
  spaceWidth: number;
  spaceLength: number;
  aisleWidth: number;
  isOneWay: boolean;
}

interface GeneratedLayout {
  spaces: ParkingSpace[];
  aisles: Aisle[];
  driveways: Driveway[];
  pedestrianPaths: Path[];
  metrics: LayoutMetrics;
  aiSuggestions: AISuggestion[];
}

interface ParkingSpace {
  id: string;
  polygon: Polygon;
  type: ZoneConfig['spaceType'];
  angle: number;
  zoneId: string;
  number?: string; // Display number
}

interface Aisle {
  id: string;
  centerline: Point2D[];
  width: number;
  isOneWay: boolean;
  direction?: number; // If one-way
}

interface LayoutMetrics {
  totalSpaces: number;
  spacesByType: Record<string, number>;
  efficiency: number; // Spaces per acre
  averageWalkDistance: number;
  aisleLength: number;
  unusedArea: number;
}

interface AISuggestion {
  id: string;
  type: 'optimization' | 'warning' | 'compliance';
  message: string;
  affectedArea?: Polygon;
  suggestedChange?: Partial<ZoneConfig>;
  impact: {
    spacesGained?: number;
    efficiencyChange?: number;
  };
}
```

---

## Phase 1: Polygon Site Boundaries

### Goal
Replace length×width inputs with an interactive canvas where users draw irregular site boundaries.

### Duration: 2-3 weeks

### Components

```
src/components/engineering/parking/
├── AdvancedParkingDesigner.tsx    # Main orchestrator
├── canvas/
│   ├── SiteCanvas.tsx             # Main canvas container
│   ├── CanvasToolbar.tsx          # Drawing tools
│   ├── PolygonDrawer.tsx          # Polygon creation tool
│   ├── PolygonEditor.tsx          # Edit existing polygons
│   ├── GridOverlay.tsx            # Snap-to-grid helper
│   └── ScaleIndicator.tsx         # Shows real-world scale
├── hooks/
│   ├── useCanvasState.ts          # Canvas pan/zoom state
│   ├── usePolygonDrawing.ts       # Drawing interaction logic
│   └── useSiteContext.ts          # Site data context
└── utils/
    ├── geometry.ts                # Polygon math utilities
    └── canvasHelpers.ts           # Canvas rendering helpers
```

### Key Features

1. **Canvas Modes**
   - Pan/Zoom (default)
   - Draw Polygon
   - Edit Vertices
   - Measure Distance

2. **Drawing Tools**
   - Click-to-place vertices
   - Snap to grid (configurable: 0.5m, 1m, 5m)
   - Close polygon (click first point or double-click)
   - Undo/Redo

3. **Import Options**
   - Trace over uploaded site plan image
   - Import from DXF boundary layer
   - Enter coordinates manually

### Technical Implementation

```typescript
// usePolygonDrawing.ts
interface UsePolygonDrawingOptions {
  snapToGrid: boolean;
  gridSize: number;
  onComplete: (polygon: Polygon) => void;
}

export function usePolygonDrawing(options: UsePolygonDrawingOptions) {
  const [points, setPoints] = useState<Point2D[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleCanvasClick = (worldPos: Point2D) => {
    const snappedPos = options.snapToGrid 
      ? snapToGrid(worldPos, options.gridSize)
      : worldPos;

    // Check if clicking near first point to close
    if (points.length >= 3 && distance(snappedPos, points[0]) < options.gridSize) {
      options.onComplete({ points });
      setPoints([]);
      setIsDrawing(false);
      return;
    }

    setPoints([...points, snappedPos]);
  };

  return { points, isDrawing, handleCanvasClick, undo, reset };
}
```

### UI Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  [🔙] Advanced Parking Designer           [💾 Save] [📤 Export]  │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────────────────────────────────────────────────────┐│
│ │Tools │ │                                                      ││
│ ├──────┤ │                                                      ││
│ │ 🖐️  │ │          ┌─────────────────┐                        ││
│ │ ✏️  │ │         /                   \                        ││
│ │ 📐  │ │        /                     \                       ││
│ │ 🔲  │ │       │      SITE BOUNDARY    │                      ││
│ │ 📏  │ │       │      (Polygon)        │                      ││
│ │      │ │        \                     /                       ││
│ │──────│ │         \___________________/                        ││
│ │Snap: │ │                                                      ││
│ │[1m]  │ │     Scale: 1:500  │  Grid: 1m  │  Area: 2,450 m²    ││
│ └──────┘ └──────────────────────────────────────────────────────┘│
│ ┌────────────────────────────────────────────────────────────────┤
│ │ Boundary: 12 vertices │ Perimeter: 198m │ ✓ Valid Polygon    ││
│ └────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Deliverables
- [ ] Canvas component with pan/zoom
- [ ] Polygon drawing tool
- [ ] Vertex editing
- [ ] Grid snap system
- [ ] Image underlay for tracing
- [ ] Polygon validation (no self-intersection)
- [ ] Area/perimeter calculations
- [ ] Save/load site boundary

---

## Phase 2: Obstacles & Constraints

### Goal
Allow users to place obstacles that the layout must avoid, with configurable buffer zones.

### Duration: 2 weeks

### Components

```
src/components/engineering/parking/
├── obstacles/
│   ├── ObstacleLibrary.tsx        # Predefined obstacle types
│   ├── ObstaclePlacer.tsx         # Drag-and-drop placement
│   ├── ObstacleEditor.tsx         # Edit shape/properties
│   ├── BufferVisualizer.tsx       # Show clearance zones
│   └── ObstacleList.tsx           # Sidebar list of obstacles
└── hooks/
    └── useObstacles.ts            # Obstacle CRUD operations
```

### Obstacle Types

| Type | Default Shape | Default Buffer | Icon |
|------|---------------|----------------|------|
| Building | Rectangle | 3m | 🏢 |
| Tree | Circle (r=2m) | 1.5m | 🌳 |
| Utility Pole | Circle (r=0.3m) | 1m | ⚡ |
| Fire Hydrant | Circle (r=0.5m) | 3m (code req) | 🚒 |
| Drainage | Polygon | 1m | 💧 |
| Light Pole | Circle (r=0.4m) | 0.5m | 💡 |
| Custom | Draw | User-defined | ⬡ |

### Features

1. **Placement Methods**
   - Drag from library
   - Click to place
   - Draw custom shape
   - Import from DXF layer

2. **Obstacle Properties**
   - Shape (circle/rectangle/polygon)
   - Size/dimensions
   - Buffer distance
   - Label
   - Removable flag (can AI suggest removal?)

3. **Buffer Visualization**
   - Semi-transparent buffer zones
   - Color-coded by obstacle type
   - Warning when buffers overlap

### Technical Implementation

```typescript
// Obstacle placement with buffer
interface ObstacleWithBuffer {
  obstacle: Obstacle;
  bufferPolygon: Polygon; // Expanded shape
}

function computeBufferPolygon(obstacle: Obstacle): Polygon {
  if (obstacle.shape.type === 'circle') {
    return circleToPolygon(obstacle.shape, obstacle.buffer);
  }
  return offsetPolygon(obstacle.shape, obstacle.buffer);
}

// Check if space placement is valid
function isSpaceValid(space: ParkingSpace, obstacles: ObstacleWithBuffer[]): boolean {
  return obstacles.every(obs => 
    !polygonsIntersect(space.polygon, obs.bufferPolygon)
  );
}
```

### UI Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────────────────────────────────────┐│
│ │ Obstacles    │ │                                              ││
│ ├──────────────┤ │    ┌─────────────────┐                      ││
│ │ 🏢 Building  │ │   /    ┌───┐          \    🌳               ││
│ │ 🌳 Tree      │ │  /     │░░░│ Buffer    \   (buffer)         ││
│ │ ⚡ Utility   │ │ │      │░░░│ 3m        │                     ││
│ │ 🚒 Hydrant   │ │ │      └───┘           │  ⚡                 ││
│ │ 💧 Drainage  │ │  \                    /   (buffer)          ││
│ │ ➕ Custom    │ │   \__________________/                       ││
│ ├──────────────┤ │                                              ││
│ │ On Site:     │ │     [Show Buffers ✓] [Show Labels ✓]        ││
│ │ • Building 1 │ └──────────────────────────────────────────────┘│
│ │ • Tree (x3)  │ ┌──────────────────────────────────────────────┐│
│ │ • Utility    │ │ Selected: Building 1                         ││
│ │   [🗑️ Del]   │ │ Size: 15m × 8m │ Buffer: 3m │ [Edit Shape]   ││
│ └──────────────┘ └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Deliverables
- [ ] Obstacle library with predefined types
- [ ] Drag-and-drop placement
- [ ] Custom shape drawing
- [ ] Buffer zone visualization
- [ ] Obstacle property editor
- [ ] Collision detection
- [ ] Import from DXF

---

## Phase 3: Entry/Exit Points

### Goal
Allow placement of vehicle entries and exits with traffic flow implications.

### Duration: 1.5 weeks

### Components

```
src/components/engineering/parking/
├── access/
│   ├── AccessPointPlacer.tsx      # Place entries/exits
│   ├── AccessPointEditor.tsx      # Edit properties
│   ├── TrafficFlowIndicator.tsx   # Show flow direction
│   └── DriveAislePlanner.tsx      # Main drive aisles
└── hooks/
    └── useAccessPoints.ts
```

### Access Point Properties

```typescript
interface AccessPoint extends EntryPoint {
  // Inherited: position, direction, width, type, lanes
  
  // Additional
  turnRestrictions: ('left' | 'right' | 'straight')[];
  peakHourVolume?: number; // Vehicles per hour
  connectsTo: string[]; // IDs of aisles this connects to
}
```

### Features

1. **Placement**
   - Click on boundary edge to place
   - Auto-snap to boundary
   - Direction indicator (into/out of site)

2. **Properties**
   - Entry/Exit/Bidirectional
   - Number of lanes
   - Width
   - Turn restrictions
   - Peak hour volume (for optimization)

3. **Traffic Flow**
   - Visualize primary circulation routes
   - One-way aisle suggestions based on entries
   - Warning for dead-ends

### AI Integration Point

```typescript
// AI suggests optimal entry placement
interface EntrySuggestion {
  position: Point2D;
  direction: number;
  reasoning: string;
  expectedFlow: number;
}

// Edge function: parking-optimize-entries
async function suggestEntryPlacements(site: ParkingSite): Promise<EntrySuggestion[]> {
  // Consider:
  // - Adjacent road types
  // - Site dimensions
  // - Expected capacity
  // - Traffic flow patterns
}
```

### UI Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────────────────────────────────────┐│
│ │ Access       │ │              ↓ Entry                         ││
│ ├──────────────┤ │    ┌─────────┴─────────┐                     ││
│ │ ➡️ Entry     │ │   /                     \                    ││
│ │ ⬅️ Exit      │ │  │   → → → → → → → → →  │──→ Exit            ││
│ │ ↔️ Both      │ │  │   ← ← ← ← ← ← ← ← ←  │                    ││
│ ├──────────────┤ │   \                     /                    ││
│ │ On Site:     │ │    └───────────────────┘                     ││
│ │ • Entry 1    │ │                                              ││
│ │ • Exit 1     │ │     ──→ Traffic Flow Direction               ││
│ └──────────────┘ └──────────────────────────────────────────────┘│
│ ┌────────────────────────────────────────────────────────────────┤
│ │ Entry 1: 2 lanes │ Width: 7m │ Peak: 120 vph │ [🤖 Suggest]   ││
│ └────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Deliverables
- [ ] Access point placement on boundary
- [ ] Direction/type configuration
- [ ] Traffic flow visualization
- [ ] Primary aisle routing
- [ ] Dead-end detection
- [ ] AI entry placement suggestions

---

## Phase 4: Zone-Based Configuration

### Goal
Enable different parking configurations in different areas of the site.

### Duration: 2.5 weeks

### Components

```
src/components/engineering/parking/
├── zones/
│   ├── ZoneDrawer.tsx             # Draw zone boundaries
│   ├── ZoneEditor.tsx             # Configure zone properties
│   ├── ZoneConfigPanel.tsx        # Detailed config UI
│   ├── ZonePreview.tsx            # Preview zone layout
│   └── ZonePriorityList.tsx       # Order zones for AI
└── hooks/
    └── useZones.ts
```

### Zone Types & Defaults

| Zone Type | Space Size | Default Angle | Aisle Width | Color |
|-----------|------------|---------------|-------------|-------|
| Standard | 2.5m × 5.0m | 90° | 6.0m | Blue |
| Compact | 2.3m × 4.5m | 90° | 5.5m | Green |
| Accessible | 3.6m × 5.5m | 90° | 6.0m | Yellow |
| EV Charging | 2.5m × 5.5m | 90° | 6.0m | Teal |
| Motorcycle | 1.2m × 2.4m | 90° | 3.0m | Orange |
| Loading | 3.5m × 9.0m | 0° | 8.0m | Red |
| Drop-off | 3.0m × 6.0m | 0° | 4.0m | Purple |

### Features

1. **Zone Creation**
   - Draw zone boundary within site
   - Auto-fill remaining area option
   - Copy zone configuration

2. **Zone Configuration**
   - Space type selection
   - Custom dimensions
   - Angle selection
   - One-way/two-way aisles
   - Space count target (AI will optimize)

3. **Zone Relationships**
   - Priority order for AI optimization
   - Minimum space requirements
   - Adjacent zone connections

### AI Integration Point

```typescript
// AI optimizes within each zone
interface ZoneOptimizationRequest {
  zone: ParkingZone;
  constraints: {
    minSpaces?: number;
    maxSpaces?: number;
    preferredAngle?: number;
    accessibleRatio?: number; // e.g., 2% of total
  };
}

interface ZoneOptimizationResult {
  spaces: ParkingSpace[];
  aisles: Aisle[];
  metrics: {
    totalSpaces: number;
    efficiency: number;
    warnings: string[];
  };
  alternatives: ZoneOptimizationResult[]; // AI provides options
}
```

### UI Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────────────────────────────────────┐│
│ │ Zones        │ │    ┌─────────────────┐                       ││
│ ├──────────────┤ │   /│  Zone A (90°)   │\                      ││
│ │ ➕ Add Zone  │ │  │ │  Standard       │ │                     ││
│ ├──────────────┤ │  │ ├─────────────────┤ │                     ││
│ │ Priority:    │ │  │ │  Zone B (45°)   │ │                     ││
│ │ 1. Zone A    │ │  │ │  Compact        │ │                     ││
│ │ 2. Zone B    │ │   \│  Zone C (0°)    │/                      ││
│ │ 3. Zone C    │ │    └─────────────────┘                       ││
│ │ [↕️ Reorder] │ │                                              ││
│ └──────────────┘ └──────────────────────────────────────────────┘│
│ ┌────────────────────────────────────────────────────────────────┤
│ │ Zone A: Standard │ 90° │ Est. 85 spaces │ [Configure] [🤖 AI] ││
│ └────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘

Zone Configuration Panel:
┌────────────────────────────────────────┐
│ Zone A Configuration                   │
├────────────────────────────────────────┤
│ Type: [Standard ▼]                     │
│ Angle: [90° ▼]                         │
│ Space: 2.5m × 5.0m                     │
│ Aisle: 6.0m  [One-way ☐]               │
├────────────────────────────────────────┤
│ Requirements:                          │
│ Min spaces: [__] Max: [__]             │
│ Accessible: 2% [✓ Auto]                │
│ EV Ready: 5% [✓]                       │
├────────────────────────────────────────┤
│ [Preview] [Apply] [🤖 Optimize]        │
└────────────────────────────────────────┘
```

### Deliverables
- [ ] Zone boundary drawing
- [ ] Zone configuration panel
- [ ] Zone type presets
- [ ] Priority ordering
- [ ] Zone-specific preview
- [ ] Zone metrics calculation
- [ ] Copy/paste zone config

---

## Phase 5: AI-Driven Optimization

### Goal
Full AI integration that analyzes the entire site and generates optimal layouts while respecting all constraints.

### Duration: 3-4 weeks

### Components

```
src/components/engineering/parking/
├── ai/
│   ├── AIOptimizer.tsx            # Main AI interface
│   ├── OptimizationProgress.tsx   # Progress indicator
│   ├── SuggestionCards.tsx        # Display AI suggestions
│   ├── AlternativeLayouts.tsx     # Compare AI options
│   └── OptimizationReport.tsx     # Detailed analysis
└── hooks/
    ├── useAIOptimization.ts
    └── useLayoutComparison.ts

supabase/functions/
├── parking-analyze-site/          # Analyze site for optimization
├── parking-generate-layout/       # Generate optimal layout
├── parking-suggest-zones/         # Suggest zone configurations
└── parking-traffic-analysis/      # Analyze traffic flow
```

### AI Capabilities

1. **Site Analysis**
   - Identify optimal zone placement
   - Suggest entry/exit locations
   - Detect problematic areas
   - Calculate maximum capacity

2. **Layout Generation**
   - Generate multiple layout options
   - Optimize for different goals:
     - Maximum capacity
     - Best traffic flow
     - Shortest walk distances
     - Balanced approach

3. **Real-time Suggestions**
   - "This corner works better at 45°"
   - "Add entry here to reduce congestion"
   - "Compact spaces here would add 12 more spots"
   - "Consider removing this tree to gain 8 spaces"

4. **Compliance Checking**
   - ADA requirements (accessible space ratio)
   - Fire lane clearances
   - Local code requirements
   - EV charging mandates

### AI Edge Functions

```typescript
// parking-generate-layout/index.ts
interface LayoutGenerationRequest {
  site: ParkingSite;
  optimizationGoal: 'capacity' | 'flow' | 'walkability' | 'balanced';
  constraints: {
    minAccessible: number;
    minEV: number;
    maxWalkDistance: number;
  };
}

interface LayoutGenerationResponse {
  layouts: GeneratedLayout[];
  reasoning: string;
  tradeoffs: {
    layout1vs2: string;
    recommendations: string;
  };
}

// AI System Prompt for Layout Generation
const LAYOUT_SYSTEM_PROMPT = `
You are an expert parking lot designer. Given site constraints, generate optimal layouts.

Consider:
1. Traffic flow from entries to all areas
2. Pedestrian safety paths
3. Fire lane requirements (min 6m clear)
4. ADA accessibility routes
5. Efficient space utilization
6. Angle optimization by area

Output structured layout data with coordinates.
`;
```

### Real-time Analysis Flow

```
User Action → Client Validation → Edge Function → AI Analysis → Streaming Response
     ↓              ↓                  ↓               ↓              ↓
  Draw zone    Check geometry    Send context    Generate      Update UI
  Add obstacle  Local preview    to Gemini       suggestions   progressively
```

### UI Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 AI Optimizer                                    [Settings ⚙️] │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Optimization Goal:                                           │ │
│ │ [◉ Max Capacity] [○ Best Flow] [○ Walkability] [○ Balanced] │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ [🚀 Generate Optimal Layout]                                 │ │
│ └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│ 💡 AI Suggestions:                                               │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ 📐 "Use 45° parking in northeast corner for +12 spaces"    │   │
│ │    [Apply] [Dismiss] [Why?]                                │   │
│ ├────────────────────────────────────────────────────────────┤   │
│ │ 🚗 "Add second entry on west side to reduce congestion"    │   │
│ │    [Apply] [Dismiss] [Why?]                                │   │
│ ├────────────────────────────────────────────────────────────┤   │
│ │ ♿ "Move accessible spaces closer to main entrance"        │   │
│ │    [Apply] [Dismiss] [Why?]                                │   │
│ └────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│ 📊 Layout Comparison:                                            │
│ ┌─────────────┬─────────────┬─────────────┐                     │
│ │  Option A   │  Option B   │  Option C   │                     │
│ │  156 spaces │  148 spaces │  152 spaces │                     │
│ │  82% eff.   │  78% eff.   │  80% eff.   │                     │
│ │  Tight flow │  Best flow  │  Balanced   │                     │
│ │  [Select]   │  [Select]   │  [Select]   │                     │
│ └─────────────┴─────────────┴─────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
```

### Deliverables
- [ ] AI site analysis function
- [ ] Layout generation with multiple options
- [ ] Real-time suggestion engine
- [ ] Streaming AI responses
- [ ] Layout comparison UI
- [ ] Apply/dismiss suggestion flow
- [ ] Optimization progress indicator
- [ ] Compliance validation
- [ ] Generate optimization report

---

## Database Schema

```sql
-- Parking projects table
CREATE TABLE parking_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  site_data JSONB NOT NULL, -- Full ParkingSite object
  generated_layout JSONB,
  status TEXT DEFAULT 'draft', -- draft, optimizing, complete
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE parking_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their parking projects"
ON parking_projects
FOR ALL
USING (auth.uid() = user_id);

-- AI optimization history
CREATE TABLE parking_optimization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES parking_projects NOT NULL,
  optimization_type TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Implementation Timeline

| Phase | Duration | Dependencies | Key Milestone |
|-------|----------|--------------|---------------|
| Phase 1 | 2-3 weeks | None | Canvas with polygon drawing |
| Phase 2 | 2 weeks | Phase 1 | Obstacles with buffers |
| Phase 3 | 1.5 weeks | Phase 1 | Entry/exit placement |
| Phase 4 | 2.5 weeks | Phase 1-3 | Zone configuration |
| Phase 5 | 3-4 weeks | Phase 1-4 | Full AI optimization |

**Total: 11-15 weeks**

---

## Success Metrics

1. **User Adoption**
   - Time to first layout < 5 minutes
   - Layout iterations before export < 3

2. **AI Effectiveness**
   - Suggestion acceptance rate > 60%
   - Capacity improvement over manual > 15%

3. **Technical Performance**
   - Layout generation < 10 seconds
   - Canvas rendering > 30 FPS
   - AI response streaming < 500ms first token

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Complex polygon math | Use established library (turf.js) |
| AI layout quality | Human review + refinement tools |
| Performance with large sites | Progressive rendering, Web Workers |
| Mobile usability | Desktop-first, mobile for viewing only |

---

## Future Enhancements (Post-MVP)

- Multi-story parking structure support
- Solar canopy integration
- Stormwater/drainage design
- Construction phasing
- Cost estimation integration
- VR/AR site walkthrough
- Collaborative editing
- Version history

---

*Document Version: 1.0*
*Last Updated: 2025-01-15*
