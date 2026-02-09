/**
 * Wall Geometry Engine — handles wall intersection cleanup for clean architectural drawings.
 * 
 * Instead of drawing each wall as an independent rectangle (which creates overlaps at
 * every corner and T-junction), this engine:
 * 1. Models walls as a connected graph
 * 2. Identifies junction types (L-corner, T-junction, cross)
 * 3. Computes merged polygon outlines with clean joins
 * 4. Cuts door/window openings from the wall polygons
 */

import { inToSvg, ftToSvg, type DrawingScale, DEFAULT_SCALE } from './drawingConstants';

// ── Types ───────────────────────────────────────────────────────────────────

export interface WallData {
  id: string;
  start_x: number; // feet
  start_y: number;
  end_x: number;
  end_y: number;
  thickness: number; // inches
  type: 'exterior' | 'interior' | 'partition';
  insulated?: boolean;
}

export interface DoorData {
  id: string;
  wall_id: string;
  position_along_wall: number; // feet from wall start
  width: number; // inches
  swing: 'left' | 'right' | 'double' | 'sliding';
  type: 'interior' | 'exterior' | 'garage' | 'sliding_glass';
}

export interface WindowData {
  id: string;
  wall_id: string;
  position_along_wall: number; // feet from wall start
  width: number; // inches
  height: number;
  sill_height?: number;
  type: 'single_hung' | 'double_hung' | 'casement' | 'fixed' | 'sliding' | 'picture';
}

export interface Point {
  x: number;
  y: number;
}

export interface WallSegment {
  wallId: string;
  type: WallData['type'];
  // Four corners of the wall rectangle (in SVG units)
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
  // Centerline endpoints (SVG units)
  start: Point;
  end: Point;
  // Half-thickness in SVG units
  halfThickness: number;
  // Is wall horizontal or vertical?
  orientation: 'horizontal' | 'vertical';
  // Openings cut into this wall
  openings: Array<{
    type: 'door' | 'window';
    data: DoorData | WindowData;
    startOffset: number; // SVG units from wall start
    width: number;       // SVG units
  }>;
}

// ── Core Functions ──────────────────────────────────────────────────────────

/** Convert raw wall data to WallSegments in SVG coordinates */
export function processWalls(
  walls: WallData[],
  doors: DoorData[],
  windows: WindowData[],
  scale: DrawingScale = DEFAULT_SCALE
): WallSegment[] {
  const segments: WallSegment[] = walls.map(wall => {
    const startX = ftToSvg(wall.start_x, scale);
    const startY = ftToSvg(wall.start_y, scale);
    const endX = ftToSvg(wall.end_x, scale);
    const endY = ftToSvg(wall.end_y, scale);
    const halfThick = inToSvg(wall.thickness, scale) / 2;

    const isHorizontal = Math.abs(endY - startY) < 0.01;

    let topLeft: Point, topRight: Point, bottomLeft: Point, bottomRight: Point;

    if (isHorizontal) {
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const y = startY;
      topLeft = { x: minX, y: y - halfThick };
      topRight = { x: maxX, y: y - halfThick };
      bottomLeft = { x: minX, y: y + halfThick };
      bottomRight = { x: maxX, y: y + halfThick };
    } else {
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      const x = startX;
      topLeft = { x: x - halfThick, y: minY };
      topRight = { x: x + halfThick, y: minY };
      bottomLeft = { x: x - halfThick, y: maxY };
      bottomRight = { x: x + halfThick, y: maxY };
    }

    return {
      wallId: wall.id,
      type: wall.type,
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      halfThickness: halfThick,
      orientation: isHorizontal ? 'horizontal' : 'vertical',
      openings: [],
    };
  });

  // Assign openings to their walls
  for (const door of doors) {
    const seg = segments.find(s => s.wallId === door.wall_id);
    if (seg) {
      seg.openings.push({
        type: 'door',
        data: door,
        startOffset: ftToSvg(door.position_along_wall, scale) - inToSvg(door.width, scale) / 2,
        width: inToSvg(door.width, scale),
      });
    }
  }

  for (const win of windows) {
    const seg = segments.find(s => s.wallId === win.wall_id);
    if (seg) {
      seg.openings.push({
        type: 'window',
        data: win,
        startOffset: ftToSvg(win.position_along_wall, scale) - inToSvg(win.width, scale) / 2,
        width: inToSvg(win.width, scale),
      });
    }
  }

  return segments;
}

/**
 * Find junctions where walls meet and extend/trim walls for clean intersections.
 * This modifies the wall corners in-place to produce mitered L-corners and
 * properly trimmed T-junctions.
 */
export function resolveIntersections(segments: WallSegment[]): WallSegment[] {
  const TOLERANCE = 0.5; // SVG units

  // Build endpoint index: for each endpoint, find all walls that share it
  const endpointMap = new Map<string, Array<{ segment: WallSegment; endType: 'start' | 'end' }>>();

  for (const seg of segments) {
    const startKey = `${Math.round(seg.start.x * 10)},${Math.round(seg.start.y * 10)}`;
    const endKey = `${Math.round(seg.end.x * 10)},${Math.round(seg.end.y * 10)}`;

    if (!endpointMap.has(startKey)) endpointMap.set(startKey, []);
    endpointMap.get(startKey)!.push({ segment: seg, endType: 'start' });

    if (!endpointMap.has(endKey)) endpointMap.set(endKey, []);
    endpointMap.get(endKey)!.push({ segment: seg, endType: 'end' });
  }

  // Process junctions
  for (const [, connected] of endpointMap) {
    if (connected.length === 2) {
      // L-corner or collinear: extend both walls to meet at outer corner
      const [a, b] = connected;
      if (a.segment.orientation !== b.segment.orientation) {
        miterLCorner(a.segment, a.endType, b.segment, b.endType);
      }
    } else if (connected.length === 3) {
      // T-junction: find the through-wall and trim the butting wall
      handleTJunction(connected);
    }
    // 4-way intersections: walls already overlap correctly when corners are extended
  }

  return segments;
}

/** Extend two perpendicular walls to meet at a mitered L-corner */
function miterLCorner(
  segA: WallSegment, endA: 'start' | 'end',
  segB: WallSegment, endB: 'start' | 'end'
): void {
  // For an L-corner, the horizontal wall extends into the vertical wall's thickness
  // and vice versa. This creates a clean filled corner.

  const hSeg = segA.orientation === 'horizontal' ? segA : segB;
  const vSeg = segA.orientation === 'horizontal' ? segB : segA;
  const hEnd = segA.orientation === 'horizontal' ? endA : endB;
  const vEnd = segA.orientation === 'horizontal' ? endB : endA;

  // Extend horizontal wall into vertical wall's thickness
  if (hEnd === 'end' || (hEnd === 'start' && hSeg.start.x > hSeg.end.x)) {
    // Extend right
    hSeg.topRight.x += vSeg.halfThickness;
    hSeg.bottomRight.x += vSeg.halfThickness;
  } else {
    // Extend left
    hSeg.topLeft.x -= vSeg.halfThickness;
    hSeg.bottomLeft.x -= vSeg.halfThickness;
  }

  // Extend vertical wall into horizontal wall's thickness
  if (vEnd === 'end' || (vEnd === 'start' && vSeg.start.y > vSeg.end.y)) {
    // Extend down
    vSeg.bottomLeft.y += hSeg.halfThickness;
    vSeg.bottomRight.y += hSeg.halfThickness;
  } else {
    // Extend up
    vSeg.topLeft.y -= hSeg.halfThickness;
    vSeg.topRight.y -= hSeg.halfThickness;
  }
}

/** Handle a T-junction: the through-wall continues, butting wall stops at its face.
 *  Direction-aware: determines which face of the through-wall the butting wall should trim to. */
function handleTJunction(
  connected: Array<{ segment: WallSegment; endType: 'start' | 'end' }>
): void {
  const horiz = connected.filter(c => c.segment.orientation === 'horizontal');
  const vert = connected.filter(c => c.segment.orientation === 'vertical');

  let throughWalls: typeof connected;
  let buttingWall: typeof connected[0];

  if (horiz.length === 2 && vert.length === 1) {
    throughWalls = horiz;
    buttingWall = vert[0];
  } else if (vert.length === 2 && horiz.length === 1) {
    throughWalls = vert;
    buttingWall = horiz[0];
  } else {
    return; // Ambiguous, skip
  }

  const tSeg = throughWalls[0].segment;
  const bSeg = buttingWall.segment;
  const bEnd = buttingWall.endType;

  if (bSeg.orientation === 'vertical') {
    // Butting wall is vertical, through-wall is horizontal
    // Determine if butting wall approaches from above or below
    const buttCenter = bEnd === 'end' ? bSeg.end.y : bSeg.start.y;
    const throughCenter = tSeg.start.y;
    
    if (buttCenter >= throughCenter) {
      // Butting wall comes from above (its end/start is at/below through-wall)
      // Trim to top face of through-wall
      if (bEnd === 'end') {
        bSeg.bottomLeft.y = tSeg.topLeft.y;
        bSeg.bottomRight.y = tSeg.topLeft.y;
      } else {
        bSeg.topLeft.y = tSeg.topLeft.y;
        bSeg.topRight.y = tSeg.topLeft.y;
      }
    } else {
      // Butting wall comes from below — trim to bottom face
      if (bEnd === 'end') {
        bSeg.bottomLeft.y = tSeg.bottomLeft.y;
        bSeg.bottomRight.y = tSeg.bottomLeft.y;
      } else {
        bSeg.topLeft.y = tSeg.bottomLeft.y;
        bSeg.topRight.y = tSeg.bottomLeft.y;
      }
    }
  } else {
    // Butting wall is horizontal, through-wall is vertical
    const buttCenter = bEnd === 'end' ? bSeg.end.x : bSeg.start.x;
    const throughCenter = tSeg.start.x;
    
    if (buttCenter >= throughCenter) {
      // Butting wall comes from left — trim to left face
      if (bEnd === 'end') {
        bSeg.topRight.x = tSeg.topLeft.x;
        bSeg.bottomRight.x = tSeg.topLeft.x;
      } else {
        bSeg.topLeft.x = tSeg.topLeft.x;
        bSeg.bottomLeft.x = tSeg.topLeft.x;
      }
    } else {
      // Butting wall comes from right — trim to right face
      if (bEnd === 'end') {
        bSeg.topRight.x = tSeg.topRight.x;
        bSeg.bottomRight.x = tSeg.topRight.x;
      } else {
        bSeg.topLeft.x = tSeg.topRight.x;
        bSeg.bottomLeft.x = tSeg.topRight.x;
      }
    }
  }
}

/**
 * Generate SVG path data for a wall segment, with openings cut out.
 * Returns an array of path segments (one continuous wall may be split by openings).
 */
export function wallToSvgPaths(segment: WallSegment): string[] {
  if (segment.openings.length === 0) {
    // Simple rectangle
    return [rectToPath(segment.topLeft, segment.topRight, segment.bottomRight, segment.bottomLeft)];
  }

  // Sort openings by position along wall
  const sorted = [...segment.openings].sort((a, b) => a.startOffset - b.startOffset);
  const paths: string[] = [];

  if (segment.orientation === 'horizontal') {
    const wallStartX = segment.topLeft.x;
    const y1 = segment.topLeft.y;
    const y2 = segment.bottomLeft.y;
    let currentX = wallStartX;

    for (const opening of sorted) {
      const openStart = wallStartX + opening.startOffset;
      const openEnd = openStart + opening.width;

      if (openStart > currentX) {
        // Wall segment before this opening
        paths.push(
          `M ${currentX},${y1} L ${openStart},${y1} L ${openStart},${y2} L ${currentX},${y2} Z`
        );
      }
      currentX = openEnd;
    }

    // Wall segment after last opening
    const wallEndX = segment.topRight.x;
    if (currentX < wallEndX) {
      paths.push(
        `M ${currentX},${y1} L ${wallEndX},${y1} L ${wallEndX},${y2} L ${currentX},${y2} Z`
      );
    }
  } else {
    // Vertical wall
    const wallStartY = segment.topLeft.y;
    const x1 = segment.topLeft.x;
    const x2 = segment.topRight.x;
    let currentY = wallStartY;

    for (const opening of sorted) {
      const openStart = wallStartY + opening.startOffset;
      const openEnd = openStart + opening.width;

      if (openStart > currentY) {
        paths.push(
          `M ${x1},${currentY} L ${x2},${currentY} L ${x2},${openStart} L ${x1},${openStart} Z`
        );
      }
      currentY = openEnd;
    }

    const wallEndY = segment.bottomLeft.y;
    if (currentY < wallEndY) {
      paths.push(
        `M ${x1},${currentY} L ${x2},${currentY} L ${x2},${wallEndY} L ${x1},${wallEndY} Z`
      );
    }
  }

  return paths;
}

/** Create SVG path from four corner points */
function rectToPath(tl: Point, tr: Point, br: Point, bl: Point): string {
  return `M ${tl.x},${tl.y} L ${tr.x},${tr.y} L ${br.x},${br.y} L ${bl.x},${bl.y} Z`;
}

/**
 * Get the position and dimensions of an opening in SVG coordinates,
 * for placing door/window symbols.
 */
export function getOpeningPosition(
  segment: WallSegment,
  opening: WallSegment['openings'][0]
): { x: number; y: number; width: number; thickness: number; angle: number } {
  if (segment.orientation === 'horizontal') {
    return {
      x: segment.topLeft.x + opening.startOffset,
      y: segment.topLeft.y,
      width: opening.width,
      thickness: segment.halfThickness * 2,
      angle: 0,
    };
  } else {
    return {
      x: segment.topLeft.x,
      y: segment.topLeft.y + opening.startOffset,
      width: opening.width,
      thickness: segment.halfThickness * 2,
      angle: 90,
    };
  }
}
