import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Drawing constants (mirrored from src/components/engineering/drawings/engine/drawingConstants.ts)
const SCALE_FACTOR = 6.35; // 1/4" = 1'-0" (1:48 scale)
const ftToSvg = (feet: number) => feet * SCALE_FACTOR;

const LINE_WEIGHTS = { CUT: 2.5, OUTLINE: 1.4, MEDIUM: 1.0, DIMENSION: 0.6, HATCH: 0.4, THIN: 0.3 };
const SHEET = { MARGIN: 20, TITLE_BLOCK_HEIGHT: 30, DIM_OFFSET: 15, TICK: 2.5 };

function formatDim(feet: number): string {
  const w = Math.floor(feet);
  const i = Math.round((feet - w) * 12);
  if (i === 12) return `${w + 1}'-0"`;
  if (i === 0) return `${w}'-0"`;
  return `${w}'-${i}"`;
}

interface Room {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
}

interface WallSegment {
  x1: number; y1: number; x2: number; y2: number;
  thickness: number;
  isExterior: boolean;
}

interface Opening {
  type: 'door' | 'window';
  x: number; y: number;
  width: number;
  wall: 'north' | 'south' | 'east' | 'west';
  swingDirection?: string;
}

interface LayoutJSON {
  rooms: Room[];
  walls?: WallSegment[];
  openings?: Opening[];
  overallWidth?: number;
  overallHeight?: number;
  style_preset?: string;
  title?: string;
}

function renderSVG(layout: LayoutJSON): string {
  const rooms = layout.rooms || [];
  if (rooms.length === 0) return '<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">No rooms in layout</text></svg>';

  // Calculate bounds from rooms
  let maxX = 0, maxY = 0;
  for (const r of rooms) {
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  const overallW = layout.overallWidth || maxX;
  const overallH = layout.overallHeight || maxY;

  const drawW = ftToSvg(overallW);
  const drawH = ftToSvg(overallH);
  const svgW = drawW + SHEET.MARGIN * 2 + SHEET.DIM_OFFSET * 2;
  const svgH = drawH + SHEET.MARGIN * 2 + SHEET.DIM_OFFSET * 2 + SHEET.TITLE_BLOCK_HEIGHT;
  const ox = SHEET.MARGIN + SHEET.DIM_OFFSET; // origin x
  const oy = SHEET.MARGIN + SHEET.DIM_OFFSET; // origin y

  const extWallThick = ftToSvg(0.542); // 6.5"
  const intWallThick = ftToSvg(0.375); // 4.5"

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}" style="background:#fff">
<defs>
  <pattern id="hatch-ext" width="2.5" height="2.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="2.5" stroke="#333" stroke-width="0.4"/>
  </pattern>
  <pattern id="hatch-ext2" width="2.5" height="2.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
    <line x1="0" y1="0" x2="0" y2="2.5" stroke="#333" stroke-width="0.4"/>
  </pattern>
  <pattern id="hatch-int" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="3" stroke="#666" stroke-width="0.3"/>
  </pattern>
  <style>
    text { font-family: 'Helvetica', 'Arial', sans-serif; }
    .room-label { font-size: 4.5px; font-weight: 600; fill: #000; text-anchor: middle; }
    .room-area { font-size: 3.8px; font-weight: 400; fill: #666; text-anchor: middle; font-family: 'Courier New', monospace; }
    .dim-text { font-size: 4px; font-weight: 400; fill: #000; text-anchor: middle; font-family: 'Courier New', monospace; }
    .title-text { font-size: 5px; font-weight: 700; fill: #000; }
    .title-sub { font-size: 3.5px; font-weight: 400; fill: #333; }
  </style>
</defs>
`;

  // Border
  svg += `<rect x="2" y="2" width="${svgW - 4}" height="${svgH - 4}" fill="none" stroke="#000" stroke-width="1.5"/>
`;

  // === EXTERIOR WALLS (outline of building) ===
  // Draw exterior wall as a thick rectangle with cross-hatching
  svg += `<rect x="${ox}" y="${oy}" width="${drawW}" height="${drawH}" fill="url(#hatch-ext)" stroke="#000" stroke-width="${LINE_WEIGHTS.CUT}"/>
`;
  svg += `<rect x="${ox}" y="${oy}" width="${drawW}" height="${drawH}" fill="url(#hatch-ext2)" stroke="none"/>
`;
  // Interior fill (white) to clear hatching inside
  svg += `<rect x="${ox + extWallThick}" y="${oy + extWallThick}" width="${drawW - extWallThick * 2}" height="${drawH - extWallThick * 2}" fill="#fff" stroke="none"/>
`;

  // === ROOMS ===
  for (const room of rooms) {
    const rx = ox + ftToSvg(room.x);
    const ry = oy + ftToSvg(room.y);
    const rw = ftToSvg(room.width);
    const rh = ftToSvg(room.height);
    const area = room.width * room.height;

    // Room outline
    svg += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none" stroke="#000" stroke-width="${LINE_WEIGHTS.MEDIUM}"/>
`;

    // Room label
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;
    svg += `<text x="${cx}" y="${cy - 2}" class="room-label">${escapeXml(room.name)}</text>
`;
    svg += `<text x="${cx}" y="${cy + 3}" class="room-area">${area.toFixed(0)} SF</text>
`;
  }

  // === INTERIOR WALLS ===
  // Draw interior walls between adjacent rooms
  const drawnWalls = new Set<string>();
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i], b = rooms[j];
      const wallKey = `${i}-${j}`;
      if (drawnWalls.has(wallKey)) continue;

      // Check horizontal adjacency (shared vertical wall)
      if (Math.abs((a.x + a.width) - b.x) < 0.5 || Math.abs((b.x + b.width) - a.x) < 0.5) {
        const sharedX = Math.abs((a.x + a.width) - b.x) < 0.5 ? a.x + a.width : b.x + b.width;
        const minY = Math.max(a.y, b.y);
        const maxY = Math.min(a.y + a.height, b.y + b.height);
        if (maxY > minY) {
          const wx = ox + ftToSvg(sharedX) - intWallThick / 2;
          const wy = oy + ftToSvg(minY);
          const wh = ftToSvg(maxY - minY);
          svg += `<rect x="${wx}" y="${wy}" width="${intWallThick}" height="${wh}" fill="url(#hatch-int)" stroke="#000" stroke-width="${LINE_WEIGHTS.OUTLINE}"/>
`;
          drawnWalls.add(wallKey);
        }
      }

      // Check vertical adjacency (shared horizontal wall)
      if (Math.abs((a.y + a.height) - b.y) < 0.5 || Math.abs((b.y + b.height) - a.y) < 0.5) {
        const sharedY = Math.abs((a.y + a.height) - b.y) < 0.5 ? a.y + a.height : b.y + b.height;
        const minX = Math.max(a.x, b.x);
        const maxX = Math.min(a.x + a.width, b.x + b.width);
        if (maxX > minX) {
          const wx = ox + ftToSvg(minX);
          const wy = oy + ftToSvg(sharedY) - intWallThick / 2;
          const ww = ftToSvg(maxX - minX);
          svg += `<rect x="${wx}" y="${wy}" width="${ww}" height="${intWallThick}" fill="url(#hatch-int)" stroke="#000" stroke-width="${LINE_WEIGHTS.OUTLINE}"/>
`;
          drawnWalls.add(wallKey);
        }
      }
    }
  }

  // === OPENINGS (doors & windows) ===
  const openings = layout.openings || [];
  for (const op of openings) {
    const opx = ox + ftToSvg(op.x);
    const opy = oy + ftToSvg(op.y);
    const opw = ftToSvg(op.width);

    if (op.type === 'door') {
      // Door symbol: gap in wall + swing arc
      const isVertical = op.wall === 'east' || op.wall === 'west';
      if (isVertical) {
        // Clear wall gap
        svg += `<rect x="${opx - intWallThick}" y="${opy}" width="${intWallThick * 2}" height="${opw}" fill="#fff" stroke="none"/>
`;
        // Door line
        svg += `<line x1="${opx}" y1="${opy}" x2="${opx}" y2="${opy + opw}" stroke="#000" stroke-width="${LINE_WEIGHTS.OUTLINE}"/>
`;
        // Swing arc
        svg += `<path d="M ${opx},${opy} A ${opw},${opw} 0 0,1 ${opx + opw},${opy + opw}" fill="none" stroke="#000" stroke-width="${LINE_WEIGHTS.MEDIUM}"/>
`;
      } else {
        svg += `<rect x="${opx}" y="${opy - intWallThick}" width="${opw}" height="${intWallThick * 2}" fill="#fff" stroke="none"/>
`;
        svg += `<line x1="${opx}" y1="${opy}" x2="${opx + opw}" y2="${opy}" stroke="#000" stroke-width="${LINE_WEIGHTS.OUTLINE}"/>
`;
        svg += `<path d="M ${opx},${opy} A ${opw},${opw} 0 0,0 ${opx + opw},${opy - opw}" fill="none" stroke="#000" stroke-width="${LINE_WEIGHTS.MEDIUM}"/>
`;
      }
    } else if (op.type === 'window') {
      // Window symbol: three parallel lines
      const isVertical = op.wall === 'east' || op.wall === 'west';
      if (isVertical) {
        svg += `<rect x="${opx - extWallThick / 2}" y="${opy}" width="${extWallThick}" height="${opw}" fill="#fff" stroke="none"/>
`;
        for (const offset of [-1.5, 0, 1.5]) {
          svg += `<line x1="${opx + offset}" y1="${opy}" x2="${opx + offset}" y2="${opy + opw}" stroke="#000" stroke-width="${LINE_WEIGHTS.THIN}"/>
`;
        }
      } else {
        svg += `<rect x="${opx}" y="${opy - extWallThick / 2}" width="${opw}" height="${extWallThick}" fill="#fff" stroke="none"/>
`;
        for (const offset of [-1.5, 0, 1.5]) {
          svg += `<line x1="${opx}" y1="${opy + offset}" x2="${opx + opw}" y2="${opy + offset}" stroke="#000" stroke-width="${LINE_WEIGHTS.THIN}"/>
`;
        }
      }
    }
  }

  // === DIMENSION CHAINS ===
  // Overall dimensions on all four sides
  const dimOff1 = 4; // Detail chain offset
  const dimOff2 = 12; // Overall chain offset

  // Bottom overall dimension
  const bottomY = oy + drawH + dimOff2;
  svg += `<line x1="${ox}" y1="${bottomY}" x2="${ox + drawW}" y2="${bottomY}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
  svg += `<line x1="${ox}" y1="${bottomY - SHEET.TICK}" x2="${ox}" y2="${bottomY + SHEET.TICK}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
  svg += `<line x1="${ox + drawW}" y1="${bottomY - SHEET.TICK}" x2="${ox + drawW}" y2="${bottomY + SHEET.TICK}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
  svg += `<text x="${ox + drawW / 2}" y="${bottomY + 5}" class="dim-text">${formatDim(overallW)}</text>
`;

  // Right overall dimension
  const rightX = ox + drawW + dimOff2;
  svg += `<line x1="${rightX}" y1="${oy}" x2="${rightX}" y2="${oy + drawH}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
  svg += `<line x1="${rightX - SHEET.TICK}" y1="${oy}" x2="${rightX + SHEET.TICK}" y2="${oy}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
  svg += `<line x1="${rightX - SHEET.TICK}" y1="${oy + drawH}" x2="${rightX + SHEET.TICK}" y2="${oy + drawH}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
  svg += `<text x="${rightX + 5}" y="${oy + drawH / 2}" class="dim-text" transform="rotate(90, ${rightX + 5}, ${oy + drawH / 2})">${formatDim(overallH)}</text>
`;

  // Bottom detail dimensions (per-room X positions)
  const xBreaks = [...new Set(rooms.flatMap(r => [r.x, r.x + r.width]))].sort((a, b) => a - b);
  const detailY = oy + drawH + dimOff1;
  for (let i = 0; i < xBreaks.length - 1; i++) {
    const x1 = ox + ftToSvg(xBreaks[i]);
    const x2 = ox + ftToSvg(xBreaks[i + 1]);
    const span = xBreaks[i + 1] - xBreaks[i];
    if (span < 1) continue;
    svg += `<line x1="${x1}" y1="${detailY}" x2="${x2}" y2="${detailY}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
    svg += `<line x1="${x1}" y1="${detailY - 1.5}" x2="${x1}" y2="${detailY + 1.5}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
    svg += `<line x1="${x2}" y1="${detailY - 1.5}" x2="${x2}" y2="${detailY + 1.5}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
    svg += `<text x="${(x1 + x2) / 2}" y="${detailY - 2}" class="dim-text">${formatDim(span)}</text>
`;
  }

  // Right detail dimensions (per-room Y positions)
  const yBreaks = [...new Set(rooms.flatMap(r => [r.y, r.y + r.height]))].sort((a, b) => a - b);
  const detailX = ox + drawW + dimOff1;
  for (let i = 0; i < yBreaks.length - 1; i++) {
    const y1 = oy + ftToSvg(yBreaks[i]);
    const y2 = oy + ftToSvg(yBreaks[i + 1]);
    const span = yBreaks[i + 1] - yBreaks[i];
    if (span < 1) continue;
    svg += `<line x1="${detailX}" y1="${y1}" x2="${detailX}" y2="${y2}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
    svg += `<line x1="${detailX - 1.5}" y1="${y1}" x2="${detailX + 1.5}" y2="${y1}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
    svg += `<line x1="${detailX - 1.5}" y1="${y2}" x2="${detailX + 1.5}" y2="${y2}" stroke="#000" stroke-width="${LINE_WEIGHTS.DIMENSION}"/>
`;
    svg += `<text x="${detailX + 3}" y="${(y1 + y2) / 2}" class="dim-text" transform="rotate(90, ${detailX + 3}, ${(y1 + y2) / 2})">${formatDim(span)}</text>
`;
  }

  // === TITLE BLOCK ===
  const tbY = svgH - SHEET.TITLE_BLOCK_HEIGHT - 2;
  svg += `<line x1="2" y1="${tbY}" x2="${svgW - 2}" y2="${tbY}" stroke="#000" stroke-width="1.5"/>
`;
  const title = layout.title || layout.style_preset || 'Floor Plan';
  const totalArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);
  svg += `<text x="${SHEET.MARGIN}" y="${tbY + 10}" class="title-text">${escapeXml(title)}</text>
`;
  svg += `<text x="${SHEET.MARGIN}" y="${tbY + 18}" class="title-sub">Scale: 1/4" = 1'-0" (1:48)  |  Total: ${totalArea.toFixed(0)} SF  |  Generated by AYN</text>
`;
  svg += `<text x="${svgW - SHEET.MARGIN}" y="${tbY + 10}" class="title-sub" text-anchor="end">FOR REFERENCE ONLY - NOT FOR CONSTRUCTION</text>
`;

  svg += `</svg>`;
  return svg;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { layout } = await req.json();
    if (!layout || !layout.rooms) {
      return new Response(JSON.stringify({ error: 'Layout with rooms array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[render-floor-plan-svg] Rendering ${layout.rooms.length} rooms`);
    const svg = renderSVG(layout);
    console.log(`[render-floor-plan-svg] SVG generated: ${svg.length} chars`);

    return new Response(JSON.stringify({ svg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[render-floor-plan-svg] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
