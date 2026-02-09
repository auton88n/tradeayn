/**
 * Grid reference bubbles (A, B, C... along top; 1, 2, 3... along left)
 * with faint dashed grid lines through the building.
 */
import React from 'react';
import {
  LINE_WEIGHTS,
  DRAWING_COLORS,
  FONTS,
  SHEET,
  ftToSvg,
  type DrawingScale,
} from './drawingConstants';
import type { FloorPlanLayout } from './FloorPlanRenderer';

interface GridBubblesProps {
  rooms: FloorPlanLayout['floors'][0]['rooms'];
  totalWidthFt: number;
  totalDepthFt: number;
  buildingW: number;
  buildingH: number;
  scale: DrawingScale;
}

function getGridPositions(rooms: GridBubblesProps['rooms'], axis: 'x' | 'y', totalSize: number): number[] {
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

export const GridBubbles: React.FC<GridBubblesProps> = ({
  rooms, totalWidthFt, totalDepthFt, buildingW, buildingH, scale,
}) => {
  const r = 4;
  const offset = SHEET.DIMENSION_OFFSET * 1.5;
  const xPositions = getGridPositions(rooms, 'x', totalWidthFt);
  const yPositions = getGridPositions(rooms, 'y', totalDepthFt);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <g id="layer-grid">
      {/* Faint vertical grid lines */}
      {xPositions.map((xFt, i) => {
        const sx = ftToSvg(xFt, scale);
        return (
          <line key={`gv-${i}`} x1={sx} y1={0} x2={sx} y2={buildingH}
            stroke={DRAWING_COLORS.LIGHT_GRAY} strokeWidth={LINE_WEIGHTS.THIN}
            strokeDasharray="4,4" opacity={0.15} />
        );
      })}
      {/* Faint horizontal grid lines */}
      {yPositions.map((yFt, i) => {
        const sy = ftToSvg(yFt, scale);
        return (
          <line key={`gh-${i}`} x1={0} y1={sy} x2={buildingW} y2={sy}
            stroke={DRAWING_COLORS.LIGHT_GRAY} strokeWidth={LINE_WEIGHTS.THIN}
            strokeDasharray="4,4" opacity={0.15} />
        );
      })}
      {/* Top bubbles (letters) */}
      {xPositions.map((xFt, i) => {
        const sx = ftToSvg(xFt, scale);
        return (
          <g key={`bt-${i}`}>
            <circle cx={sx} cy={-offset} r={r} fill="none"
              stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.MEDIUM} />
            <text x={sx} y={-offset} textAnchor="middle" dominantBaseline="central"
              fill={DRAWING_COLORS.BLACK} fontFamily={FONTS.DIMENSION.family}
              fontSize={FONTS.DIMENSION.size} fontWeight="700">
              {letters[i] || i.toString()}
            </text>
          </g>
        );
      })}
      {/* Left bubbles (numbers) */}
      {yPositions.map((yFt, i) => {
        const sy = ftToSvg(yFt, scale);
        return (
          <g key={`bl-${i}`}>
            <circle cx={-offset} cy={sy} r={r} fill="none"
              stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.MEDIUM} />
            <text x={-offset} y={sy} textAnchor="middle" dominantBaseline="central"
              fill={DRAWING_COLORS.BLACK} fontFamily={FONTS.DIMENSION.family}
              fontSize={FONTS.DIMENSION.size} fontWeight="700">
              {(i + 1).toString()}
            </text>
          </g>
        );
      })}
    </g>
  );
};
