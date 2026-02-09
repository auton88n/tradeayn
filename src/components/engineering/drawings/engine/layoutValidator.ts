/**
 * Layout Validator — Post-generation validation for AI floor plan layouts.
 * Catches room overlaps, envelope violations, adjacency errors, and coordinate drift.
 * Returns warnings (non-blocking) and errors (blocking).
 */

import type { FloorPlanLayout } from './FloorPlanRenderer';

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  snappedLayout: FloorPlanLayout;
}

export interface ValidationIssue {
  code: string;
  message: string;
  roomIds?: string[];
}

// Adjacency pairs that MUST NOT be adjacent
const MUST_NOT_ADJACENT: [string, string][] = [
  ['bathroom', 'kitchen'],
  ['ensuite', 'kitchen'],
  ['garage', 'bedroom'],
  ['garage', 'living'],
  ['kitchen', 'bedroom'], // specifically master, but we check all
];

// Max aspect ratios by room type
const MAX_ASPECT: Record<string, number> = {
  living: 1.3, dining: 1.3, kitchen: 1.4, bedroom: 1.3,
  bathroom: 1.8, ensuite: 1.5, family: 1.4, office: 1.3,
  entry: 1.5, mudroom: 1.5, laundry: 1.5, pantry: 1.5,
  garage: 2.0, closet: 4.0, hallway: 99, stairwell: 99,
  utility: 2.0,
};

function snap(v: number): number {
  return Math.round(v * 2) / 2;
}

/**
 * Snap all coordinates in the layout to the nearest 0.5ft grid.
 */
function snapCoordinates(layout: FloorPlanLayout): FloorPlanLayout {
  const snapped = JSON.parse(JSON.stringify(layout)) as FloorPlanLayout;

  snapped.building.total_width_ft = snap(snapped.building.total_width_ft);
  snapped.building.total_depth_ft = snap(snapped.building.total_depth_ft);

  for (const floor of snapped.floors) {
    for (const room of floor.rooms) {
      room.x = snap(room.x);
      room.y = snap(room.y);
      room.width = snap(room.width);
      room.depth = snap(room.depth);
    }
    for (const wall of floor.walls) {
      wall.start_x = snap(wall.start_x);
      wall.start_y = snap(wall.start_y);
      wall.end_x = snap(wall.end_x);
      wall.end_y = snap(wall.end_y);
    }
  }

  return snapped;
}

/**
 * Check if two rooms overlap (share interior area).
 */
function roomsOverlap(
  a: { x: number; y: number; width: number; depth: number },
  b: { x: number; y: number; width: number; depth: number },
  tolerance = 0.25
): boolean {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.depth, b.y + b.depth) - Math.max(a.y, b.y);
  return overlapX > tolerance && overlapY > tolerance;
}

/**
 * Check if two rooms are adjacent (share an edge).
 */
function roomsAdjacent(
  a: { x: number; y: number; width: number; depth: number },
  b: { x: number; y: number; width: number; depth: number },
  tolerance = 0.5
): boolean {
  // Check if they share a vertical edge
  const shareVertical =
    (Math.abs((a.x + a.width) - b.x) < tolerance || Math.abs((b.x + b.width) - a.x) < tolerance) &&
    Math.min(a.y + a.depth, b.y + b.depth) - Math.max(a.y, b.y) > tolerance;

  // Check if they share a horizontal edge
  const shareHorizontal =
    (Math.abs((a.y + a.depth) - b.y) < tolerance || Math.abs((b.y + b.depth) - a.y) < tolerance) &&
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > tolerance;

  return shareVertical || shareHorizontal;
}

/**
 * Run all validations on a layout.
 */
export function validateLayout(layout: FloorPlanLayout): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Step 0: Snap coordinates
  const snapped = snapCoordinates(layout);

  for (const floor of snapped.floors) {
    const rooms = floor.rooms;

    // 1. Room overlap detection
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        if (roomsOverlap(rooms[i], rooms[j])) {
          errors.push({
            code: 'ROOM_OVERLAP',
            message: `Rooms "${rooms[i].name}" and "${rooms[j].name}" overlap`,
            roomIds: [rooms[i].id, rooms[j].id],
          });
        }
      }
    }

    // 2. Building envelope check
    const bw = snapped.building.total_width_ft;
    const bd = snapped.building.total_depth_ft;
    for (const room of rooms) {
      if (room.x < -0.5 || room.y < -0.5 ||
          room.x + room.width > bw + 0.5 ||
          room.y + room.depth > bd + 0.5) {
        warnings.push({
          code: 'OUTSIDE_ENVELOPE',
          message: `Room "${room.name}" extends outside building envelope`,
          roomIds: [room.id],
        });
      }
    }

    // 3. Room aspect ratio check
    for (const room of rooms) {
      const w = Math.max(room.width, room.depth);
      const h = Math.min(room.width, room.depth);
      if (h > 0) {
        const aspect = w / h;
        const maxAspect = MAX_ASPECT[room.type] ?? 2.0;
        if (aspect > maxAspect + 0.1) {
          warnings.push({
            code: 'BAD_ASPECT_RATIO',
            message: `Room "${room.name}" aspect ratio ${aspect.toFixed(1)}:1 exceeds max ${maxAspect}:1`,
            roomIds: [room.id],
          });
        }
      }
    }

    // 4. Adjacency violations (MUST NOT pairs)
    for (const [typeA, typeB] of MUST_NOT_ADJACENT) {
      const roomsA = rooms.filter(r => r.type === typeA);
      const roomsB = rooms.filter(r => r.type === typeB);
      for (const a of roomsA) {
        for (const b of roomsB) {
          if (roomsAdjacent(a, b)) {
            warnings.push({
              code: 'ADJACENCY_VIOLATION',
              message: `"${a.name}" (${typeA}) should NOT be adjacent to "${b.name}" (${typeB})`,
              roomIds: [a.id, b.id],
            });
          }
        }
      }
    }

    // 5. Total area check
    const nonGarageRooms = rooms.filter(r => r.type !== 'garage');
    const totalRoomArea = nonGarageRooms.reduce((sum, r) => sum + r.width * r.depth, 0);
    const envelopeArea = bw * bd;
    const garageArea = rooms.filter(r => r.type === 'garage').reduce((sum, r) => sum + r.width * r.depth, 0);
    const livableEnvelope = envelopeArea - garageArea;

    if (totalRoomArea > livableEnvelope * 1.15) {
      warnings.push({
        code: 'AREA_EXCEEDS_ENVELOPE',
        message: `Total room area (${Math.round(totalRoomArea)} SF) exceeds livable envelope (${Math.round(livableEnvelope)} SF) by >15%`,
      });
    }

    // 6. Check every room has at least one door
    const roomsWithDoors = new Set<string>();
    for (const door of floor.doors) {
      // Find which rooms the door's wall borders
      const wall = floor.walls.find(w => w.id === door.wall_id);
      if (wall) {
        for (const room of rooms) {
          // Check if wall touches this room's boundary
          const touches =
            (wall.start_x >= room.x - 0.5 && wall.end_x <= room.x + room.width + 0.5 &&
             wall.start_y >= room.y - 0.5 && wall.end_y <= room.y + room.depth + 0.5);
          if (touches) roomsWithDoors.add(room.id);
        }
      }
    }
    // Don't error on this, just warn — the heuristic above is imperfect
    const roomsWithoutDoors = rooms.filter(r =>
      !roomsWithDoors.has(r.id) && r.type !== 'closet' && r.type !== 'pantry'
    );
    for (const room of roomsWithoutDoors) {
      warnings.push({
        code: 'NO_DOOR',
        message: `Room "${room.name}" may not have a door`,
        roomIds: [room.id],
      });
    }

    // 7. Foyer size check
    const foyers = rooms.filter(r => r.type === 'entry');
    for (const foyer of foyers) {
      if (foyer.width * foyer.depth > 80) {
        warnings.push({
          code: 'FOYER_TOO_LARGE',
          message: `Foyer "${foyer.name}" is ${Math.round(foyer.width * foyer.depth)} SF (max recommended: 80 SF)`,
          roomIds: [foyer.id],
        });
      }
    }

    // 8. Hallway area check
    const hallways = rooms.filter(r => r.type === 'hallway');
    const hallwayArea = hallways.reduce((sum, r) => sum + r.width * r.depth, 0);
    if (totalRoomArea > 0 && hallwayArea / totalRoomArea > 0.12) {
      warnings.push({
        code: 'HALLWAY_TOO_LARGE',
        message: `Hallway area (${Math.round(hallwayArea)} SF) is ${Math.round(hallwayArea / totalRoomArea * 100)}% of total (max 10%)`,
      });
    }
  }

  return { errors, warnings, snappedLayout: snapped };
}

/**
 * Generate a refinement instruction from validation errors.
 */
export function errorsToRefinementInstruction(errors: ValidationIssue[]): string {
  const lines = errors.map(e => `- ${e.message}`);
  return `The layout has the following critical issues that must be fixed:\n${lines.join('\n')}\n\nPlease fix these issues while maintaining the overall design intent. Ensure rooms do not overlap and all fit within the building envelope.`;
}
