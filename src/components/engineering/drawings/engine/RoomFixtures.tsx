/**
 * Room fixture SVG symbols for architectural floor plans.
 * Kitchen counters, bathroom fixtures, beds, garage outlines, etc.
 * All drawn with thin lines to not compete with walls.
 */

import React from 'react';
import { LINE_WEIGHTS, DRAWING_COLORS, DASH_PATTERNS, FONTS } from './drawingConstants';

const FIX_STROKE = DRAWING_COLORS.DARK_GRAY;
const FIX_WEIGHT = LINE_WEIGHTS.MEDIUM;
const FIX_THIN = LINE_WEIGHTS.THIN;

// ── Kitchen ─────────────────────────────────────────────────────────────────

interface FixtureProps {
  x: number;
  y: number;
  width: number;
  depth: number;
  hasIsland?: boolean;
}

export const KitchenFixtures: React.FC<FixtureProps> = ({ x, y, width, depth, hasIsland = true }) => {
  const pad = 1;
  const counterD = Math.min(width * 0.18, 6); // deeper counters, max 6 SVG units

  return (
    <g>
      {/* L-shaped counter along top and right walls */}
      <rect x={x + pad} y={y + pad} width={width - pad * 2} height={counterD}
        fill="none" stroke={FIX_STROKE} strokeWidth={LINE_WEIGHTS.OUTLINE} />
      <rect x={x + width - pad - counterD} y={y + pad + counterD} width={counterD} height={depth * 0.4}
        fill="none" stroke={FIX_STROKE} strokeWidth={LINE_WEIGHTS.OUTLINE} />

      {/* Sink (double bowl) on top counter */}
      {(() => {
        const sinkX = x + width * 0.3;
        const sinkY = y + pad + counterD * 0.15;
        const bowlW = counterD * 0.4;
        const bowlH = counterD * 0.6;
        return (
          <>
            <rect x={sinkX} y={sinkY} width={bowlW} height={bowlH}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} rx={0.3} />
            <rect x={sinkX + bowlW + 0.4} y={sinkY} width={bowlW} height={bowlH}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} rx={0.3} />
          </>
        );
      })()}

      {/* Stove (4 burners) on top counter */}
      {(() => {
        const stoveX = x + width * 0.55;
        const stoveY = y + pad;
        const stoveW = counterD * 1.4;
        const stoveH = counterD;
        const burnerR = Math.max(stoveH * 0.18, 0.6);
        return (
          <>
            <rect x={stoveX} y={stoveY} width={stoveW} height={stoveH}
              fill="none" stroke={FIX_STROKE} strokeWidth={LINE_WEIGHTS.OUTLINE} />
            <circle cx={stoveX + stoveW * 0.3} cy={stoveY + stoveH * 0.35} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
            <circle cx={stoveX + stoveW * 0.7} cy={stoveY + stoveH * 0.35} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
            <circle cx={stoveX + stoveW * 0.3} cy={stoveY + stoveH * 0.65} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
            <circle cx={stoveX + stoveW * 0.7} cy={stoveY + stoveH * 0.65} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
          </>
        );
      })()}

      {/* Refrigerator (filled rectangle) */}
      <rect x={x + pad} y={y + pad + counterD + 0.5} width={counterD * 0.85} height={counterD * 1.2}
        fill={DRAWING_COLORS.VERY_LIGHT_GRAY} stroke={FIX_STROKE} strokeWidth={LINE_WEIGHTS.OUTLINE} />

      {/* Island */}
      {hasIsland && width > 15 && depth > 12 && (
        <rect x={x + width * 0.25} y={y + depth * 0.5} width={width * 0.4} height={depth * 0.16}
          fill="none" stroke={FIX_STROKE} strokeWidth={LINE_WEIGHTS.OUTLINE} />
      )}
    </g>
  );
};

// ── Bathroom ────────────────────────────────────────────────────────────────

export const BathroomFixtures: React.FC<FixtureProps & { isEnsuite?: boolean }> = ({
  x, y, width, depth, isEnsuite = false,
}) => {
  const pad = 1;

  // Toilet — scaled up for visibility
  const toiletW = Math.min(width * 0.25, 4);
  const toiletH = Math.min(depth * 0.25, 5);
  const toiletX = x + pad;
  const toiletY = y + depth - toiletH - pad;
  const tankH = toiletH * 0.3;
  const bowlH = toiletH * 0.7;

  // Vanity — wider for ensuite (double vanity)
  const vanityW = isEnsuite ? Math.min(width * 0.55, 14) : Math.min(width * 0.4, 8);
  const vanityH = Math.min(depth * 0.15, 3);
  const vanityX = x + width * 0.5 - vanityW / 2;

  // Tub/shower — fills significant portion
  const tubW = Math.min(width * 0.35, 8);
  const tubH = depth - pad * 2;
  const tubX = x + width - pad - tubW;
  const tubY = y + pad;

  return (
    <g>
      {/* Toilet — tank + bowl */}
      <rect x={toiletX} y={toiletY} width={toiletW} height={tankH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <ellipse cx={toiletX + toiletW / 2} cy={toiletY + tankH + bowlH * 0.5}
        rx={toiletW * 0.45} ry={bowlH * 0.45}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />

      {/* Vanity + basin(s) */}
      <rect x={vanityX} y={y + pad} width={vanityW} height={vanityH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      {isEnsuite ? (
        <>
          <ellipse cx={vanityX + vanityW * 0.3} cy={y + pad + vanityH * 0.5}
            rx={Math.min(vanityW * 0.12, 1.5)} ry={vanityH * 0.3}
            fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
          <ellipse cx={vanityX + vanityW * 0.7} cy={y + pad + vanityH * 0.5}
            rx={Math.min(vanityW * 0.12, 1.5)} ry={vanityH * 0.3}
            fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
        </>
      ) : (
        <ellipse cx={vanityX + vanityW * 0.5} cy={y + pad + vanityH * 0.5}
          rx={Math.min(vanityW * 0.18, 1.5)} ry={vanityH * 0.3}
          fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      )}

      {/* Bathtub/Shower — rectangle with diagonal */}
      <rect x={tubX} y={tubY} width={tubW} height={tubH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <line x1={tubX} y1={tubY} x2={tubX + tubW} y2={tubY + tubH}
        stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
    </g>
  );
};

// ── Bedroom ─────────────────────────────────────────────────────────────────

export const BedroomFixtures: React.FC<FixtureProps & { isMaster?: boolean }> = ({
  x, y, width, depth, isMaster = false,
}) => {
  const bedW = isMaster ? Math.min(width * 0.45, 12) : Math.min(width * 0.4, 10);
  const bedH = isMaster ? Math.min(depth * 0.5, 13) : Math.min(depth * 0.45, 12);
  const bedX = x + width / 2 - bedW / 2;
  const bedY = y + depth * 0.35;
  const pillowH = bedH * 0.12;

  return (
    <g>
      <rect x={bedX} y={bedY} width={bedW} height={bedH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <rect x={bedX + bedW * 0.05} y={bedY + bedH * 0.02} width={bedW * 0.42} height={pillowH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} rx={0.5} />
      <rect x={bedX + bedW * 0.53} y={bedY + bedH * 0.02} width={bedW * 0.42} height={pillowH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} rx={0.5} />
      <rect x={bedX - 2.5} y={bedY} width={2} height={2}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <rect x={bedX + bedW + 0.5} y={bedY} width={2} height={2}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
    </g>
  );
};

// ── Garage ───────────────────────────────────────────────────────────────────

export const GarageFixtures: React.FC<FixtureProps> = ({ x, y, width, depth }) => {
  const carW = Math.min(width * 0.4, 10);
  const carH = Math.min(depth * 0.7, 28);
  const numCars = width > 16 ? 2 : 1;

  // Garage door width — full width minus small margins for jambs
  const doorWidth = width - 4;

  return (
    <g>
      {/* Garage door — dashed line across top wall */}
      <line x1={x + 2} y1={y} x2={x + 2 + doorWidth} y2={y}
        stroke={FIX_STROKE} strokeWidth={LINE_WEIGHTS.OUTLINE}
        strokeDasharray={DASH_PATTERNS.HIDDEN} />
      <text
        x={x + width / 2} y={y - 2}
        textAnchor="middle"
        fill={DRAWING_COLORS.MEDIUM_GRAY}
        fontFamily={FONTS.NOTE.family}
        fontSize={FONTS.NOTE.size}
        fontWeight={FONTS.NOTE.weight}
      >
        16'-0" GARAGE DOOR
      </text>

      {/* Car outlines */}
      {numCars >= 1 && (
        <rect x={x + width * 0.15} y={y + depth * 0.2} width={carW} height={carH}
          fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN}
          strokeDasharray={DASH_PATTERNS.HIDDEN} />
      )}
      {numCars >= 2 && (
        <rect x={x + width * 0.55} y={y + depth * 0.2} width={carW} height={carH}
          fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN}
          strokeDasharray={DASH_PATTERNS.HIDDEN} />
      )}
    </g>
  );
};

// ── Living / Dining ─────────────────────────────────────────────────────────

export const LivingFixtures: React.FC<FixtureProps> = ({ x, y, width, depth }) => {
  const isLargeRoom = width > 20 && depth > 14;

  // Sofa area — in bottom-left portion
  const sofaMainW = Math.min(width * 0.4, 14);
  const sofaMainH = Math.min(depth * 0.1, 3.5);
  const sofaSideW = Math.min(sofaMainH, 3.5);
  const sofaSideH = Math.min(depth * 0.2, 7);
  const sofaX = x + 3;
  const sofaY = y + depth - sofaMainH - 3;

  // Coffee table
  const ctW = sofaMainW * 0.5;
  const ctH = sofaMainH * 0.7;

  return (
    <g>
      {/* L-shaped sofa — horizontal piece */}
      <rect x={sofaX} y={sofaY} width={sofaMainW} height={sofaMainH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      {/* L-shaped sofa — vertical piece */}
      <rect x={sofaX} y={sofaY - sofaSideH} width={sofaSideW} height={sofaSideH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />

      {/* Coffee table */}
      <rect x={sofaX + sofaMainW * 0.25} y={sofaY - ctH - 2} width={ctW} height={ctH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />

      {/* Dining area — in right half for large rooms */}
      {isLargeRoom && (() => {
        const tableW = Math.min(width * 0.2, 8);
        const tableH = Math.min(depth * 0.3, 10);
        const tableX = x + width * 0.65 - tableW / 2;
        const tableY = y + depth * 0.4 - tableH / 2;
        const chairR = Math.min(tableW * 0.1, 1);

        return (
          <>
            <rect x={tableX} y={tableY} width={tableW} height={tableH}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
            {/* 6 chairs around table */}
            <circle cx={tableX + tableW * 0.3} cy={tableY - chairR * 2} r={chairR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
            <circle cx={tableX + tableW * 0.7} cy={tableY - chairR * 2} r={chairR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
            <circle cx={tableX + tableW * 0.3} cy={tableY + tableH + chairR * 2} r={chairR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
            <circle cx={tableX + tableW * 0.7} cy={tableY + tableH + chairR * 2} r={chairR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
            <circle cx={tableX - chairR * 2} cy={tableY + tableH * 0.5} r={chairR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
            <circle cx={tableX + tableW + chairR * 2} cy={tableY + tableH * 0.5} r={chairR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
          </>
        );
      })()}
    </g>
  );
};

export const DiningFixtures: React.FC<FixtureProps> = ({ x, y, width, depth }) => {
  const tableW = Math.min(width * 0.45, 8);
  const tableH = Math.min(depth * 0.4, 10);
  const tableX = x + width / 2 - tableW / 2;
  const tableY = y + depth / 2 - tableH / 2;
  const chairR = Math.min(tableW * 0.1, 1);

  return (
    <g>
      <rect x={tableX} y={tableY} width={tableW} height={tableH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <circle cx={tableX + tableW * 0.3} cy={tableY - chairR * 2} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <circle cx={tableX + tableW * 0.7} cy={tableY - chairR * 2} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <circle cx={tableX + tableW * 0.3} cy={tableY + tableH + chairR * 2} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <circle cx={tableX + tableW * 0.7} cy={tableY + tableH + chairR * 2} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <circle cx={tableX - chairR * 2} cy={tableY + tableH * 0.5} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <circle cx={tableX + tableW + chairR * 2} cy={tableY + tableH * 0.5} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
    </g>
  );
};

// ── Laundry / Mudroom ───────────────────────────────────────────────────────

export const LaundryFixtures: React.FC<FixtureProps> = ({ x, y, width, depth }) => {
  const pad = 1;
  const unitSize = Math.min(width * 0.25, 4.5);

  return (
    <g>
      <rect x={x + pad} y={y + pad} width={unitSize} height={unitSize}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <circle cx={x + pad + unitSize / 2} cy={y + pad + unitSize / 2} r={unitSize * 0.3}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <rect x={x + pad + unitSize + 0.5} y={y + pad} width={unitSize} height={unitSize}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <circle cx={x + pad + unitSize * 1.5 + 0.5} cy={y + pad + unitSize / 2} r={unitSize * 0.3}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
    </g>
  );
};

// ── Fixture Renderer (maps room type to fixture component) ──────────────────

interface RoomFixtureRendererProps {
  roomType: string;
  roomName: string;
  x: number;
  y: number;
  width: number;
  depth: number;
}

export const RoomFixtureRenderer: React.FC<RoomFixtureRendererProps> = ({
  roomType, roomName, x, y, width, depth,
}) => {
  const type = roomType.toLowerCase();
  const name = roomName.toLowerCase();

  if (width < 5 || depth < 5) return null;

  if (type === 'kitchen') {
    return <KitchenFixtures x={x} y={y} width={width} depth={depth} hasIsland={name.includes('island')} />;
  }
  if (type === 'bathroom' || type === 'ensuite') {
    return <BathroomFixtures x={x} y={y} width={width} depth={depth} isEnsuite={type === 'ensuite' || name.includes('ensuite') || name.includes('master bath')} />;
  }
  if (type === 'bedroom') {
    return <BedroomFixtures x={x} y={y} width={width} depth={depth} isMaster={name.includes('master') || name.includes('primary')} />;
  }
  if (type === 'garage') {
    return <GarageFixtures x={x} y={y} width={width} depth={depth} />;
  }
  if (type === 'living' || type === 'family' || name.includes('living') || name.includes('family')) {
    return <LivingFixtures x={x} y={y} width={width} depth={depth} />;
  }
  if (type === 'dining') {
    return <DiningFixtures x={x} y={y} width={width} depth={depth} />;
  }
  if (type === 'laundry' || type === 'mudroom' || type === 'utility') {
    return <LaundryFixtures x={x} y={y} width={width} depth={depth} />;
  }

  return null;
};
