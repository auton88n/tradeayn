// Core type definitions for Advanced Parking Designer

export interface Point2D {
  id: string;
  x: number; // meters
  y: number; // meters
}

export interface Polygon {
  points: Point2D[];
}

export interface BoundaryMetrics {
  area: number;           // Square meters
  perimeter: number;      // Meters
  isValid: boolean;       // No self-intersections
  pointCount: number;
  validationError?: string;
}

export interface ParkingSite {
  id: string;
  name: string;
  boundary: Polygon | null;
  obstacles: Obstacle[];      // Phase 2
  entries: EntryPoint[];      // Phase 3
  zones: ParkingZone[];       // Phase 4
  createdAt: Date;
  updatedAt: Date;
}

// Phase 2 types (placeholder)
export interface Obstacle {
  id: string;
  type: 'building' | 'tree' | 'utility' | 'other';
  polygon: Polygon;
  bufferDistance: number;
}

// Phase 3 types (placeholder)
export interface EntryPoint {
  id: string;
  position: Point2D;
  width: number;
  type: 'entry' | 'exit' | 'both';
  lanes: number;
}

// Phase 4 types (placeholder)
export interface ParkingZone {
  id: string;
  name: string;
  polygon: Polygon;
  config: {
    angle: number;
    spaceWidth: number;
    spaceLength: number;
    aisleWidth: number;
  };
}

// Canvas/UI state
export type CanvasMode = 'view' | 'edit';

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
}

// Generated layout types
export interface ParkingSpace {
  id: string;
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  type: 'standard' | 'accessible' | 'compact' | 'ev';
}

export interface GeneratedLayout {
  spaces: ParkingSpace[];
  aisles: { x: number; y: number; width: number; height: number }[];
  totalSpaces: number;
  accessibleSpaces: number;
  evSpaces: number;
  efficiency: number;
}
