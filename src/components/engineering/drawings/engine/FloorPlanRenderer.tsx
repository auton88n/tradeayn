/**
 * FloorPlanRenderer — Core SVG floor plan rendering from structured JSON layout.
 * 
 * Renders walls (with clean intersections), doors, windows, stairs,
 * room labels, and dimension chains.
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
import {
  LINE_WEIGHTS,
  DRAWING_COLORS,
  HATCH_PATTERNS,
  SHEET,
  ftToSvg,
  inToSvg,
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
  showHatching?: boolean;
  className?: string;
}

// ── Component ───────────────────────────────────────────────────────────────

export const FloorPlanRenderer: React.FC<FloorPlanRendererProps> = ({
  layout,
  floorLevel = 0,
  scale = DEFAULT_SCALE,
  showDimensions = true,
  showLabels = true,
  showHatching = true,
  className,
}) => {
  const floor = layout.floors.find(f => f.level === floorLevel) ?? layout.floors[0];

  // Process walls with intersection cleanup — must be before any early return
  const processedData = useMemo(() => {
    if (!floor) return [];
    const segments = processWalls(floor.walls, floor.doors, floor.windows, scale);
    const resolved = resolveIntersections(segments);
    return resolved;
  }, [floor, scale]);

  // Calculate SVG viewbox
  const margin = SHEET.DIMENSION_OFFSET * 2 + SHEET.MARGIN;
  const svgWidth = ftToSvg(layout.building.total_width_ft, scale) + margin * 2;
  const svgHeight = ftToSvg(layout.building.total_depth_ft, scale) + margin * 2;

  if (!floor) return null;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: DRAWING_COLORS.WHITE }}
    >
      {/* Hatch pattern definitions */}
      <defs>
        {Object.values(HATCH_PATTERNS).map(pattern => (
          <pattern
            key={pattern.id}
            id={pattern.id}
            patternUnits="userSpaceOnUse"
            width={pattern.width}
            height={pattern.height}
          >
            <g dangerouslySetInnerHTML={{ __html: pattern.content }} />
          </pattern>
        ))}
      </defs>

      {/* Offset everything by margin */}
      <g transform={`translate(${margin}, ${margin})`}>
        {/* ── Walls ──────────────────────────────────────────── */}
        <g id="layer-walls">
          {processedData.map(segment => {
            const paths = wallToSvgPaths(segment);
            const strokeWeight = segment.type === 'exterior'
              ? LINE_WEIGHTS.CUT_LINE
              : LINE_WEIGHTS.OUTLINE;

            return paths.map((pathData, i) => (
              <g key={`${segment.wallId}-${i}`}>
                {/* Fill */}
                <path
                  d={pathData}
                  fill={showHatching && segment.type === 'exterior'
                    ? `url(#${HATCH_PATTERNS.CONCRETE.id})`
                    : DRAWING_COLORS.BLACK
                  }
                  stroke={DRAWING_COLORS.BLACK}
                  strokeWidth={strokeWeight}
                />
              </g>
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

        {/* ── Room Labels ────────────────────────────────────── */}
        {showLabels && (
          <g id="layer-labels">
            {floor.rooms
              .filter(r => r.type !== 'closet' && r.type !== 'hallway')
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

        {/* ── Exterior Dimensions ────────────────────────────── */}
        {showDimensions && (
          <g id="layer-dimensions">
            {/* Overall width - top */}
            <DimensionLine
              x1={0}
              y1={0}
              x2={ftToSvg(layout.building.total_width_ft, scale)}
              y2={0}
              value={layout.building.total_width_ft}
              offset={SHEET.DIMENSION_OFFSET}
              side="top"
            />
            {/* Overall depth - left */}
            <DimensionLine
              x1={0}
              y1={0}
              x2={0}
              y2={ftToSvg(layout.building.total_depth_ft, scale)}
              value={layout.building.total_depth_ft}
              offset={SHEET.DIMENSION_OFFSET}
              side="left"
            />

            {/* Room dimensions - inner chain (simplified: show each room's width along top) */}
            {(() => {
              // Find unique X positions for vertical walls to create dimension chain
              const xPositions = new Set<number>();
              xPositions.add(0);
              xPositions.add(layout.building.total_width_ft);
              for (const room of floor.rooms) {
                xPositions.add(room.x);
                xPositions.add(room.x + room.width);
              }
              const sortedX = Array.from(xPositions).sort((a, b) => a - b);

              return sortedX.slice(0, -1).map((x, i) => {
                const nextX = sortedX[i + 1];
                const span = nextX - x;
                if (span < 2) return null; // Skip tiny segments
                return (
                  <DimensionLine
                    key={`dim-x-${i}`}
                    x1={ftToSvg(x, scale)}
                    y1={0}
                    x2={ftToSvg(nextX, scale)}
                    y2={0}
                    value={span}
                    offset={SHEET.DIMENSION_OFFSET / 2}
                    side="top"
                  />
                );
              });
            })()}
          </g>
        )}
      </g>
    </svg>
  );
};

export default FloorPlanRenderer;
