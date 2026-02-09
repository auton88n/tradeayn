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

  return walls.filter(wall => {
    if (wall.type === 'exterior') return true;

    for (const kitchen of kitchenRooms) {
      for (const living of livingRooms) {
        // Check if wall sits on the shared boundary between kitchen and living
        const isHorizontal = Math.abs(wall.start_y - wall.end_y) < 0.1;
        const isVertical = Math.abs(wall.start_x - wall.end_x) < 0.1;

        if (isHorizontal) {
          const wallY = wall.start_y;
          // Shared horizontal boundary: one room's bottom = other room's top
          const kBottom = kitchen.y + kitchen.depth;
          const lTop = living.y;
          const kTop = kitchen.y;
          const lBottom = living.y + living.depth;

          if ((Math.abs(wallY - kBottom) < 0.5 && Math.abs(wallY - lTop) < 0.5) ||
              (Math.abs(wallY - lBottom) < 0.5 && Math.abs(wallY - kTop) < 0.5)) {
            const wallMinX = Math.min(wall.start_x, wall.end_x);
            const wallMaxX = Math.max(wall.start_x, wall.end_x);
            const overlapMin = Math.max(wallMinX, Math.max(kitchen.x, living.x));
            const overlapMax = Math.min(wallMaxX, Math.min(kitchen.x + kitchen.width, living.x + living.width));
            if (overlapMax > overlapMin) return false;
          }
        }

        if (isVertical) {
          const wallX = wall.start_x;
          const kRight = kitchen.x + kitchen.width;
          const lLeft = living.x;
          const kLeft = kitchen.x;
          const lRight = living.x + living.width;

          if ((Math.abs(wallX - kRight) < 0.5 && Math.abs(wallX - lLeft) < 0.5) ||
              (Math.abs(wallX - lRight) < 0.5 && Math.abs(wallX - kLeft) < 0.5)) {
            const wallMinY = Math.min(wall.start_y, wall.end_y);
            const wallMaxY = Math.max(wall.start_y, wall.end_y);
            const overlapMin = Math.max(wallMinY, Math.max(kitchen.y, living.y));
            const overlapMax = Math.min(wallMaxY, Math.min(kitchen.y + kitchen.depth, living.y + living.depth));
            if (overlapMax > overlapMin) return false;
          }
        }
      }
    }
    return true;
  });
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
    // Filter open concept walls before processing
    const filteredWalls = filterOpenConceptWalls(floor.walls, floor.rooms);
    const segments = processWalls(filteredWalls, floor.doors, floor.windows, scale);
    return resolveIntersections(segments);
  }, [floor, scale]);

  const margin = SHEET.DIMENSION_OFFSET * 2.5 + SHEET.MARGIN;
  const svgWidth = ftToSvg(layout.building.total_width_ft, scale) + margin * 2;
  const svgHeight = ftToSvg(layout.building.total_depth_ft, scale) + margin * 2;

  if (!floor) return null;

  const buildingW = ftToSvg(layout.building.total_width_ft, scale);
  const buildingH = ftToSvg(layout.building.total_depth_ft, scale);

  const dimOffset = SHEET.DIMENSION_OFFSET;

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
            const strokeWeight = isExterior
              ? LINE_WEIGHTS.CUT_LINE
              : LINE_WEIGHTS.OUTLINE;

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

        {/* ── Door Symbols ───────────────────────────────── */}
        <g id="layer-doors">
          {processedData.flatMap(segment =>
            segment.openings
              .filter(o => o.type === 'door')
              .map(opening => {
                const pos = getOpeningPosition(segment, opening);
                const door = opening.data as DoorData;
                return (
                  <DoorSymbol
                    key={door.id}
                    x={pos.x}
                    y={pos.y}
                    width={pos.width}
                    thickness={pos.thickness}
                    swing={door.swing}
                    isHorizontalWall={segment.orientation === 'horizontal'}
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
              .filter(r => r.type !== 'closet' && r.type !== 'hallway' && r.type !== 'entry' && r.type !== 'stairwell')
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
              .filter(r => r.type !== 'closet')
              .map(room => (
                <RoomLabel
                  key={room.id}
                  x={ftToSvg(room.x + room.width / 2, scale)}
                  y={ftToSvg(room.y + room.depth / 2, scale)}
                  name={room.name}
                  widthFt={room.width}
                  depthFt={room.depth}
                />
              ))}
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
                if (span < 1) return null;
                return (
                  <DimensionLine
                    key={`dim-top-d-${i}`}
                    x1={ftToSvg(xPos, scale)} y1={0}
                    x2={ftToSvg(nextX, scale)} y2={0}
                    value={span}
                    offset={dimOffset * 0.35}
                    side="top"
                  />
                );
              });
            })()}
            {/* Level 2: Room segments (middle) */}
            {(() => {
              const sortedX = getUniquePositions(floor.rooms, 'x', layout.building.total_width_ft);
              // Merge adjacent positions that are less than 3ft apart for cleaner level 2
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
                    offset={dimOffset * 0.75}
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
              offset={dimOffset * 1.2}
              side="top"
            />

            {/* ── BOTTOM ── */}
            <DimensionLine
              x1={0} y1={buildingH}
              x2={buildingW} y2={buildingH}
              value={layout.building.total_width_ft}
              offset={dimOffset * 1.2}
              side="bottom"
            />

            {/* ── LEFT ── */}
            {/* Level 1: Detail segments */}
            {(() => {
              const sortedY = getUniquePositions(floor.rooms, 'y', layout.building.total_depth_ft);
              return sortedY.slice(0, -1).map((yPos, i) => {
                const nextY = sortedY[i + 1];
                const span = nextY - yPos;
                if (span < 1) return null;
                return (
                  <DimensionLine
                    key={`dim-left-d-${i}`}
                    x1={0} y1={ftToSvg(yPos, scale)}
                    x2={0} y2={ftToSvg(nextY, scale)}
                    value={span}
                    offset={dimOffset * 0.35}
                    side="left"
                  />
                );
              });
            })()}
            {/* Level 2: Room segments */}
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
                    offset={dimOffset * 0.75}
                    side="left"
                  />
                );
              });
            })()}
            {/* Level 3: Overall depth */}
            <DimensionLine
              x1={0} y1={0}
              x2={0} y2={buildingH}
              value={layout.building.total_depth_ft}
              offset={dimOffset * 1.2}
              side="left"
            />

            {/* ── RIGHT ── */}
            <DimensionLine
              x1={buildingW} y1={0}
              x2={buildingW} y2={buildingH}
              value={layout.building.total_depth_ft}
              offset={dimOffset * 1.2}
              side="right"
            />

            {/* ── Interior Room Dimensions ── */}
            {floor.rooms
              .filter(r => !['closet', 'hallway', 'entry', 'stairwell'].includes(r.type))
              .map(room => {
                const rx = ftToSvg(room.x, scale);
                const ry = ftToSvg(room.y, scale);
                const rw = ftToSvg(room.width, scale);
                const rd = ftToSvg(room.depth, scale);
                const inset = 2;
                return (
                  <g key={`idim-${room.id}`}>
                    {/* Width dimension near top wall */}
                    <line x1={rx} y1={ry + inset} x2={rx + rw} y2={ry + inset}
                      stroke={DRAWING_COLORS.MEDIUM_GRAY} strokeWidth={LINE_WEIGHTS.THIN} />
                    <text x={rx + rw / 2} y={ry + inset - 1} textAnchor="middle"
                      fill={DRAWING_COLORS.MEDIUM_GRAY} fontFamily={FONTS.NOTE.family}
                      fontSize={FONTS.NOTE.size} fontWeight={FONTS.NOTE.weight}>
                      {formatDimension(room.width)}
                    </text>
                    {/* Depth dimension near left wall */}
                    <line x1={rx + inset} y1={ry} x2={rx + inset} y2={ry + rd}
                      stroke={DRAWING_COLORS.MEDIUM_GRAY} strokeWidth={LINE_WEIGHTS.THIN} />
                    <text x={rx + inset - 1} y={ry + rd / 2} textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(-90, ${rx + inset - 1}, ${ry + rd / 2})`}
                      fill={DRAWING_COLORS.MEDIUM_GRAY} fontFamily={FONTS.NOTE.family}
                      fontSize={FONTS.NOTE.size} fontWeight={FONTS.NOTE.weight}>
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
