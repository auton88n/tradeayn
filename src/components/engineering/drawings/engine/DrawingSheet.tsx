/**
 * DrawingSheet — wraps floor plan SVG in a standard architectural sheet
 * with border, title block, scale indicator, and north arrow.
 */

import React from 'react';
import {
  LINE_WEIGHTS,
  DRAWING_COLORS,
  FONTS,
  SHEET,
  type DrawingScale,
  DEFAULT_SCALE,
} from './drawingConstants';
import { NorthArrow } from './ArchitecturalSymbols';

interface DrawingSheetProps {
  children: React.ReactNode;
  projectName?: string;
  drawingTitle?: string;
  drawingNumber?: string;
  scale?: DrawingScale;
  date?: string;
  width?: number;
  height?: number;
}

export const DrawingSheet: React.FC<DrawingSheetProps> = ({
  children,
  projectName = 'Untitled Project',
  drawingTitle = 'Floor Plan',
  drawingNumber = 'A-101',
  scale = DEFAULT_SCALE,
  date,
  width = 800,
  height = 600,
}) => {
  const displayDate = date || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const borderMargin = 8;
  const titleBlockH = SHEET.TITLE_BLOCK_HEIGHT;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: DRAWING_COLORS.WHITE, width: '100%', height: '100%' }}
    >
      {/* Sheet border */}
      <rect
        x={borderMargin}
        y={borderMargin}
        width={width - borderMargin * 2}
        height={height - borderMargin * 2}
        fill="none"
        stroke={DRAWING_COLORS.BLACK}
        strokeWidth={SHEET.BORDER_WIDTH}
      />

      {/* Inner content area */}
      <g transform={`translate(${borderMargin + 4}, ${borderMargin + 4})`}>
        {children}
      </g>

      {/* Title block (bottom right) */}
      <g transform={`translate(${width - borderMargin - 200}, ${height - borderMargin - titleBlockH})`}>
        <rect
          x={0} y={0}
          width={200} height={titleBlockH}
          fill={DRAWING_COLORS.WHITE}
          stroke={DRAWING_COLORS.BLACK}
          strokeWidth={LINE_WEIGHTS.OUTLINE}
        />
        {/* Dividers */}
        <line x1={0} y1={titleBlockH * 0.5} x2={200} y2={titleBlockH * 0.5}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />
        <line x1={120} y1={0} x2={120} y2={titleBlockH}
          stroke={DRAWING_COLORS.BLACK} strokeWidth={LINE_WEIGHTS.DIMENSION} />

        {/* Project name */}
        <text x={4} y={10}
          fontFamily={FONTS.TITLE_BLOCK.family}
          fontSize={FONTS.TITLE_BLOCK.size}
          fontWeight={FONTS.TITLE_BLOCK.weight}
          fill={DRAWING_COLORS.BLACK}
        >
          {projectName}
        </text>

        {/* Drawing title */}
        <text x={4} y={titleBlockH * 0.5 + 10}
          fontFamily={FONTS.TITLE_SUB.family}
          fontSize={FONTS.TITLE_SUB.size}
          fill={DRAWING_COLORS.BLACK}
        >
          {drawingTitle}
        </text>

        {/* Scale */}
        <text x={125} y={10}
          fontFamily={FONTS.NOTE.family}
          fontSize={FONTS.NOTE.size}
          fill={DRAWING_COLORS.DARK_GRAY}
        >
          Scale: {scale}
        </text>

        {/* Date */}
        <text x={125} y={20}
          fontFamily={FONTS.NOTE.family}
          fontSize={FONTS.NOTE.size}
          fill={DRAWING_COLORS.DARK_GRAY}
        >
          Date: {displayDate}
        </text>

        {/* Drawing number */}
        <text x={125} y={titleBlockH * 0.5 + 10}
          fontFamily={FONTS.TITLE_BLOCK.family}
          fontSize={FONTS.TITLE_BLOCK.size}
          fontWeight={FONTS.TITLE_BLOCK.weight}
          fill={DRAWING_COLORS.BLACK}
        >
          {drawingNumber}
        </text>
      </g>

      {/* North arrow (top right) */}
      <NorthArrow x={width - borderMargin - 25} y={borderMargin + 25} />

      {/* Preliminary watermark */}
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={DRAWING_COLORS.VERY_LIGHT_GRAY}
        fontFamily={FONTS.TITLE_BLOCK.family}
        fontSize={24}
        fontWeight="700"
        opacity={0.15}
        transform={`rotate(-30, ${width / 2}, ${height / 2})`}
      >
        PRELIMINARY — NOT FOR CONSTRUCTION
      </text>
    </svg>
  );
};

export default DrawingSheet;
