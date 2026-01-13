import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ParkingSpace {
  id: string;
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  type: 'standard' | 'accessible' | 'compact' | 'ev';
  row: number;
  col: number;
}

interface ParkingLayout {
  spaces: ParkingSpace[];
  aisles: { x: number; y: number; width: number; height: number; direction: 'horizontal' | 'vertical' }[];
  entries: { x: number; y: number; width: number }[];
  exits: { x: number; y: number; width: number }[];
  totalSpaces: number;
  accessibleSpaces: number;
  evSpaces: number;
  compactSpaces: number;
}

interface ParkingLayout2DProps {
  layout: ParkingLayout;
  siteLength: number;
  siteWidth: number;
  showDimensions: boolean;
  showLabels: boolean;
}

const SPACE_COLORS = {
  standard: { fill: '#3b82f6', stroke: '#1d4ed8' },
  accessible: { fill: '#0ea5e9', stroke: '#0369a1' },
  ev: { fill: '#22c55e', stroke: '#15803d' },
  compact: { fill: '#f59e0b', stroke: '#b45309' },
};

export const ParkingLayout2D: React.FC<ParkingLayout2DProps> = ({
  layout,
  siteLength,
  siteWidth,
  showDimensions,
  showLabels,
}) => {
  const scale = useMemo(() => {
    const maxWidth = 800;
    const maxHeight = 550;
    const scaleX = maxWidth / siteLength;
    const scaleY = maxHeight / siteWidth;
    return Math.min(scaleX, scaleY, 10);
  }, [siteLength, siteWidth]);

  const padding = 40;
  const svgWidth = siteLength * scale + padding * 2;
  const svgHeight = siteWidth * scale + padding * 2;

  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/30 overflow-auto p-4">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="max-w-full max-h-full"
      >
        {/* Background */}
        <rect
          x={padding}
          y={padding}
          width={siteLength * scale}
          height={siteWidth * scale}
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />

        {/* Grid lines */}
        <defs>
          <pattern
            id="grid"
            width={5 * scale}
            height={5 * scale}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${5 * scale} 0 L 0 0 0 ${5 * scale}`}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect
          x={padding}
          y={padding}
          width={siteLength * scale}
          height={siteWidth * scale}
          fill="url(#grid)"
        />

        {/* Aisles */}
        {layout.aisles.map((aisle, i) => (
          <g key={`aisle-${i}`}>
            <rect
              x={padding + aisle.x * scale}
              y={padding + aisle.y * scale}
              width={aisle.width * scale}
              height={aisle.height * scale}
              fill="hsl(var(--background))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            {/* Direction arrows */}
            {aisle.direction === 'horizontal' && (
              <>
                <path
                  d={`M ${padding + aisle.width * scale * 0.3} ${padding + (aisle.y + aisle.height / 2) * scale}
                     L ${padding + aisle.width * scale * 0.35} ${padding + (aisle.y + aisle.height / 2 - 1) * scale}
                     M ${padding + aisle.width * scale * 0.3} ${padding + (aisle.y + aisle.height / 2) * scale}
                     L ${padding + aisle.width * scale * 0.35} ${padding + (aisle.y + aisle.height / 2 + 1) * scale}
                     M ${padding + aisle.width * scale * 0.3} ${padding + (aisle.y + aisle.height / 2) * scale}
                     L ${padding + aisle.width * scale * 0.4} ${padding + (aisle.y + aisle.height / 2) * scale}`}
                  fill="none"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="2"
                  opacity="0.5"
                />
                <path
                  d={`M ${padding + aisle.width * scale * 0.7} ${padding + (aisle.y + aisle.height / 2) * scale}
                     L ${padding + aisle.width * scale * 0.65} ${padding + (aisle.y + aisle.height / 2 - 1) * scale}
                     M ${padding + aisle.width * scale * 0.7} ${padding + (aisle.y + aisle.height / 2) * scale}
                     L ${padding + aisle.width * scale * 0.65} ${padding + (aisle.y + aisle.height / 2 + 1) * scale}
                     M ${padding + aisle.width * scale * 0.7} ${padding + (aisle.y + aisle.height / 2) * scale}
                     L ${padding + aisle.width * scale * 0.6} ${padding + (aisle.y + aisle.height / 2) * scale}`}
                  fill="none"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="2"
                  opacity="0.5"
                />
              </>
            )}
          </g>
        ))}

        {/* Parking Spaces */}
        {layout.spaces.map((space, i) => {
          const colors = SPACE_COLORS[space.type];
          const centerX = padding + (space.x + space.width / 2) * scale;
          const centerY = padding + (space.y + space.length / 2) * scale;

          return (
            <motion.g
              key={space.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.002 }}
            >
              <rect
                x={padding + space.x * scale}
                y={padding + space.y * scale}
                width={space.width * scale}
                height={space.length * scale}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth="1"
                opacity="0.8"
                rx="2"
                transform={`rotate(${space.angle - 90} ${centerX} ${centerY})`}
              />
              
              {/* Space type indicators */}
              {space.type === 'accessible' && (
                <g transform={`translate(${centerX - 6}, ${centerY - 6})`}>
                  <circle cx="6" cy="6" r="5" fill="white" />
                  <text
                    x="6"
                    y="9"
                    textAnchor="middle"
                    fontSize="8"
                    fill="#0369a1"
                    fontWeight="bold"
                  >
                    ♿
                  </text>
                </g>
              )}
              {space.type === 'ev' && (
                <g transform={`translate(${centerX - 6}, ${centerY - 6})`}>
                  <circle cx="6" cy="6" r="5" fill="white" />
                  <text
                    x="6"
                    y="9"
                    textAnchor="middle"
                    fontSize="7"
                    fill="#15803d"
                    fontWeight="bold"
                  >
                    EV
                  </text>
                </g>
              )}

              {/* Space number label */}
              {showLabels && (
                <text
                  x={centerX}
                  y={centerY + 3}
                  textAnchor="middle"
                  fontSize="8"
                  fill="white"
                  fontWeight="500"
                >
                  {i + 1}
                </text>
              )}
            </motion.g>
          );
        })}

        {/* Entry/Exit markers */}
        {layout.entries.map((entry, i) => (
          <g key={`entry-${i}`}>
            <rect
              x={padding + entry.x * scale - 2}
              y={padding + entry.y * scale}
              width="4"
              height={entry.width * scale}
              fill="#22c55e"
            />
            <text
              x={padding + entry.x * scale - 15}
              y={padding + (entry.y + entry.width / 2) * scale}
              textAnchor="middle"
              fontSize="10"
              fill="hsl(var(--foreground))"
              fontWeight="bold"
              transform={`rotate(-90 ${padding + entry.x * scale - 15} ${padding + (entry.y + entry.width / 2) * scale})`}
            >
              ENTRY
            </text>
          </g>
        ))}
        {layout.exits.map((exit, i) => (
          <g key={`exit-${i}`}>
            <rect
              x={padding + (exit.x + exit.width) * scale - 2}
              y={padding + exit.y * scale}
              width="4"
              height={exit.width * scale}
              fill="#ef4444"
            />
            <text
              x={padding + (exit.x + exit.width) * scale + 15}
              y={padding + (exit.y + exit.width / 2) * scale}
              textAnchor="middle"
              fontSize="10"
              fill="hsl(var(--foreground))"
              fontWeight="bold"
              transform={`rotate(90 ${padding + (exit.x + exit.width) * scale + 15} ${padding + (exit.y + exit.width / 2) * scale})`}
            >
              EXIT
            </text>
          </g>
        ))}

        {/* Dimensions */}
        {showDimensions && (
          <>
            {/* Width dimension */}
            <line
              x1={padding}
              y1={padding - 15}
              x2={padding + siteLength * scale}
              y2={padding - 15}
              stroke="hsl(var(--foreground))"
              strokeWidth="1"
              markerStart="url(#arrowStart)"
              markerEnd="url(#arrowEnd)"
            />
            <text
              x={padding + (siteLength * scale) / 2}
              y={padding - 20}
              textAnchor="middle"
              fontSize="12"
              fill="hsl(var(--foreground))"
              fontWeight="500"
            >
              {siteLength}m
            </text>

            {/* Height dimension */}
            <line
              x1={padding - 15}
              y1={padding}
              x2={padding - 15}
              y2={padding + siteWidth * scale}
              stroke="hsl(var(--foreground))"
              strokeWidth="1"
            />
            <text
              x={padding - 20}
              y={padding + (siteWidth * scale) / 2}
              textAnchor="middle"
              fontSize="12"
              fill="hsl(var(--foreground))"
              fontWeight="500"
              transform={`rotate(-90 ${padding - 20} ${padding + (siteWidth * scale) / 2})`}
            >
              {siteWidth}m
            </text>
          </>
        )}

        {/* Legend */}
        <g transform={`translate(${svgWidth - 120}, ${svgHeight - 100})`}>
          <rect
            x="-10"
            y="-10"
            width="120"
            height="95"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            rx="4"
          />
          <text x="0" y="5" fontSize="10" fontWeight="bold" fill="hsl(var(--foreground))">
            Legend
          </text>
          {Object.entries(SPACE_COLORS).map(([type, colors], i) => (
            <g key={type} transform={`translate(0, ${15 + i * 18})`}>
              <rect x="0" y="0" width="12" height="12" fill={colors.fill} rx="2" />
              <text x="18" y="10" fontSize="9" fill="hsl(var(--foreground))" className="capitalize">
                {type === 'ev' ? 'EV Charging' : type.charAt(0).toUpperCase() + type.slice(1)}
              </text>
            </g>
          ))}
        </g>

        {/* Arrow markers */}
        <defs>
          <marker
            id="arrowEnd"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="hsl(var(--foreground))"
            />
          </marker>
          <marker
            id="arrowStart"
            markerWidth="10"
            markerHeight="7"
            refX="1"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="10 0, 0 3.5, 10 7"
              fill="hsl(var(--foreground))"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
};
