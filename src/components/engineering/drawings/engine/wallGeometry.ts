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
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
  start: Point;
  end: Point;
  halfThickness: number;
  orientation: 'horizontal' | 'vertical';
  openings: Array<{
    type: 'door' | 'window';
    data: DoorData | WindowData;
    startOffset: number;
    width: number;
  }>;
}

// ── Core Functions ──────────────────────────────────────────────────────────

/** Remove near-duplicate walls (same start/end within tolerance) */
function deduplicateWalls(walls: WallData[], toleranceFt: number = 0.5): WallData[] {
  const result: WallData[] = [];
  for (const wall of walls) {
    const isDup = result.some(existing => {
      const sameDirection =
        Math.abs(existing.start_x - wall.start_x) < toleranceFt &&
        Math.abs(existing.start_y - wall.start_y) < toleranceFt &&
        Math.abs(existing.end_x - wall.end_x) < toleranceFt &&
        Math.abs(existing.end_y - wall.end_y) < toleranceFt;
      const reversed =
        Math.abs(existing.start_x - wall.end_x) < toleranceFt &&
        Math.abs(existing.start_y - wall.end_y) < toleranceFt &&
        Math.abs(existing.end_x - wall.start_x) < toleranceFt &&
        Math.abs(existing.end_y - wall.start_y) < toleranceFt;
      return sameDirection || reversed;
    });
    if (!isDup) result.push(wall);
  }
  return result;
}

/** Convert raw wall data to WallSegments in SVG coordinates */
export function processWalls(
  walls: WallData[],
  doors: DoorData[],
  windows: WindowData[],
  scale: DrawingScale = DEFAULT_SCALE
): WallSegment[] {
  // Deduplicate walls first
  const uniqueWalls = deduplicateWalls(walls);

  const segments: WallSegment[] = uniqueWalls.map(wall => {
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
 * Uses coarser rounding for endpoint matching to handle AI coordinate imprecision.
 */
export function resolveIntersections(segments: WallSegment[]): WallSegment[] {
  // Build endpoint index with coarser rounding (÷5 instead of ÷10) for tolerance ~1.0 SVG units
  const endpointMap = new Map<string, Array<{ segment: WallSegment; endType: 'start' | 'end' }>>();

  for (const seg of segments) {
    const startKey = `${Math.round(seg.start.x * 5)},${Math.round(seg.start.y * 5)}`;
    const endKey = `${Math.round(seg.end.x * 5)},${Math.round(seg.end.y * 5)}`;

    if (!endpointMap.has(startKey)) endpointMap.set(startKey, []);
    endpointMap.get(startKey)!.push({ segment: seg, endType: 'start' });

    if (!endpointMap.has(endKey)) endpointMap.set(endKey, []);
    endpointMap.get(endKey)!.push({ segment: seg, endType: 'end' });
  }

  // Process junctions
  for (const [, connected] of endpointMap) {
    if (connected.length === 2) {
      const [a, b] = connected;
      if (a.segment.orientation !== b.segment.orientation) {
        miterLCorner(a.segment, a.endType, b.segment, b.endType);
      }
    } else if (connected.length === 3) {
      handleTJunction(connected);
    }
  }

  return segments;
}

/** Extend two perpendicular walls to meet at a mitered L-corner.
 *  Direction-aware: checks which end of each wall is at the junction. */
function miterLCorner(
  segA: WallSegment, endA: 'start' | 'end',
  segB: WallSegment, endB: 'start' | 'end'
): void {
  const hSeg = segA.orientation === 'horizontal' ? segA : segB;
  const vSeg = segA.orientation === 'horizontal' ? segB : segA;
  const hEnd = segA.orientation === 'horizontal' ? endA : endB;
  const vEnd = segA.orientation === 'horizontal' ? endB : endA;

  // Determine which end of the horizontal wall is at the junction
  const hJunctionX = hEnd === 'start' ? hSeg.start.x : hSeg.end.x;
  const hOtherX = hEnd === 'start' ? hSeg.end.x : hSeg.start.x;
  const extendsRight = hJunctionX >= hOtherX; // junction is at the right end

  if (extendsRight) {
    hSeg.topRight.x = Math.max(hSeg.topRight.x, hSeg.topRight.x + vSeg.halfThickness);
    hSeg.bottomRight.x = Math.max(hSeg.bottomRight.x, hSeg.bottomRight.x + vSeg.halfThickness);
  } else {
    hSeg.topLeft.x = Math.min(hSeg.topLeft.x, hSeg.topLeft.x - vSeg.halfThickness);
    hSeg.bottomLeft.x = Math.min(hSeg.bottomLeft.x, hSeg.bottomLeft.x - vSeg.halfThickness);
  }

  // Determine which end of the vertical wall is at the junction
  const vJunctionY = vEnd === 'start' ? vSeg.start.y : vSeg.end.y;
  const vOtherY = vEnd === 'start' ? vSeg.end.y : vSeg.start.y;
  const extendsDown = vJunctionY >= vOtherY; // junction is at the bottom end

  if (extendsDown) {
    vSeg.bottomLeft.y = Math.max(vSeg.bottomLeft.y, vSeg.bottomLeft.y + hSeg.halfThickness);
    vSeg.bottomRight.y = Math.max(vSeg.bottomRight.y, vSeg.bottomRight.y + hSeg.halfThickness);
  } else {
    vSeg.topLeft.y = Math.min(vSeg.topLeft.y, vSeg.topLeft.y - hSeg.halfThickness);
    vSeg.topRight.y = Math.min(vSeg.topRight.y, vSeg.topRight.y - hSeg.halfThickness);
  }
}

/** Handle a T-junction: the through-wall continues, butting wall trims to through-wall face.
 *  Direction-aware: determines which face based on approach direction. */
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
    return;
  }

  const tSeg = throughWalls[0].segment;
  const bSeg = buttingWall.segment;
  const bEnd = buttingWall.endType;

  // Determine butting wall's approach direction
  if (bSeg.orientation === 'vertical') {
    // Through-wall is horizontal; butting wall is vertical
    // Figure out if butting wall approaches from above or below
    const bOtherY = bEnd === 'end' ? bSeg.start.y : bSeg.end.y;
    const bJunctionY = bEnd === 'end' ? bSeg.end.y : bSeg.start.y;
    const comesFromAbove = bOtherY < bJunctionY;

    if (comesFromAbove) {
      // Wall comes down from above → trim bottom to top face of through-wall
      if (bEnd === 'end') {
        bSeg.bottomLeft.y = tSeg.topLeft.y;
        bSeg.bottomRight.y = tSeg.topLeft.y;
      } else {
        bSeg.topLeft.y = tSeg.topLeft.y;
        bSeg.topRight.y = tSeg.topLeft.y;
      }
    } else {
      // Wall comes up from below → trim top to bottom face of through-wall
      if (bEnd === 'end') {
        bSeg.bottomLeft.y = tSeg.bottomLeft.y;
        bSeg.bottomRight.y = tSeg.bottomLeft.y;
      } else {
        bSeg.topLeft.y = tSeg.bottomLeft.y;
        bSeg.topRight.y = tSeg.bottomLeft.y;
      }
    }
  } else {
    // Through-wall is vertical; butting wall is horizontal
    const bOtherX = bEnd === 'end' ? bSeg.start.x : bSeg.end.x;
    const bJunctionX = bEnd === 'end' ? bSeg.end.x : bSeg.start.x;
    const comesFromLeft = bOtherX < bJunctionX;

    if (comesFromLeft) {
      // Wall comes from left → trim right edge to left face of through-wall
      if (bEnd === 'end') {
        bSeg.topRight.x = tSeg.topLeft.x;
        bSeg.bottomRight.x = tSeg.topLeft.x;
      } else {
        bSeg.topLeft.x = tSeg.topLeft.x;
        bSeg.bottomLeft.x = tSeg.topLeft.x;
      }
    } else {
      // Wall comes from right → trim left edge to right face of through-wall
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
 */
export function wallToSvgPaths(segment: WallSegment): string[] {
  if (segment.openings.length === 0) {
    return [rectToPath(segment.topLeft, segment.topRight, segment.bottomRight, segment.bottomLeft)];
  }

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
        paths.push(
          `M ${currentX},${y1} L ${openStart},${y1} L ${openStart},${y2} L ${currentX},${y2} Z`
        );
      }
      currentX = openEnd;
    }

    const wallEndX = segment.topRight.x;
    if (currentX < wallEndX) {
      paths.push(
        `M ${currentX},${y1} L ${wallEndX},${y1} L ${wallEndX},${y2} L ${currentX},${y2} Z`
      );
    }
  } else {
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
 * Get the position and dimensions of an opening in SVG coordinates.
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
