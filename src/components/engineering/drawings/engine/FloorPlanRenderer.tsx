/**
 * FloorPlanRenderer — Core SVG floor plan rendering from structured JSON layout.
 * 
 * Renders walls (with clean intersections), doors, windows, stairs,
 * room labels, fixtures, and dimension chains on all four sides.
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
import {
  LINE_WEIGHTS,
  DRAWING_COLORS,
  SHEET,
  ftToSvg,
  DEFAULT_SCALE,
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
    const segments = processWalls(floor.walls, floor.doors, floor.windows, scale);
    return resolveIntersections(segments);
  }, [floor, scale]);

  const margin = SHEET.DIMENSION_OFFSET * 2 + SHEET.MARGIN;
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
      <g transform={`translate(${margin}, ${margin})`}>
        {/* ── Walls (solid fill — Fix 11) ──────────────────────── */}
        <g id="layer-walls">
          {processedData.map(segment => {
            const paths = wallToSvgPaths(segment);
            const strokeWeight = segment.type === 'exterior'
              ? LINE_WEIGHTS.CUT_LINE
              : LINE_WEIGHTS.OUTLINE;
            const fillColor = segment.type === 'exterior'
              ? DRAWING_COLORS.BLACK
              : DRAWING_COLORS.DARK_GRAY;

            return paths.map((pathData, i) => (
              <path
                key={`${segment.wallId}-${i}`}
                d={pathData}
                fill={fillColor}
                stroke={DRAWING_COLORS.BLACK}
                strokeWidth={strokeWeight}
              />
            ));
          })}
        </g>

        {/* ── Door Symbols ───────────────────────────────────── */}
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

        {/* ── Window Symbols ─────────────────────────────────── */}
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

        {/* ── Stairs ─────────────────────────────────────────── */}
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

        {/* ── Room Fixtures (Fix 12) ─────────────────────────── */}
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

        {/* ── Room Labels ────────────────────────────────────── */}
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

        {/* ── Exterior Dimensions (all 4 sides — Fix 2) ──────── */}
        {showDimensions && (
          <g id="layer-dimensions">
            {/* TOP — Overall width */}
            <DimensionLine
              x1={0} y1={0}
              x2={buildingW} y2={0}
              value={layout.building.total_width_ft}
              offset={SHEET.DIMENSION_OFFSET}
              side="top"
            />
            {/* TOP — Room segments */}
            {(() => {
              const sortedX = getUniquePositions(floor.rooms, 'x', layout.building.total_width_ft);
              return sortedX.slice(0, -1).map((xPos, i) => {
                const nextX = sortedX[i + 1];
                const span = nextX - xPos;
                if (span < 2) return null;
                return (
                  <DimensionLine
                    key={`dim-top-${i}`}
                    x1={ftToSvg(xPos, scale)} y1={0}
                    x2={ftToSvg(nextX, scale)} y2={0}
                    value={span}
                    offset={SHEET.DIMENSION_OFFSET / 2}
                    side="top"
                  />
                );
              });
            })()}

            {/* BOTTOM — Overall width */}
            <DimensionLine
              x1={0} y1={buildingH}
              x2={buildingW} y2={buildingH}
              value={layout.building.total_width_ft}
              offset={SHEET.DIMENSION_OFFSET}
              side="bottom"
            />

            {/* LEFT — Overall depth */}
            <DimensionLine
              x1={0} y1={0}
              x2={0} y2={buildingH}
              value={layout.building.total_depth_ft}
              offset={SHEET.DIMENSION_OFFSET}
              side="left"
            />
            {/* LEFT — Room segments */}
            {(() => {
              const sortedY = getUniquePositions(floor.rooms, 'y', layout.building.total_depth_ft);
              return sortedY.slice(0, -1).map((yPos, i) => {
                const nextY = sortedY[i + 1];
                const span = nextY - yPos;
                if (span < 2) return null;
                return (
                  <DimensionLine
                    key={`dim-left-${i}`}
                    x1={0} y1={ftToSvg(yPos, scale)}
                    x2={0} y2={ftToSvg(nextY, scale)}
                    value={span}
                    offset={SHEET.DIMENSION_OFFSET / 2}
                    side="left"
                  />
                );
              });
            })()}

            {/* RIGHT — Overall depth */}
            <DimensionLine
              x1={buildingW} y1={0}
              x2={buildingW} y2={buildingH}
              value={layout.building.total_depth_ft}
              offset={SHEET.DIMENSION_OFFSET}
              side="right"
            />
          </g>
        )}
      </g>
    </svg>
  );
};

export default FloorPlanRenderer;
