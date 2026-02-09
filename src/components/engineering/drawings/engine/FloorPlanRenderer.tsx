/**
 * FloorPlanRenderer — Core SVG floor plan rendering from structured JSON layout.
 * 
 * Renders walls (with hatching), doors, windows, stairs,
 * room labels, fixtures, dimension chains (3 levels), section cuts, and grid bubbles.
 */

import React, { useMemo } from 'react';
import {
  processWalls,
  resolveIntersections,
  wallToSvgPaths,
  getOpeningPosition,
  type WallData,
  type DoorData,
  type WindowData,
} from './wallGeometry';
import {
  DoorSymbol,
  WindowSymbol,
  StairSymbol,
  DimensionLine,
  RoomLabel,
} from './ArchitecturalSymbols';
import { RoomFixtureRenderer } from './RoomFixtures';
import { HatchPatternDefs } from './HatchPatternDefs';
import { SectionCuts } from './SectionCuts';
import { GridBubbles } from './GridBubbles';
import {
  LINE_WEIGHTS,
  DRAWING_COLORS,
  SHEET,
  FONTS,
  ftToSvg,
  DEFAULT_SCALE,
  formatDimension,
  type DrawingScale,
} from './drawingConstants';

// ── Types ───────────────────────────────────────────────────────────────────

export interface FloorPlanLayout {
  building: {
    total_width_ft: number;
    total_depth_ft: number;
    num_storeys: number;
    style: string;
  };
  floors: Array<{
    level: number;
    rooms: Array<{
      id: string;
      name: string;
      type: string;
      x: number;
      y: number;
      width: number;
      depth: number;
      ceiling_height?: number;
    }>;
    walls: WallData[];
    doors: DoorData[];
    windows: WindowData[];
    stairs?: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      run: number;
      direction: 'up' | 'down';
      num_risers: number;
      riser_height?: number;
      tread_depth?: number;
    }>;
  }>;
  roof: {
    type: string;
    pitch: number;
    overhang_ft: number;
  };
}

interface FloorPlanRendererProps {
  layout: FloorPlanLayout;
  floorLevel?: number;
  scale?: DrawingScale;
  showDimensions?: boolean;
  showLabels?: boolean;
  showFixtures?: boolean;
  className?: string;
}

// ── Helper: compute dimension chain positions ───────────────────────────────

function getUniquePositions(rooms: FloorPlanLayout['floors'][0]['rooms'], axis: 'x' | 'y', totalSize: number): number[] {
  const positions = new Set<number>();
  positions.add(0);
  positions.add(totalSize);
  for (const room of rooms) {
    if (axis === 'x') {
      positions.add(room.x);
      positions.add(room.x + room.width);
    } else {
      positions.add(room.y);
      positions.add(room.y + room.depth);
    }
  }
  return Array.from(positions).sort((a, b) => a - b);
}

// ── Open concept wall filter ────────────────────────────────────────────────

function filterOpenConceptWalls(
  walls: WallData[],
  rooms: FloorPlanLayout['floors'][0]['rooms'],
): WallData[] {
  const kitchenRooms = rooms.filter(r =>
    r.type === 'kitchen' || r.name.toLowerCase().includes('kitchen'));
  const livingRooms = rooms.filter(r =>
    r.type === 'living' || r.type === 'dining' || r.type === 'family' ||
    r.name.toLowerCase().includes('living') || r.name.toLowerCase().includes('dining'));

  if (kitchenRooms.length === 0 || livingRooms.length === 0) return walls;

  const TOL = 1.5; // aggressive tolerance for boundary matching

  // Build removal zones: bounding box between each kitchen-living pair
  const removalZones: Array<{
    minX: number; maxX: number; minY: number; maxY: number;
  }> = [];

  for (const kitchen of kitchenRooms) {
    for (const living of livingRooms) {
      const kRight = kitchen.x + kitchen.width;
      const kBottom = kitchen.y + kitchen.depth;
      const lRight = living.x + living.width;
      const lBottom = living.y + living.depth;

      // Check if rooms are within 2ft on at least one axis (adjacent or overlapping)
      const xOverlap = Math.min(kRight, lRight) - Math.max(kitchen.x, living.x);
      const yOverlap = Math.min(kBottom, lBottom) - Math.max(kitchen.y, living.y);
      const xGap = Math.max(kitchen.x, living.x) - Math.min(kRight, lRight);
      const yGap = Math.max(kitchen.y, living.y) - Math.min(kBottom, lBottom);

      const horizontallyAdjacent = xOverlap > -2 && yGap <= 2;
      const verticallyAdjacent = yOverlap > -2 && xGap <= 2;

      if (horizontallyAdjacent || verticallyAdjacent) {
        removalZones.push({
          minX: Math.min(kitchen.x, living.x) - TOL,
          maxX: Math.max(kRight, lRight) + TOL,
          minY: Math.min(kitchen.y, living.y) - TOL,
          maxY: Math.max(kBottom, lBottom) + TOL,
        });
      }
    }
  }

  if (removalZones.length === 0) return walls;

  return walls.filter(wall => {
    if (wall.type === 'exterior') return true;

    const wallMinX = Math.min(wall.start_x, wall.end_x);
    const wallMaxX = Math.max(wall.start_x, wall.end_x);
    const wallMinY = Math.min(wall.start_y, wall.end_y);
    const wallMaxY = Math.max(wall.start_y, wall.end_y);
    const isHorizontal = Math.abs(wall.start_y - wall.end_y) < 0.1;
    const isVertical = Math.abs(wall.start_x - wall.end_x) < 0.1;

    for (const zone of removalZones) {
      // Wall must be inside the zone's span
      if (wallMinX < zone.minX || wallMaxX > zone.maxX) continue;
      if (wallMinY < zone.minY || wallMaxY > zone.maxY) continue;

      if (isHorizontal) {
        const wallY = wall.start_y;
        // Check if this wall sits between any kitchen-living pair on the Y axis
        for (const kitchen of kitchenRooms) {
          for (const living of livingRooms) {
            const kBottom = kitchen.y + kitchen.depth;
            const kTop = kitchen.y;
            const lBottom = living.y + living.depth;
            const lTop = living.y;
            // Wall is between kitchen bottom and living top (or vice versa)
            const betweenKL = wallY >= Math.min(kBottom, lTop) - TOL && wallY <= Math.max(kBottom, lTop) + TOL;
            const betweenLK = wallY >= Math.min(lBottom, kTop) - TOL && wallY <= Math.max(lBottom, kTop) + TOL;
            if (betweenKL || betweenLK) {
              // Check perpendicular overlap
              const overlapMin = Math.max(wallMinX, Math.max(kitchen.x, living.x));
              const overlapMax = Math.min(wallMaxX, Math.min(kitchen.x + kitchen.width, living.x + living.width));
              if (overlapMax > overlapMin - TOL) return false;
            }
          }
        }
      }

      if (isVertical) {
        const wallX = wall.start_x;
        for (const kitchen of kitchenRooms) {
          for (const living of livingRooms) {
            const kRight = kitchen.x + kitchen.width;
            const kLeft = kitchen.x;
            const lRight = living.x + living.width;
            const lLeft = living.x;
            const betweenKL = wallX >= Math.min(kRight, lLeft) - TOL && wallX <= Math.max(kRight, lLeft) + TOL;
            const betweenLK = wallX >= Math.min(lRight, kLeft) - TOL && wallX <= Math.max(lRight, kLeft) + TOL;
            if (betweenKL || betweenLK) {
              const overlapMin = Math.max(wallMinY, Math.max(kitchen.y, living.y));
              const overlapMax = Math.min(wallMaxY, Math.min(kitchen.y + kitchen.depth, living.y + living.depth));
              if (overlapMax > overlapMin - TOL) return false;
            }
          }
        }
      }
    }
    return true;
  });
}

// ── Room label abbreviation helpers ─────────────────────────────────────────

const ABBREVIATION_MAP: Array<[RegExp, string]> = [
  [/walk[- ]?in/i, 'W/W'],
  [/closet/i, 'CL'],
  [/en[- ]?suite/i, 'ENS'],
  [/powder/i, 'PWD'],
  [/pantry/i, 'PAN'],
  [/mudroom/i, 'MUD'],
  [/laundry/i, 'LAU'],
  [/mechanical|utility/i, 'MECH'],
  [/hallway|hall/i, 'HALL'],
  [/stairwell|stair/i, 'STAIR'],
];

function abbreviateRoomName(name: string): string {
  for (const [pattern, abbrev] of ABBREVIATION_MAP) {
    if (pattern.test(name)) return abbrev;
  }
  return name;
}

// ── Living room window injection ────────────────────────────────────────────

function injectLivingRoomWindows(
  windows: WindowData[],
  rooms: FloorPlanLayout['floors'][0]['rooms'],
  walls: WallData[],
  totalWidth: number,
  totalDepth: number,
): WindowData[] {
  const livingRooms = rooms.filter(r =>
    r.type === 'living' || r.name.toLowerCase().includes('living'));
  if (livingRooms.length === 0) return windows;

  const result = [...windows];
  let injectedIdx = 0;

  for (const room of livingRooms) {
    const edges: Array<{ axis: 'x' | 'y'; value: number; start: number; end: number; wallId: string }> = [];
    const rRight = room.x + room.width;
    const rBottom = room.y + room.depth;

    // Check which room edges are on building exterior
    if (Math.abs(room.x) < 0.5) {
      // Left exterior wall (vertical, x≈0)
      const wallId = walls.find(w => w.type === 'exterior' && Math.abs(w.start_x) < 0.5 && Math.abs(w.end_x) < 0.5)?.id || '';
      if (wallId) edges.push({ axis: 'x', value: 0, start: room.y, end: rBottom, wallId });
    }
    if (Math.abs(rRight - totalWidth) < 0.5) {
      const wallId = walls.find(w => w.type === 'exterior' && Math.abs(w.start_x - totalWidth) < 0.5 && Math.abs(w.end_x - totalWidth) < 0.5)?.id || '';
      if (wallId) edges.push({ axis: 'x', value: totalWidth, start: room.y, end: rBottom, wallId });
    }
    if (Math.abs(room.y) < 0.5) {
      const wallId = walls.find(w => w.type === 'exterior' && Math.abs(w.start_y) < 0.5 && Math.abs(w.end_y) < 0.5)?.id || '';
      if (wallId) edges.push({ axis: 'y', value: 0, start: room.x, end: rRight, wallId });
    }
    if (Math.abs(rBottom - totalDepth) < 0.5) {
      const wallId = walls.find(w => w.type === 'exterior' && Math.abs(w.start_y - totalDepth) < 0.5 && Math.abs(w.end_y - totalDepth) < 0.5)?.id || '';
      if (wallId) edges.push({ axis: 'y', value: totalDepth, start: room.y, end: rBottom, wallId });
    }

    for (const edge of edges) {
      // Check if windows already exist on this edge within the room's span
      const hasWindow = result.some(w => {
        if (w.wall_id !== edge.wallId) return false;
        return w.position_along_wall >= edge.start && w.position_along_wall <= edge.end;
      });
      if (hasWindow) continue;

      const span = edge.end - edge.start;
      const winWidthIn = 48;
      for (const frac of [1 / 3, 2 / 3]) {
        const pos = edge.start + span * frac;
        result.push({
          id: `injected-win-living-${injectedIdx++}`,
          wall_id: edge.wallId,
          position_along_wall: pos,
          width: winWidthIn,
          height: 60,
          sill_height: 24,
          type: 'picture',
        });
      }
    }
  }

  return result;
}

// ── Dimension chain offset constants (SVG units from building edge) ─────────
const DIM_LEVEL_1 = 4;   // Detail segments (closest)
const DIM_LEVEL_2 = 8;   // Room segments (middle)
const DIM_LEVEL_3 = 12;  // Overall dimension (outermost)

// ── Door swing direction inference ──────────────────────────────────────────

/** Infer which side of the wall a door should swing toward.
 *  Exterior doors swing inward (positive). Interior doors swing into the
 *  smaller / more private room. */
function inferSwingDirection(
  segment: { orientation: 'horizontal' | 'vertical'; start: { x: number; y: number }; end: { x: number; y: number } },
  opening: { startOffset: number; width: number },
  rooms: FloorPlanLayout['floors'][0]['rooms'],
  building: FloorPlanLayout['building'],
): 'positive' | 'negative' {
  // Find the door center in feet
  const scale = DEFAULT_SCALE;
  const isH = segment.orientation === 'horizontal';
  const wallCenter = isH ? segment.start.y : segment.start.x;

  // Find rooms on each side of this wall
  const roomsAboveOrLeft: typeof rooms = [];
  const roomsBelowOrRight: typeof rooms = [];

  for (const room of rooms) {
    if (isH) {
      const roomBottom = ftToSvg(room.y + room.depth, scale);
      const roomTop = ftToSvg(room.y, scale);
      if (Math.abs(roomBottom - wallCenter) < 2) roomsAboveOrLeft.push(room);
      if (Math.abs(roomTop - wallCenter) < 2) roomsBelowOrRight.push(room);
    } else {
      const roomRight = ftToSvg(room.x + room.width, scale);
      const roomLeft = ftToSvg(room.x, scale);
      if (Math.abs(roomRight - wallCenter) < 2) roomsAboveOrLeft.push(room);
      if (Math.abs(roomLeft - wallCenter) < 2) roomsBelowOrRight.push(room);
    }
  }

  // If one side has no rooms (exterior edge), swing inward (toward rooms)
  if (roomsAboveOrLeft.length === 0 && roomsBelowOrRight.length > 0) return 'positive';
  if (roomsBelowOrRight.length === 0 && roomsAboveOrLeft.length > 0) return 'negative';

  // Swing into the smaller room (more private)
  const areaAbove = roomsAboveOrLeft.reduce((s, r) => s + r.width * r.depth, 0);
  const areaBelow = roomsBelowOrRight.reduce((s, r) => s + r.width * r.depth, 0);

  return areaAbove <= areaBelow ? 'negative' : 'positive';
}

// ── Component ───────────────────────────────────────────────────────────────

export const FloorPlanRenderer: React.FC<FloorPlanRendererProps> = ({
  layout,
  floorLevel = 0,
  scale = DEFAULT_SCALE,
  showDimensions = true,
  showLabels = true,
  showFixtures = true,
  className,
}) => {
  const floor = layout.floors.find(f => f.level === floorLevel) ?? layout.floors[0];

  const processedData = useMemo(() => {
    if (!floor) return [];
    const filteredWalls = filterOpenConceptWalls(floor.walls, floor.rooms);
    const augmentedWindows = injectLivingRoomWindows(
      floor.windows, floor.rooms, filteredWalls,
      layout.building.total_width_ft, layout.building.total_depth_ft,
    );
    const segments = processWalls(filteredWalls, floor.doors, augmentedWindows, scale);
    return resolveIntersections(segments);
  }, [floor, scale, layout.building.total_width_ft, layout.building.total_depth_ft]);

  // Margin: outermost dim chain (12) + text clearance (8) + sheet margin
  const margin = DIM_LEVEL_3 + SHEET.MARGIN + 8;
  const svgWidth = ftToSvg(layout.building.total_width_ft, scale) + margin * 2;
  const svgHeight = ftToSvg(layout.building.total_depth_ft, scale) + margin * 2;

  if (!floor) return null;

  const buildingW = ftToSvg(layout.building.total_width_ft, scale);
  const buildingH = ftToSvg(layout.building.total_depth_ft, scale);

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: DRAWING_COLORS.WHITE }}
    >
      <HatchPatternDefs />
      <g transform={`translate(${margin}, ${margin})`}>
        {/* ── Grid Bubbles (behind everything) ─────────────── */}
        <GridBubbles
          rooms={floor.rooms}
          totalWidthFt={layout.building.total_width_ft}
          totalDepthFt={layout.building.total_depth_ft}
          buildingW={buildingW}
          buildingH={buildingH}
          scale={scale}
        />

        {/* ── Walls (hatched fill) ─────────────────────────── */}
        <g id="layer-walls">
          {processedData.map(segment => {
            const paths = wallToSvgPaths(segment);
            const isExterior = segment.type === 'exterior';
            const fillPattern = isExterior
              ? 'url(#hatch-exterior-cross)'
              : 'url(#hatch-interior)';
            const strokeWeight = isExterior ? 2.5 : LINE_WEIGHTS.OUTLINE;

            return paths.map((pathData, i) => (
              <path
                key={`${segment.wallId}-${i}`}
                d={pathData}
                fill={fillPattern}
                stroke={DRAWING_COLORS.BLACK}
                strokeWidth={strokeWeight}
              />
            ));
          })}
        </g>

        {/* ── Door Symbols (direction-aware swing) ─────── */}
        <g id="layer-doors">
          {processedData.flatMap(segment =>
            segment.openings
              .filter(o => o.type === 'door')
              .map(opening => {
                const pos = getOpeningPosition(segment, opening);
                const door = opening.data as DoorData;
                // Determine swing direction: exterior doors swing inward (positive=into building),
                // interior doors swing into the smaller/private room
                const swingDir = inferSwingDirection(segment, opening, floor.rooms, layout.building);
                return (
                  <DoorSymbol
                    key={door.id}
                    x={pos.x}
                    y={pos.y}
                    width={pos.width}
                    thickness={pos.thickness}
                    swing={door.swing}
                    isHorizontalWall={segment.orientation === 'horizontal'}
                    swingDirection={swingDir}
                  />
                );
              })
          )}
        </g>

        {/* ── Window Symbols ─────────────────────────────── */}
        <g id="layer-windows">
          {processedData.flatMap(segment =>
            segment.openings
              .filter(o => o.type === 'window')
              .map(opening => {
                const pos = getOpeningPosition(segment, opening);
                const win = opening.data as WindowData;
                return (
                  <WindowSymbol
                    key={win.id}
                    x={pos.x}
                    y={pos.y}
                    width={pos.width}
                    thickness={pos.thickness}
                    isHorizontalWall={segment.orientation === 'horizontal'}
                  />
                );
              })
          )}
        </g>

        {/* ── Stairs ─────────────────────────────────────── */}
        {floor.stairs && floor.stairs.length > 0 && (
          <g id="layer-stairs">
            {floor.stairs.map(stair => (
              <StairSymbol
                key={stair.id}
                x={ftToSvg(stair.x, scale)}
                y={ftToSvg(stair.y, scale)}
                width={ftToSvg(stair.width, scale)}
                run={ftToSvg(stair.run, scale)}
                numRisers={stair.num_risers}
                direction={stair.direction}
              />
            ))}
          </g>
        )}

        {/* ── Room Fixtures ──────────────────────────────── */}
        {showFixtures && (
          <g id="layer-fixtures">
            {floor.rooms
              .filter(r => r.type !== 'hallway' && r.type !== 'entry' && r.type !== 'stairwell')
              .map(room => (
                <RoomFixtureRenderer
                  key={`fix-${room.id}`}
                  roomType={room.type}
                  roomName={room.name}
                  x={ftToSvg(room.x, scale)}
                  y={ftToSvg(room.y, scale)}
                  width={ftToSvg(room.width, scale)}
                  depth={ftToSvg(room.depth, scale)}
                />
              ))}
          </g>
        )}

        {/* ── Room Labels ────────────────────────────────── */}
        {showLabels && (
          <g id="layer-labels">
            {floor.rooms
              .map(room => {
                const area = room.width * room.depth;
                const isCompact = area < 40;
                const showArea = area >= 80;
                const displayName = area < 80
                  ? abbreviateRoomName(room.name)
                  : room.name;
                return (
                  <RoomLabel
                    key={room.id}
                    x={ftToSvg(room.x + room.width / 2, scale)}
                    y={ftToSvg(room.y + room.depth * 0.6, scale)}
                    name={displayName}
                    widthFt={room.width}
                    depthFt={room.depth}
                    compact={isCompact}
                    showDimensions={!isCompact}
                    showArea={showArea}
                  />
                );
              })}
          </g>
        )}

        {/* ── Exterior Dimensions (3 levels on all 4 sides) ── */}
        {showDimensions && (
          <g id="layer-dimensions">
            {/* ── TOP ── */}
            {/* Level 1: Detail segments (closest) */}
            {(() => {
              const sortedX = getUniquePositions(floor.rooms, 'x', layout.building.total_width_ft);
              return sortedX.slice(0, -1).map((xPos, i) => {
                const nextX = sortedX[i + 1];
                const span = nextX - xPos;
                if (span < 2) return null; // Skip segments < 2ft
                return (
                  <DimensionLine
                    key={`dim-top-d-${i}`}
                    x1={ftToSvg(xPos, scale)} y1={0}
                    x2={ftToSvg(nextX, scale)} y2={0}
                    value={span}
                    offset={DIM_LEVEL_1}
                    side="top"
                  />
                );
              });
            })()}
            {/* Level 2: Room segments (middle) */}
            {(() => {
              const sortedX = getUniquePositions(floor.rooms, 'x', layout.building.total_width_ft);
              const merged: number[] = [sortedX[0]];
              for (let i = 1; i < sortedX.length; i++) {
                if (sortedX[i] - merged[merged.length - 1] >= 3) {
                  merged.push(sortedX[i]);
                }
              }
              if (merged[merged.length - 1] !== sortedX[sortedX.length - 1]) {
                merged.push(sortedX[sortedX.length - 1]);
              }
              return merged.slice(0, -1).map((xPos, i) => {
                const nextX = merged[i + 1];
                const span = nextX - xPos;
                if (span < 3) return null;
                return (
                  <DimensionLine
                    key={`dim-top-r-${i}`}
                    x1={ftToSvg(xPos, scale)} y1={0}
                    x2={ftToSvg(nextX, scale)} y2={0}
                    value={span}
                    offset={DIM_LEVEL_2}
                    side="top"
                  />
                );
              });
            })()}
            {/* Level 3: Overall width (outermost) */}
            <DimensionLine
              x1={0} y1={0}
              x2={buildingW} y2={0}
              value={layout.building.total_width_ft}
              offset={DIM_LEVEL_3}
              side="top"
            />

            {/* ── BOTTOM ── */}
            {(() => {
              const sortedX = getUniquePositions(floor.rooms, 'x', layout.building.total_width_ft);
              return sortedX.slice(0, -1).map((xPos, i) => {
                const nextX = sortedX[i + 1];
                const span = nextX - xPos;
                if (span < 2) return null;
                return (
                  <DimensionLine
                    key={`dim-bot-d-${i}`}
                    x1={ftToSvg(xPos, scale)} y1={buildingH}
                    x2={ftToSvg(nextX, scale)} y2={buildingH}
                    value={span}
                    offset={DIM_LEVEL_1}
                    side="bottom"
                  />
                );
              });
            })()}
            {(() => {
              const sortedX = getUniquePositions(floor.rooms, 'x', layout.building.total_width_ft);
              const merged: number[] = [sortedX[0]];
              for (let i = 1; i < sortedX.length; i++) {
                if (sortedX[i] - merged[merged.length - 1] >= 3) {
                  merged.push(sortedX[i]);
                }
              }
              if (merged[merged.length - 1] !== sortedX[sortedX.length - 1]) {
                merged.push(sortedX[sortedX.length - 1]);
              }
              return merged.slice(0, -1).map((xPos, i) => {
                const nextX = merged[i + 1];
                const span = nextX - xPos;
                if (span < 3) return null;
                return (
                  <DimensionLine
                    key={`dim-bot-r-${i}`}
                    x1={ftToSvg(xPos, scale)} y1={buildingH}
                    x2={ftToSvg(nextX, scale)} y2={buildingH}
                    value={span}
                    offset={DIM_LEVEL_2}
                    side="bottom"
                  />
                );
              });
            })()}
            <DimensionLine
              x1={0} y1={buildingH}
              x2={buildingW} y2={buildingH}
              value={layout.building.total_width_ft}
              offset={DIM_LEVEL_3}
              side="bottom"
            />

            {/* ── LEFT ── */}
            {(() => {
              const sortedY = getUniquePositions(floor.rooms, 'y', layout.building.total_depth_ft);
              return sortedY.slice(0, -1).map((yPos, i) => {
                const nextY = sortedY[i + 1];
                const span = nextY - yPos;
                if (span < 2) return null;
                return (
                  <DimensionLine
                    key={`dim-left-d-${i}`}
                    x1={0} y1={ftToSvg(yPos, scale)}
                    x2={0} y2={ftToSvg(nextY, scale)}
                    value={span}
                    offset={DIM_LEVEL_1}
                    side="left"
                  />
                );
              });
            })()}
            {(() => {
              const sortedY = getUniquePositions(floor.rooms, 'y', layout.building.total_depth_ft);
              const merged: number[] = [sortedY[0]];
              for (let i = 1; i < sortedY.length; i++) {
                if (sortedY[i] - merged[merged.length - 1] >= 3) {
                  merged.push(sortedY[i]);
                }
              }
              if (merged[merged.length - 1] !== sortedY[sortedY.length - 1]) {
                merged.push(sortedY[sortedY.length - 1]);
              }
              return merged.slice(0, -1).map((yPos, i) => {
                const nextY = merged[i + 1];
                const span = nextY - yPos;
                if (span < 3) return null;
                return (
                  <DimensionLine
                    key={`dim-left-r-${i}`}
                    x1={0} y1={ftToSvg(yPos, scale)}
                    x2={0} y2={ftToSvg(nextY, scale)}
                    value={span}
                    offset={DIM_LEVEL_2}
                    side="left"
                  />
                );
              });
            })()}
            <DimensionLine
              x1={0} y1={0}
              x2={0} y2={buildingH}
              value={layout.building.total_depth_ft}
              offset={DIM_LEVEL_3}
              side="left"
            />

            {/* ── RIGHT ── */}
            {(() => {
              const sortedY = getUniquePositions(floor.rooms, 'y', layout.building.total_depth_ft);
              return sortedY.slice(0, -1).map((yPos, i) => {
                const nextY = sortedY[i + 1];
                const span = nextY - yPos;
                if (span < 2) return null;
                return (
                  <DimensionLine
                    key={`dim-right-d-${i}`}
                    x1={buildingW} y1={ftToSvg(yPos, scale)}
                    x2={buildingW} y2={ftToSvg(nextY, scale)}
                    value={span}
                    offset={DIM_LEVEL_1}
                    side="right"
                  />
                );
              });
            })()}
            {(() => {
              const sortedY = getUniquePositions(floor.rooms, 'y', layout.building.total_depth_ft);
              const merged: number[] = [sortedY[0]];
              for (let i = 1; i < sortedY.length; i++) {
                if (sortedY[i] - merged[merged.length - 1] >= 3) {
                  merged.push(sortedY[i]);
                }
              }
              if (merged[merged.length - 1] !== sortedY[sortedY.length - 1]) {
                merged.push(sortedY[sortedY.length - 1]);
              }
              return merged.slice(0, -1).map((yPos, i) => {
                const nextY = merged[i + 1];
                const span = nextY - yPos;
                if (span < 3) return null;
                return (
                  <DimensionLine
                    key={`dim-right-r-${i}`}
                    x1={buildingW} y1={ftToSvg(yPos, scale)}
                    x2={buildingW} y2={ftToSvg(nextY, scale)}
                    value={span}
                    offset={DIM_LEVEL_2}
                    side="right"
                  />
                );
              });
            })()}
            <DimensionLine
              x1={buildingW} y1={0}
              x2={buildingW} y2={buildingH}
              value={layout.building.total_depth_ft}
              offset={DIM_LEVEL_3}
              side="right"
            />

            {/* ── Wall Thickness Annotations ── */}
            {(() => {
              const extWall = floor.walls.find(w => w.type === 'exterior');
              const intWall = floor.walls.find(w => w.type === 'interior' || w.type === 'partition');
              const annotations: React.ReactNode[] = [];
              if (extWall) {
                const mx = ftToSvg((extWall.start_x + extWall.end_x) / 2, scale);
                const my = ftToSvg((extWall.start_y + extWall.end_y) / 2, scale);
                annotations.push(
                  <g key="wt-ext">
                    <line x1={mx} y1={my} x2={mx + 8} y2={my - 6}
                      stroke={DRAWING_COLORS.MEDIUM_GRAY} strokeWidth={LINE_WEIGHTS.THIN} />
                    <text x={mx + 9} y={my - 7} fontFamily={FONTS.NOTE.family}
                      fontSize={2.5} fill={DRAWING_COLORS.MEDIUM_GRAY}>5½"</text>
                  </g>
                );
              }
              if (intWall) {
                const mx = ftToSvg((intWall.start_x + intWall.end_x) / 2, scale);
                const my = ftToSvg((intWall.start_y + intWall.end_y) / 2, scale);
                annotations.push(
                  <g key="wt-int">
                    <line x1={mx} y1={my} x2={mx + 8} y2={my + 6}
                      stroke={DRAWING_COLORS.MEDIUM_GRAY} strokeWidth={LINE_WEIGHTS.THIN} />
                    <text x={mx + 9} y={my + 7} fontFamily={FONTS.NOTE.family}
                      fontSize={2.5} fill={DRAWING_COLORS.MEDIUM_GRAY}>3½"</text>
                  </g>
                );
              }
              return annotations;
            })()}

            {/* ── Interior Room Dimensions (skip small rooms < 60 SF) ── */}
            {floor.rooms
              .filter(room => room.width * room.depth >= 60)
              .map(room => {
                const rx = ftToSvg(room.x, scale);
                const ry = ftToSvg(room.y, scale);
                const rw = ftToSvg(room.width, scale);
                const rd = ftToSvg(room.depth, scale);
                const inset = 1.5;
                const tickLen = 1;
                const dimFontSize = FONTS.NOTE.size * 1.2;
                return (
                  <g key={`idim-${room.id}`}>
                    {/* Width dimension near top wall */}
                    <line x1={rx} y1={ry + inset} x2={rx + rw} y2={ry + inset}
                      stroke={DRAWING_COLORS.MEDIUM_GRAY} strokeWidth={LINE_WEIGHTS.THIN} />
                    <line x1={rx} y1={ry + inset - tickLen / 2} x2={rx} y2={ry + inset + tickLen / 2}
                      stroke={DRAWING_COLORS.MEDIUM_GRAY} strokeWidth={LINE_WEIGHTS.THIN} />
                    <line x1={rx + rw} y1={ry + inset - tickLen / 2} x2={rx + rw} y2={ry + inset + tickLen / 2}
                      stroke={DRAWING_COLORS.MEDIUM_GRAY} strokeWidth={LINE_WEIGHTS.THIN} />
                    <text x={rx + rw / 2} y={ry + inset - 1} textAnchor="middle"
                      fill={DRAWING_COLORS.MEDIUM_GRAY} fontFamily={FONTS.NOTE.family}
                      fontSize={dimFontSize} fontWeight={FONTS.NOTE.weight}>
                      {formatDimension(room.width)}
                    </text>
                    {/* Depth dimension near left wall */}
                    <line x1={rx + inset} y1={ry} x2={rx + inset} y2={ry + rd}
                      stroke={DRAWING_COLORS.MEDIUM_GRAY} strokeWidth={LINE_WEIGHTS.THIN} />
                    <line x1={rx + inset - tickLen / 2} y1={ry} x2={rx + inset + tickLen / 2} y2={ry}
                      stroke={DRAWING_COLORS.MEDIUM_GRAY} strokeWidth={LINE_WEIGHTS.THIN} />
                    <line x1={rx + inset - tickLen / 2} y1={ry + rd} x2={rx + inset + tickLen / 2} y2={ry + rd}
                      stroke={DRAWING_COLORS.MEDIUM_GRAY} strokeWidth={LINE_WEIGHTS.THIN} />
                    <text x={rx + inset - 1} y={ry + rd / 2} textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(-90, ${rx + inset - 1}, ${ry + rd / 2})`}
                      fill={DRAWING_COLORS.MEDIUM_GRAY} fontFamily={FONTS.NOTE.family}
                      fontSize={dimFontSize} fontWeight={FONTS.NOTE.weight}>
                      {formatDimension(room.depth)}
                    </text>
                  </g>
                );
              })}
          </g>
        )}

        {/* ── Section Cut Lines ───────────────────────────── */}
        <SectionCuts buildingW={buildingW} buildingH={buildingH} />
      </g>
    </svg>
  );
};

export default FloorPlanRenderer;
