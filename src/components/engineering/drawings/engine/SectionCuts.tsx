/**
 * Section cut indicator lines (A-A horizontal, B-B vertical)
 * with labeled circle endpoints and view direction triangles.
 */
import React from 'react';
import {
  LINE_WEIGHTS,
  DRAWING_COLORS,
  DASH_PATTERNS,
  FONTS,
} from './drawingConstants';

interface SectionCutsProps {
  buildingW: number;
  buildingH: number;
}

const SectionEndpoint: React.FC<{
  cx: number;
  cy: number;
  label: string;
  triangleDir: 'up' | 'down' | 'left' | 'right';
}> = ({ cx, cy, label, triangleDir }) => {
  const r = 5;
  const triSize = 4;
  const triOffset = r + 3;

  const triPoints: Record<string, string> = {
    up: `${cx},${cy - triOffset - triSize} ${cx - triSize / 2},${cy - triOffset} ${cx + triSize / 2},${cy - triOffset}`,
    down: `${cx},${cy + triOffset + triSize} ${cx - triSize / 2},${cy + triOffset} ${cx + triSize / 2},${cy + triOffset}`,
    left: `${cx - triOffset - triSize},${cy} ${cx - triOffset},${cy - triSize / 2} ${cx - triOffset},${cy + triSize / 2}`,
    right: `${cx + triOffset + triSize},${cy} ${cx + triOffset},${cy - triSize / 2} ${cx + triOffset},${cy + triSize / 2}`,
  };

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={DRAWING_COLORS.BLACK} stroke={DRAWING_COLORS.BLACK}
        strokeWidth={LINE_WEIGHTS.OUTLINE} />
      <text x={cx} y={cy} fill={DRAWING_COLORS.WHITE}
        textAnchor="middle" dominantBaseline="central"
        fontFamily={FONTS.DIMENSION.family} fontSize={7} fontWeight="700">
        {label}
      </text>
      <polygon points={triPoints[triangleDir]} fill={DRAWING_COLORS.BLACK} />
    </g>
  );
};

export const SectionCuts: React.FC<SectionCutsProps> = ({ buildingW, buildingH }) => {
  const ext = 15; // extension beyond building
  const midY = buildingH / 2;
  const midX = buildingW / 2;

  return (
    <g id="layer-section-cuts">
      {/* A-A Horizontal */}
      <line x1={-ext} y1={midY} x2={buildingW + ext} y2={midY}
        stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.MEDIUM}
        strokeDasharray={DASH_PATTERNS.CENTER} />
      <SectionEndpoint cx={-ext} cy={midY} label="A" triangleDir="down" />
      <SectionEndpoint cx={buildingW + ext} cy={midY} label="A" triangleDir="up" />

      {/* B-B Vertical */}
      <line x1={midX} y1={-ext} x2={midX} y2={buildingH + ext}
        stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.MEDIUM}
        strokeDasharray={DASH_PATTERNS.CENTER} />
      <SectionEndpoint cx={midX} cy={-ext} label="B" triangleDir="right" />
      <SectionEndpoint cx={midX} cy={buildingH + ext} label="B" triangleDir="left" />
    </g>
  );
};
