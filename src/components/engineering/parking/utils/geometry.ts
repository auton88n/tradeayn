import { Point2D, BoundaryMetrics } from '../types/parking.types';

/**
 * Calculate polygon area using the Shoelace formula
 */
export function calculateArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area / 2);
}

/**
 * Calculate polygon perimeter
 */
export function calculatePerimeter(points: Point2D[]): number {
  if (points.length < 2) return 0;
  
  let perimeter = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += distance(points[i], points[j]);
  }
  
  return perimeter;
}

/**
 * Calculate distance between two points
 */
export function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Check if two line segments intersect
 */
function segmentsIntersect(
  p1: Point2D, p2: Point2D,
  p3: Point2D, p4: Point2D
): boolean {
  const ccw = (A: Point2D, B: Point2D, C: Point2D): boolean => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  };
  
  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

/**
 * Check if polygon is valid (no self-intersections)
 */
export function isValidPolygon(points: Point2D[]): { valid: boolean; error?: string } {
  if (points.length < 3) {
    return { valid: false, error: 'Need at least 3 points' };
  }
  
  const n = points.length;
  
  // Check for self-intersections
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      // Don't check adjacent segments or first-last pair
      if (i === 0 && j === n - 1) continue;
      
      if (segmentsIntersect(
        points[i], points[(i + 1) % n],
        points[j], points[(j + 1) % n]
      )) {
        return { valid: false, error: 'Polygon has self-intersecting edges' };
      }
    }
  }
  
  // Check for zero area
  const area = calculateArea(points);
  if (area < 1) {
    return { valid: false, error: 'Polygon area too small (< 1 m²)' };
  }
  
  return { valid: true };
}

/**
 * Get bounding box of points
 */
export function getBoundingBox(points: Point2D[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { minX: 0, maxX: 100, minY: 0, maxY: 100, width: 100, height: 100 };
  }
  
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate all boundary metrics
 */
export function calculateBoundaryMetrics(points: Point2D[]): BoundaryMetrics {
  const validation = isValidPolygon(points);
  
  return {
    area: calculateArea(points),
    perimeter: calculatePerimeter(points),
    isValid: validation.valid,
    pointCount: points.length,
    validationError: validation.error,
  };
}

/**
 * Generate a unique ID for a point
 */
export function generatePointId(): string {
  return `pt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse CSV/text content into points
 */
export function parsePointsFromText(text: string): Point2D[] {
  const lines = text.trim().split('\n');
  const points: Point2D[] = [];
  
  for (const line of lines) {
    // Skip empty lines and headers
    const trimmed = line.trim();
    if (!trimmed || trimmed.toLowerCase().startsWith('x') || trimmed.startsWith('#')) {
      continue;
    }
    
    // Try comma, tab, or space separator
    let parts: string[] = [];
    if (trimmed.includes(',')) {
      parts = trimmed.split(',');
    } else if (trimmed.includes('\t')) {
      parts = trimmed.split('\t');
    } else {
      parts = trimmed.split(/\s+/);
    }
    
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      
      if (!isNaN(x) && !isNaN(y)) {
        points.push({ id: generatePointId(), x, y });
      }
    }
  }
  
  return points;
}

/**
 * Round number to specified decimals
 */
export function roundTo(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
