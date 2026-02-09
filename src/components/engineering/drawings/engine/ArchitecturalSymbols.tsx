/**
 * Architectural SVG symbols for floor plan drawings.
 * Door swings, window representations, stairs, dimension lines, room labels.
 */

import React from 'react';
import {
  LINE_WEIGHTS,
  DRAWING_COLORS,
  FONTS,
  SHEET,
  formatDimension,
} from './drawingConstants';

// ── Door Symbol ─────────────────────────────────────────────────────────────

interface DoorSymbolProps {
  x: number;
  y: number;
  width: number;       // Opening width in SVG units
  thickness: number;   // Wall thickness in SVG units
  swing: 'left' | 'right' | 'double' | 'sliding';
  isHorizontalWall: boolean;
}

export const DoorSymbol: React.FC<DoorSymbolProps> = ({
  x, y, width, thickness, swing, isHorizontalWall,
}) => {
  const radius = width;

  if (swing === 'sliding') {
    // Sliding door: two parallel lines offset inside the wall
    if (isHorizontalWall) {
      const midY = y + thickness / 2;
      return (
        <g>
          <line x1={x} y1={midY - 1} x2={x + width} y2={midY - 1}
            stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE} />
          <line x1={x} y1={midY + 1} x2={x + width} y2={midY + 1}
            stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE} />
        </g>
      );
    } else {
      const midX = x + thickness / 2;
      return (
        <g>
          <line x1={midX - 1} y1={y} x2={midX - 1} y2={y + width}
            stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE} />
          <line x1={midX + 1} y1={y} x2={midX + 1} y2={y + width}
            stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE} />
        </g>
      );
    }
  }

  // Swing door: line (door panel) + arc (sweep)
  if (isHorizontalWall) {
    const hingeX = swing === 'left' ? x : x + width;
    const tipX = swing === 'left' ? x + width : x;
    const arcY = y + thickness; // swing downward

    return (
      <g>
        {/* Door panel line */}
        <line x1={hingeX} y1={y + thickness} x2={tipX} y2={y + thickness}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE} />
        {/* Swing arc */}
        <path
          d={swing === 'left'
            ? `M ${tipX},${y + thickness} A ${radius},${radius} 0 0,0 ${hingeX},${y + thickness + radius}`
            : `M ${tipX},${y + thickness} A ${radius},${radius} 0 0,1 ${hingeX},${y + thickness + radius}`
          }
          fill="none"
          stroke={DRAWING_COLORS.MEDIUM_GRAY}
          strokeWidth={LINE_WEIGHTS.DIMENSION}
          strokeDasharray="2,1"
        />
      </g>
    );
  } else {
    // Vertical wall
    const hingeY = swing === 'left' ? y : y + width;
    const tipY = swing === 'left' ? y + width : y;

    return (
      <g>
        <line x1={x + thickness} y1={hingeY} x2={x + thickness} y2={tipY}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE} />
        <path
          d={swing === 'left'
            ? `M ${x + thickness},${tipY} A ${radius},${radius} 0 0,1 ${x + thickness + radius},${hingeY}`
            : `M ${x + thickness},${tipY} A ${radius},${radius} 0 0,0 ${x + thickness + radius},${hingeY}`
          }
          fill="none"
          stroke={DRAWING_COLORS.MEDIUM_GRAY}
          strokeWidth={LINE_WEIGHTS.DIMENSION}
          strokeDasharray="2,1"
        />
      </g>
    );
  }
};

// ── Window Symbol ───────────────────────────────────────────────────────────

interface WindowSymbolProps {
  x: number;
  y: number;
  width: number;
  thickness: number;
  isHorizontalWall: boolean;
}

export const WindowSymbol: React.FC<WindowSymbolProps> = ({
  x, y, width, thickness, isHorizontalWall,
}) => {
  // Standard architectural window: two parallel lines inside wall break
  const lineOffset = thickness * 0.25;

  if (isHorizontalWall) {
    return (
      <g>
        <line x1={x} y1={y + lineOffset} x2={x + width} y2={y + lineOffset}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE} />
        <line x1={x} y1={y + thickness - lineOffset} x2={x + width} y2={y + thickness - lineOffset}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE} />
        {/* Center glass line */}
        <line x1={x} y1={y + thickness / 2} x2={x + width} y2={y + thickness / 2}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.MEDIUM} />
      </g>
    );
  } else {
    return (
      <g>
        <line x1={x + lineOffset} y1={y} x2={x + lineOffset} y2={y + width}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE} />
        <line x1={x + thickness - lineOffset} y1={y} x2={x + thickness - lineOffset} y2={y + width}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE} />
        <line x1={x + thickness / 2} y1={y} x2={x + thickness / 2} y2={y + width}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.MEDIUM} />
      </g>
    );
  }
};

// ── Stair Symbol ────────────────────────────────────────────────────────────

interface StairSymbolProps {
  x: number;
  y: number;
  width: number;     // SVG units
  run: number;       // Total run in SVG units
  numRisers: number;
  direction: 'up' | 'down';
  isVertical?: boolean;
}

export const StairSymbol: React.FC<StairSymbolProps> = ({
  x, y, width, run, numRisers, direction, isVertical = true,
}) => {
  const treadDepth = run / numRisers;
  const breakPoint = Math.floor(numRisers / 2);
  const lines: React.ReactElement[] = [];

  for (let i = 0; i <= breakPoint; i++) {
    if (isVertical) {
      const ty = y + i * treadDepth;
      lines.push(
        <line key={i} x1={x} y1={ty} x2={x + width} y2={ty}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.MEDIUM} />
      );
    } else {
      const tx = x + i * treadDepth;
      lines.push(
        <line key={i} x1={tx} y1={y} x2={tx} y2={y + width}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.MEDIUM} />
      );
    }
  }

  // Break line (zigzag)
  const breakPos = breakPoint * treadDepth;
  let breakLine: React.ReactElement;
  if (isVertical) {
    const by = y + breakPos;
    breakLine = (
      <polyline
        points={`${x},${by} ${x + width * 0.3},${by - 1.5} ${x + width * 0.5},${by + 1.5} ${x + width * 0.7},${by - 1.5} ${x + width},${by}`}
        fill="none" stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE}
      />
    );
  } else {
    const bx = x + breakPos;
    breakLine = (
      <polyline
        points={`${bx},${y} ${bx - 1.5},${y + width * 0.3} ${bx + 1.5},${y + width * 0.5} ${bx - 1.5},${y + width * 0.7} ${bx},${y + width}`}
        fill="none" stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.OUTLINE}
      />
    );
  }

  // Direction arrow
  const arrowY = isVertical ? y + 2 : y + width / 2;
  const arrowX = isVertical ? x + width / 2 : x + 2;

  return (
    <g>
      {lines}
      {breakLine}
      {/* UP/DN label */}
      <text
        x={x + width / 2} y={y + (isVertical ? run - 3 : width / 2)}
        textAnchor="middle" dominantBaseline="middle"
        fill={DRAWING_COLORS.BLACK}
        fontFamily={FONTS.NOTE.family}
        fontSize={FONTS.NOTE.size}
        fontWeight={FONTS.NOTE.weight}
      >
        {direction === 'up' ? 'UP' : 'DN'}
      </text>
      {/* Arrow */}
      {isVertical ? (
        <polygon
          points={`${x + width / 2},${y} ${x + width / 2 - 1.5},${y + 3} ${x + width / 2 + 1.5},${y + 3}`}
          fill={DRAWING_COLORS.BLACK}
        />
      ) : (
        <polygon
          points={`${x},${y + width / 2} ${x + 3},${y + width / 2 - 1.5} ${x + 3},${y + width / 2 + 1.5}`}
          fill={DRAWING_COLORS.BLACK}
        />
      )}
    </g>
  );
};

// ── Dimension Line ──────────────────────────────────────────────────────────

interface DimensionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: number;        // in feet
  offset?: number;      // perpendicular offset from the measured element
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const DimensionLine: React.FC<DimensionLineProps> = ({
  x1, y1, x2, y2, value, offset = 0, side = 'top',
}) => {
  const isHorizontal = Math.abs(y1 - y2) < 0.1;
  const label = formatDimension(value);
  const tickSize = SHEET.TICK_SIZE;
  const extensionOvershoot = SHEET.EXTENSION_OVERSHOOT;

  if (isHorizontal) {
    const dimY = side === 'top' ? y1 - offset : y1 + offset;
    const midX = (x1 + x2) / 2;
    const extStart = side === 'top' ? y1 - extensionOvershoot : y1 + extensionOvershoot;

    return (
      <g>
        {/* Extension lines */}
        <line x1={x1} y1={extStart} x2={x1} y2={dimY}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        <line x1={x2} y1={extStart} x2={x2} y2={dimY}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        {/* Dimension line */}
        <line x1={x1} y1={dimY} x2={x2} y2={dimY}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        {/* Tick marks (45-degree slashes) */}
        <line x1={x1 - tickSize / 2} y1={dimY + tickSize / 2} x2={x1 + tickSize / 2} y2={dimY - tickSize / 2}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        <line x1={x2 - tickSize / 2} y1={dimY + tickSize / 2} x2={x2 + tickSize / 2} y2={dimY - tickSize / 2}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        {/* Label */}
        <text
          x={midX} y={dimY - 1.5}
          textAnchor="middle"
          fill={DRAWING_COLORS.DIMENSION_TEXT}
          fontFamily={FONTS.DIMENSION.family}
          fontSize={FONTS.DIMENSION.size}
          fontWeight={FONTS.DIMENSION.weight}
        >
          {label}
        </text>
      </g>
    );
  } else {
    // Vertical dimension
    const dimX = side === 'left' ? x1 - offset : x1 + offset;
    const midY = (y1 + y2) / 2;
    const extStart = side === 'left' ? x1 - extensionOvershoot : x1 + extensionOvershoot;

    return (
      <g>
        <line x1={extStart} y1={y1} x2={dimX} y2={y1}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        <line x1={extStart} y1={y2} x2={dimX} y2={y2}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        <line x1={dimX} y1={y1} x2={dimX} y2={y2}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        <line x1={dimX - tickSize / 2} y1={y1 + tickSize / 2} x2={dimX + tickSize / 2} y2={y1 - tickSize / 2}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        <line x1={dimX - tickSize / 2} y1={y2 + tickSize / 2} x2={dimX + tickSize / 2} y2={y2 - tickSize / 2}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        <text
          x={dimX - 1.5} y={midY}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(-90, ${dimX - 1.5}, ${midY})`}
          fill={DRAWING_COLORS.DIMENSION_TEXT}
          fontFamily={FONTS.DIMENSION.family}
          fontSize={FONTS.DIMENSION.size}
          fontWeight={FONTS.DIMENSION.weight}
        >
          {label}
        </text>
      </g>
    );
  }
};

// ── Room Label ──────────────────────────────────────────────────────────────

interface RoomLabelProps {
  x: number;        // Center X
  y: number;        // Center Y
  name: string;
  widthFt: number;
  depthFt: number;
}

export const RoomLabel: React.FC<RoomLabelProps> = ({ x, y, name, widthFt, depthFt }) => {
  const area = Math.round(widthFt * depthFt);
  const dimText = `${formatDimension(widthFt)} × ${formatDimension(depthFt)}`;

  return (
    <g>
      <text
        x={x} y={y - 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={DRAWING_COLORS.BLACK}
        fontFamily={FONTS.ROOM_LABEL.family}
        fontSize={FONTS.ROOM_LABEL.size}
        fontWeight={FONTS.ROOM_LABEL.weight}
        letterSpacing="0.5"
      >
        {name.toUpperCase()}
      </text>
      <text
        x={x} y={y + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={DRAWING_COLORS.MEDIUM_GRAY}
        fontFamily={FONTS.ROOM_AREA.family}
        fontSize={FONTS.ROOM_AREA.size}
      >
        {dimText}
      </text>
      <text
        x={x} y={y + 5.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={DRAWING_COLORS.MEDIUM_GRAY}
        fontFamily={FONTS.ROOM_AREA.family}
        fontSize={FONTS.ROOM_AREA.size}
      >
        {area} SF
      </text>
    </g>
  );
};

// ── North Arrow ─────────────────────────────────────────────────────────────

interface NorthArrowProps {
  x: number;
  y: number;
  size?: number;
}

export const NorthArrow: React.FC<NorthArrowProps> = ({ x, y, size = 16 }) => {
  const half = size / 2;
  return (
    <g>
      <circle cx={x} cy={y} r={half} fill="none" stroke={DRAWING_COLORS.BLACK}
        strokeWidth={LINE_WEIGHTS.OUTLINE} />
      {/* Arrow pointing up */}
      <polygon
        points={`${x},${y - half + 2} ${x - 3},${y + 2} ${x},${y - 1} ${x + 3},${y + 2}`}
        fill={DRAWING_COLORS.BLACK}
      />
      <text
        x={x} y={y - half - 2}
        textAnchor="middle"
        fill={DRAWING_COLORS.BLACK}
        fontFamily={FONTS.DIMENSION.family}
        fontSize={FONTS.DIMENSION.size + 1}
        fontWeight="700"
      >
        N
      </text>
    </g>
  );
};
