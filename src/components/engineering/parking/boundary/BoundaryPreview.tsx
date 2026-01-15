import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useParkingSite } from '../context/ParkingSiteContext';
import { getBoundingBox, roundTo } from '../utils/geometry';
import { Point2D } from '../types/parking.types';

const PADDING = 40;
const HANDLE_RADIUS = 6;
const GRID_COLOR = 'hsl(var(--muted-foreground) / 0.15)';

export function BoundaryPreview() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { boundaryPoints, updatePoint, canvasMode } = useParkingSite();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  
  // Calculate viewBox based on points
  const bbox = getBoundingBox(boundaryPoints);
  const viewWidth = Math.max(bbox.width + PADDING * 2, 100);
  const viewHeight = Math.max(bbox.height + PADDING * 2, 100);
  const viewMinX = bbox.minX - PADDING;
  const viewMinY = bbox.minY - PADDING;

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((clientX: number, clientY: number): Point2D | null => {
    if (!svgRef.current) return null;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Get position relative to SVG
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    
    // Convert to world coordinates
    const worldX = (relX / rect.width) * viewWidth + viewMinX;
    const worldY = (relY / rect.height) * viewHeight + viewMinY;
    
    return { id: '', x: roundTo(worldX, 2), y: roundTo(worldY, 2) };
  }, [viewWidth, viewHeight, viewMinX, viewMinY]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    if (worldPos) {
      setMousePos(worldPos);
    }
    
    if (draggingId && worldPos) {
      updatePoint(draggingId, worldPos.x, worldPos.y);
    }
  }, [draggingId, screenToWorld, updatePoint]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, pointId: string) => {
    e.preventDefault();
    setDraggingId(pointId);
  }, []);

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => setDraggingId(null);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Generate grid lines
  const gridStep = viewWidth > 200 ? 20 : viewWidth > 100 ? 10 : 5;
  const gridLinesX = [];
  const gridLinesY = [];
  
  for (let x = Math.floor(viewMinX / gridStep) * gridStep; x <= viewMinX + viewWidth; x += gridStep) {
    gridLinesX.push(x);
  }
  for (let y = Math.floor(viewMinY / gridStep) * gridStep; y <= viewMinY + viewHeight; y += gridStep) {
    gridLinesY.push(y);
  }

  // Build polygon path
  const polygonPath = boundaryPoints.length >= 3
    ? `M ${boundaryPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`
    : '';

  return (
    <div className="bg-card border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Preview</h3>
        {mousePos && (
          <span className="text-xs text-muted-foreground font-mono">
            ({mousePos.x}, {mousePos.y}) m
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-muted/30 rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}`}
          className="w-full h-full"
          style={{ cursor: draggingId ? 'grabbing' : 'default' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setMousePos(null)}
        >
          {/* Grid */}
          <g>
            {gridLinesX.map(x => (
              <line
                key={`gx-${x}`}
                x1={x}
                y1={viewMinY}
                x2={x}
                y2={viewMinY + viewHeight}
                stroke={GRID_COLOR}
                strokeWidth={x % (gridStep * 5) === 0 ? 0.5 : 0.25}
              />
            ))}
            {gridLinesY.map(y => (
              <line
                key={`gy-${y}`}
                x1={viewMinX}
                y1={y}
                x2={viewMinX + viewWidth}
                y2={y}
                stroke={GRID_COLOR}
                strokeWidth={y % (gridStep * 5) === 0 ? 0.5 : 0.25}
              />
            ))}
          </g>

          {/* Polygon fill */}
          {boundaryPoints.length >= 3 && (
            <path
              d={polygonPath}
              fill="hsl(var(--primary) / 0.15)"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          )}

          {/* Connecting lines for 2 points */}
          {boundaryPoints.length === 2 && (
            <line
              x1={boundaryPoints[0].x}
              y1={boundaryPoints[0].y}
              x2={boundaryPoints[1].x}
              y2={boundaryPoints[1].y}
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
          )}

          {/* Vertex handles */}
          {boundaryPoints.map((point, index) => {
            const isHovered = hoveredId === point.id;
            const isDragging = draggingId === point.id;
            const radius = (isHovered || isDragging) ? HANDLE_RADIUS * 1.3 : HANDLE_RADIUS;
            
            return (
              <g key={point.id}>
                {/* Outer ring for better visibility */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius + 2}
                  fill="hsl(var(--background))"
                />
                {/* Main handle */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={isDragging ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.8)'}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  style={{ cursor: 'grab' }}
                  onMouseDown={(e) => handleMouseDown(e, point.id)}
                  onMouseEnter={() => setHoveredId(point.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
                {/* Point number label */}
                <text
                  x={point.x}
                  y={point.y - radius - 4}
                  textAnchor="middle"
                  fontSize={Math.max(8, viewWidth / 30)}
                  fill="hsl(var(--foreground))"
                  fontWeight="500"
                >
                  {index + 1}
                </text>
              </g>
            );
          })}

          {/* No points message */}
          {boundaryPoints.length === 0 && (
            <text
              x={viewMinX + viewWidth / 2}
              y={viewMinY + viewHeight / 2}
              textAnchor="middle"
              fontSize={14}
              fill="hsl(var(--muted-foreground))"
            >
              Add points to define boundary
            </text>
          )}
        </svg>
      </div>

      {/* Tip */}
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Drag vertices to adjust • Numbers show point order
      </p>
    </div>
  );
}
