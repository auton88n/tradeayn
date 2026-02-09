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

function getGridPositions(
  rooms: GridBubblesProps['rooms'],
  axis: 'x' | 'y',
  totalSize: number,
  maxPositions: number,
): number[] {
  const raw = new Set<number>();
  raw.add(0);
  raw.add(totalSize);
  for (const room of rooms) {
    if (axis === 'x') {
      raw.add(room.x);
      raw.add(room.x + room.width);
    } else {
      raw.add(room.y);
      raw.add(room.y + room.depth);
    }
  }
  const sorted = Array.from(raw).sort((a, b) => a - b);

  // Merge positions less than 4ft apart (keep the first of each cluster)
  const merged: number[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - merged[merged.length - 1] < 4) continue;
    merged.push(sorted[i]);
  }
  // Always ensure the last position (building edge) is included
  if (merged[merged.length - 1] !== totalSize) {
    merged.push(totalSize);
  }

  // If still over cap, drop positions with smallest gaps to neighbors
  while (merged.length > maxPositions) {
    let minGap = Infinity;
    let minIdx = 1; // never drop first or last
    for (let i = 1; i < merged.length - 1; i++) {
      const gap = Math.min(merged[i] - merged[i - 1], merged[i + 1] - merged[i]);
      if (gap < minGap) {
        minGap = gap;
        minIdx = i;
      }
    }
    merged.splice(minIdx, 1);
  }

  return merged;
}

export const GridBubbles: React.FC<GridBubblesProps> = ({
  rooms, totalWidthFt, totalDepthFt, buildingW, buildingH, scale,
}) => {
  const r = 4;
  const offset = SHEET.DIMENSION_OFFSET * 1.5;
  const xPositions = getGridPositions(rooms, 'x', totalWidthFt, 7);
  const yPositions = getGridPositions(rooms, 'y', totalDepthFt, 6);
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
