/**
 * Architectural drawing constants — line weights, scales, fonts, hatch patterns.
 * All weights are in SVG stroke-width units (scaled to match mm at target print scale).
 */

// ── Line Weights (in SVG units, calibrated for 1:50 scale print) ────────────

export const LINE_WEIGHTS = {
  CUT_LINE: 2.0,      // 0.50mm — walls cut by floor plan
  OUTLINE: 1.4,       // 0.35mm — object outlines, fixtures
  MEDIUM: 1.0,        // 0.25mm — general lines
  HIDDEN: 0.8,        // 0.20mm — dashed hidden edges
  DIMENSION: 0.6,     // 0.18mm — dimension lines, leaders
  HATCH: 0.4,         // 0.13mm — hatching patterns
  CENTER: 0.6,        // 0.18mm — center lines (dash-dot)
  THIN: 0.3,          // 0.10mm — very fine detail
} as const;

// ── Drawing Colors (monochrome for permit drawings) ─────────────────────────

export const DRAWING_COLORS = {
  BLACK: '#000000',
  DARK_GRAY: '#333333',
  MEDIUM_GRAY: '#666666',
  LIGHT_GRAY: '#999999',
  VERY_LIGHT_GRAY: '#CCCCCC',
  WHITE: '#FFFFFF',
  // Highlight colors (for interactive use, not print)
  HIGHLIGHT: '#2563EB',
  DIMENSION_TEXT: '#000000',
} as const;

// ── Scale Helpers ───────────────────────────────────────────────────────────

/** SVG units per foot at different scales */
export const SCALE_FACTORS = {
  '1:50': 6.096,    // ~6 SVG units per foot
  '1:100': 3.048,
  '1:48': 6.35,     // 1/4" = 1'0" (imperial)
  '1:96': 3.175,    // 1/8" = 1'0" (imperial)
} as const;

export type DrawingScale = keyof typeof SCALE_FACTORS;

/** Default drawing scale */
export const DEFAULT_SCALE: DrawingScale = '1:48';

/** Convert feet to SVG units at given scale */
export function ftToSvg(feet: number, scale: DrawingScale = DEFAULT_SCALE): number {
  return feet * SCALE_FACTORS[scale];
}

/** Convert inches to SVG units at given scale */
export function inToSvg(inches: number, scale: DrawingScale = DEFAULT_SCALE): number {
  return (inches / 12) * SCALE_FACTORS[scale];
}

/** Format a dimension in feet-inches (architectural style) */
export function formatDimension(feet: number): string {
  const wholeFeet = Math.floor(feet);
  const inches = Math.round((feet - wholeFeet) * 12);
  if (inches === 12) return `${wholeFeet + 1}'-0"`;
  if (inches === 0) return `${wholeFeet}'-0"`;
  return `${wholeFeet}'-${inches}"`;
}

// ── Font Styles ─────────────────────────────────────────────────────────────

export const FONTS = {
  DIMENSION: {
    family: "'JetBrains Mono', 'Courier New', monospace",
    size: 3.2,
    weight: '400',
  },
  ROOM_LABEL: {
    family: "'Inter', 'Helvetica', sans-serif",
    size: 4.5,
    weight: '600',
  },
  ROOM_AREA: {
    family: "'JetBrains Mono', 'Courier New', monospace",
    size: 3.0,
    weight: '400',
  },
  TITLE_BLOCK: {
    family: "'Inter', 'Helvetica', sans-serif",
    size: 5.0,
    weight: '700',
  },
  TITLE_SUB: {
    family: "'Inter', 'Helvetica', sans-serif",
    size: 3.5,
    weight: '400',
  },
  NOTE: {
    family: "'JetBrains Mono', 'Courier New', monospace",
    size: 2.8,
    weight: '400',
  },
} as const;

// ── Dash Patterns ───────────────────────────────────────────────────────────

export const DASH_PATTERNS = {
  HIDDEN: '4,2',         // dashed
  CENTER: '8,2,2,2',     // dash-dot
  PHANTOM: '8,2,2,2,2,2', // dash-dot-dot
  PROPERTY: '6,3',       // long dash
} as const;

// ── SVG Hatch Pattern Definitions ───────────────────────────────────────────

export const HATCH_PATTERNS = {
  CONCRETE: {
    id: 'hatch-concrete',
    width: 8,
    height: 8,
    // Random dots pattern
    content: `<circle cx="2" cy="2" r="0.5" fill="#666"/>
      <circle cx="6" cy="5" r="0.4" fill="#666"/>
      <circle cx="4" cy="7" r="0.35" fill="#666"/>`,
  },
  INSULATION: {
    id: 'hatch-insulation',
    width: 12,
    height: 6,
    // Wavy lines
    content: `<path d="M0,3 Q3,0 6,3 Q9,6 12,3" fill="none" stroke="#999" stroke-width="0.3"/>`,
  },
  EARTH: {
    id: 'hatch-earth',
    width: 6,
    height: 6,
    // Diagonal lines
    content: `<line x1="0" y1="6" x2="6" y2="0" stroke="#999" stroke-width="0.3"/>`,
  },
  WOOD: {
    id: 'hatch-wood',
    width: 10,
    height: 4,
    // Wood grain
    content: `<path d="M0,2 Q2.5,1 5,2 Q7.5,3 10,2" fill="none" stroke="#999" stroke-width="0.25"/>`,
  },
  BRICK: {
    id: 'hatch-brick',
    width: 8,
    height: 6,
    content: `<line x1="0" y1="3" x2="8" y2="3" stroke="#999" stroke-width="0.2"/>
      <line x1="0" y1="6" x2="8" y2="6" stroke="#999" stroke-width="0.2"/>
      <line x1="4" y1="0" x2="4" y2="3" stroke="#999" stroke-width="0.2"/>
      <line x1="0" y1="3" x2="0" y2="6" stroke="#999" stroke-width="0.2"/>
      <line x1="8" y1="3" x2="8" y2="6" stroke="#999" stroke-width="0.2"/>`,
  },
} as const;

// ── Margin/padding for drawing sheets ───────────────────────────────────────

export const SHEET = {
  MARGIN: 20,           // SVG units from edge to border
  TITLE_BLOCK_HEIGHT: 30,
  BORDER_WIDTH: 1.5,
  DIMENSION_OFFSET: 15, // Distance of dimension chains from walls
  EXTENSION_OVERSHOOT: 2,
  TICK_SIZE: 2,
} as const;
