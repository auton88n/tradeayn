/**
 * ScaleBar — graphic scale indicator for architectural drawings.
 */

import React from 'react';
import { LINE_WEIGHTS, DRAWING_COLORS, FONTS, type DrawingScale } from './drawingConstants';

interface ScaleBarProps {
  x: number;
  y: number;
  scale: DrawingScale;
}

const SCALE_LABELS: Record<DrawingScale, string> = {
  '1:48': 'SCALE: 1/4" = 1\'-0"',
  '1:50': 'SCALE: 1:50',
  '1:96': 'SCALE: 1/8" = 1\'-0"',
  '1:100': 'SCALE: 1:100',
};

export const ScaleBar: React.FC<ScaleBarProps> = ({ x, y, scale }) => {
  const SCALE_FACTORS: Record<DrawingScale, number> = {
    '1:48': 6.35,
    '1:50': 6.096,
    '1:96': 3.175,
    '1:100': 3.048,
  };
  const factor = SCALE_FACTORS[scale];
  const segmentFt = 4; // each segment = 4 feet
  const segW = segmentFt * factor;
  const segH = 2;
  const numSegments = 4; // 0, 4', 8', 12', 16'

  return (
    <g>
      {Array.from({ length: numSegments }).map((_, i) => (
        <rect
          key={i}
          x={x + i * segW}
          y={y}
          width={segW}
          height={segH}
          fill={i % 2 === 0 ? DRAWING_COLORS.BLACK : DRAWING_COLORS.WHITE}
          stroke={DRAWING_COLORS.BLACK}
          strokeWidth={LINE_WEIGHTS.DIMENSION}
        />
      ))}
      {/* Labels */}
      {Array.from({ length: numSegments + 1 }).map((_, i) => (
        <text
          key={`l-${i}`}
          x={x + i * segW}
          y={y - 1}
          textAnchor="middle"
          fill={DRAWING_COLORS.BLACK}
          fontFamily={FONTS.DIMENSION.family}
          fontSize={FONTS.DIMENSION.size * 0.8}
        >
          {i * segmentFt}'
        </text>
      ))}
      {/* Scale label */}
      <text
        x={x + (numSegments * segW) / 2}
        y={y + segH + 3}
        textAnchor="middle"
        fill={DRAWING_COLORS.BLACK}
        fontFamily={FONTS.NOTE.family}
        fontSize={FONTS.NOTE.size}
      >
        {SCALE_LABELS[scale]}
      </text>
    </g>
  );
};
