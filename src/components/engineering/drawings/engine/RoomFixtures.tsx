/**
 * Room fixture SVG symbols for architectural floor plans.
 * All fixtures use REAL dimensions (inches/feet) converted to SVG units at scale.
 * Never percentage-based — always architecturally accurate.
 */

import React from 'react';
import { LINE_WEIGHTS, DRAWING_COLORS, DASH_PATTERNS, FONTS, ftToSvg, inToSvg, DEFAULT_SCALE } from './drawingConstants';

const FIX_STROKE = DRAWING_COLORS.DARK_GRAY;
const FIX_WEIGHT = LINE_WEIGHTS.MEDIUM;
const FIX_THIN = LINE_WEIGHTS.THIN;

// Real dimension helpers — convert real-world measurements to SVG units
const realFt = (feet: number) => ftToSvg(feet, DEFAULT_SCALE);
const realIn = (inches: number) => inToSvg(inches, DEFAULT_SCALE);

// Clamp a real dimension to fit within available space (with padding)
const clamp = (real: number, available: number, pad = 1) =>
  Math.min(real, Math.max(available - pad * 2, 0));

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
  const counterD = clamp(realIn(24), depth, pad); // 24" counter depth
  const stoveW = clamp(realIn(30), width * 0.3, 0);
  const stoveD = clamp(realIn(24), counterD, 0);
  const fridgeW = clamp(realIn(36), width * 0.3, 0);
  const fridgeD = clamp(realIn(30), depth * 0.4, 0);
  const bowlW = clamp(realIn(14), counterD * 0.8, 0);
  const bowlH = clamp(realIn(16), counterD * 0.9, 0);
  const burnerR = clamp(realIn(4), counterD * 0.3, 0);
  const islandW = clamp(realIn(72), width * 0.5, 0);
  const islandD = clamp(realIn(36), depth * 0.2, 0);

  return (
    <g>
      {/* L-shaped counter along top and right walls */}
      <rect x={x + pad} y={y + pad} width={width - pad * 2} height={counterD}
        fill="none" stroke={FIX_STROKE} strokeWidth={LINE_WEIGHTS.OUTLINE} />
      <rect x={x + width - pad - counterD} y={y + pad + counterD} width={counterD} height={clamp(realFt(4), depth * 0.4, 0)}
        fill="none" stroke={FIX_STROKE} strokeWidth={LINE_WEIGHTS.OUTLINE} />

      {/* Sink (double bowl) on top counter */}
      {(() => {
        const sinkX = x + width * 0.3;
        const sinkY = y + pad + (counterD - bowlH) / 2;
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
        return (
          <>
            <rect x={stoveX} y={stoveY} width={stoveW} height={stoveD}
              fill="none" stroke={FIX_STROKE} strokeWidth={LINE_WEIGHTS.OUTLINE} />
            <circle cx={stoveX + stoveW * 0.3} cy={stoveY + stoveD * 0.35} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
            <circle cx={stoveX + stoveW * 0.7} cy={stoveY + stoveD * 0.35} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
            <circle cx={stoveX + stoveW * 0.3} cy={stoveY + stoveD * 0.65} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
            <circle cx={stoveX + stoveW * 0.7} cy={stoveY + stoveD * 0.65} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
          </>
        );
      })()}

      {/* Refrigerator (filled rectangle) — 36"W × 30"D */}
      <rect x={x + pad} y={y + pad + counterD + 0.5} width={fridgeW} height={fridgeD}
        fill={DRAWING_COLORS.VERY_LIGHT_GRAY} stroke={FIX_STROKE} strokeWidth={LINE_WEIGHTS.OUTLINE} />

      {/* Island — 72"L × 36"D */}
      {hasIsland && width > 15 && depth > 12 && (
        <rect x={x + width / 2 - islandW / 2} y={y + depth * 0.55} width={islandW} height={islandD}
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

  // Toilet — 18"W × 28"D (tank 18"×8", bowl 14"×18" ellipse)
  const toiletW = clamp(realIn(18), width * 0.4, pad);
  const toiletH = clamp(realIn(28), depth * 0.4, pad);
  const toiletX = x + pad;
  const toiletY = y + depth - toiletH - pad;
  const tankH = clamp(realIn(8), toiletH * 0.4, 0);
  const bowlRx = clamp(realIn(7), toiletW * 0.45, 0);
  const bowlRy = clamp(realIn(9), (toiletH - tankH) * 0.45, 0);

  // Vanity — single 24"×20", double 60"×22"
  const vanityW = isEnsuite
    ? clamp(realIn(60), width * 0.7, pad)
    : clamp(realIn(24), width * 0.5, pad);
  const vanityH = isEnsuite
    ? clamp(realIn(22), depth * 0.2, pad)
    : clamp(realIn(20), depth * 0.2, pad);
  const vanityX = x + width / 2 - vanityW / 2;
  const basinR = clamp(realIn(7), vanityW * 0.15, 0);

  // Tub/shower — 30"W × 60"L
  const tubW = clamp(realIn(30), width * 0.4, pad);
  const tubH = clamp(realIn(60), depth - pad * 2, 0);
  const tubX = x + width - pad - tubW;
  const tubY = y + pad;

  return (
    <g>
      {/* Toilet — tank + bowl */}
      <rect x={toiletX} y={toiletY} width={toiletW} height={tankH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <ellipse cx={toiletX + toiletW / 2} cy={toiletY + tankH + bowlRy}
        rx={bowlRx} ry={bowlRy}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <text x={toiletX + toiletW + 1} y={toiletY + toiletH * 0.5}
        fontFamily={FONTS.NOTE.family} fontSize={2.5} fill={DRAWING_COLORS.MEDIUM_GRAY}>WC</text>

      {/* Vanity + basin(s) */}
      <rect x={vanityX} y={y + pad} width={vanityW} height={vanityH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      {isEnsuite ? (
        <>
          <ellipse cx={vanityX + vanityW * 0.3} cy={y + pad + vanityH * 0.5}
            rx={basinR} ry={vanityH * 0.3}
            fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
          <ellipse cx={vanityX + vanityW * 0.7} cy={y + pad + vanityH * 0.5}
            rx={basinR} ry={vanityH * 0.3}
            fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
        </>
      ) : (
        <ellipse cx={vanityX + vanityW * 0.5} cy={y + pad + vanityH * 0.5}
          rx={basinR} ry={vanityH * 0.3}
          fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      )}

      {/* Bathtub/Shower — 30"W × 60"L */}
      <rect x={tubX} y={tubY} width={tubW} height={tubH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <line x1={tubX} y1={tubY} x2={tubX + tubW} y2={tubY + tubH}
        stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <text x={tubX + tubW / 2} y={tubY + tubH / 2} textAnchor="middle" dominantBaseline="middle"
        fontFamily={FONTS.NOTE.family} fontSize={2.5} fill={DRAWING_COLORS.MEDIUM_GRAY}>BATH</text>
    </g>
  );
};

// ── Bedroom ─────────────────────────────────────────────────────────────────

export const BedroomFixtures: React.FC<FixtureProps & { isMaster?: boolean }> = ({
  x, y, width, depth, isMaster = false,
}) => {
  // King bed 76"×80", Queen bed 60"×80"
  const bedW = isMaster ? clamp(realIn(76), width * 0.7, 3) : clamp(realIn(60), width * 0.6, 3);
  const bedH = isMaster ? clamp(realIn(80), depth * 0.6, 3) : clamp(realIn(80), depth * 0.55, 3);
  const bedX = x + width / 2 - bedW / 2;
  const bedY = y + depth * 0.35;
  const pillowW = clamp(realIn(20), bedW * 0.42, 0);
  const pillowH = clamp(realIn(6), bedH * 0.12, 0);
  const nightstandS = clamp(realIn(18), 3, 0); // 18" × 18" nightstands

  return (
    <g>
      <rect x={bedX} y={bedY} width={bedW} height={bedH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      {/* Pillows */}
      <rect x={bedX + bedW * 0.05} y={bedY + bedH * 0.02} width={pillowW} height={pillowH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} rx={0.5} />
      <rect x={bedX + bedW - bedW * 0.05 - pillowW} y={bedY + bedH * 0.02} width={pillowW} height={pillowH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} rx={0.5} />
      {/* Nightstands — 18" × 18" */}
      <rect x={bedX - nightstandS - 0.5} y={bedY} width={nightstandS} height={nightstandS}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <rect x={bedX + bedW + 0.5} y={bedY} width={nightstandS} height={nightstandS}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
    </g>
  );
};

// ── Garage ───────────────────────────────────────────────────────────────────

export const GarageFixtures: React.FC<FixtureProps> = ({ x, y, width, depth }) => {
  // Car outline: 6'W × 16'L
  const carW = clamp(realFt(6), width * 0.4, 2);
  const carH = clamp(realFt(16), depth * 0.8, 2);
  const numCars = width > realFt(18) ? 2 : 1;

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
        {numCars >= 2 ? "16'-0\"" : "8'-0\""} GARAGE DOOR
      </text>

      {/* Car outlines */}
      {numCars >= 1 && (
        <rect x={x + width * 0.12} y={y + depth * 0.15} width={carW} height={carH}
          fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN}
          strokeDasharray={DASH_PATTERNS.HIDDEN} />
      )}
      {numCars >= 2 && (
        <rect x={x + width * 0.55} y={y + depth * 0.15} width={carW} height={carH}
          fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN}
          strokeDasharray={DASH_PATTERNS.HIDDEN} />
      )}
    </g>
  );
};

// ── Living / Dining ─────────────────────────────────────────────────────────

export const LivingFixtures: React.FC<FixtureProps> = ({ x, y, width, depth }) => {
  const isLargeRoom = width > 20 && depth > 14;

  // Sofa: 7'W × 3'D main, 3'W × 5'D return
  const sofaMainW = clamp(realFt(7), width * 0.55, 3);
  const sofaMainH = clamp(realFt(3), depth * 0.15, 3);
  const sofaSideW = clamp(realFt(3), sofaMainH + 1, 0);
  const sofaSideH = clamp(realFt(5), depth * 0.3, 0);
  const sofaX = x + 3;
  const sofaY = y + depth - sofaMainH - 3;

  // Coffee table: 48"W × 24"D
  const ctW = clamp(realIn(48), sofaMainW * 0.7, 0);
  const ctH = clamp(realIn(24), sofaMainH, 0);

  // Dining table: 42"W × 72"L, Chair: 18" diameter
  const tableW = clamp(realIn(42), width * 0.25, 0);
  const tableH = clamp(realIn(72), depth * 0.4, 0);
  const chairR = clamp(realIn(9), 1.5, 0); // 18" diameter = 9" radius

  return (
    <g>
      {/* L-shaped sofa */}
      <rect x={sofaX} y={sofaY} width={sofaMainW} height={sofaMainH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <rect x={sofaX} y={sofaY - sofaSideH} width={sofaSideW} height={sofaSideH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />

      {/* Coffee table */}
      <rect x={sofaX + sofaMainW * 0.25} y={sofaY - ctH - 2} width={ctW} height={ctH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />

      {/* Dining area — in right half for large rooms */}
      {isLargeRoom && (() => {
        const tableX = x + width * 0.65 - tableW / 2;
        const tableY = y + depth * 0.4 - tableH / 2;

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
  // Dining table: 42"W × 72"L, Chair: 18" diameter
  const tableW = clamp(realIn(42), width * 0.6, 2);
  const tableH = clamp(realIn(72), depth * 0.6, 2);
  const tableX = x + width / 2 - tableW / 2;
  const tableY = y + depth / 2 - tableH / 2;
  const chairR = clamp(realIn(9), 1.5, 0);

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
  // Washer & Dryer: each 27" × 27"
  const unitSize = clamp(realIn(27), (width - pad * 2 - 0.5) / 2, 0);

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

// ── Closet / Walk-in Wardrobe ────────────────────────────────────────────────

export const ClosetFixtures: React.FC<FixtureProps> = ({ x, y, width, depth }) => {
  const pad = 0.5;
  const shelfY = y + pad + 1.5;
  const rodY = shelfY + 1;

  return (
    <g>
      <line x1={x + pad} y1={shelfY} x2={x + width - pad} y2={shelfY}
        stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <line x1={x + pad} y1={rodY} x2={x + width - pad} y2={rodY}
        stroke={FIX_STROKE} strokeWidth={FIX_THIN}
        strokeDasharray={DASH_PATTERNS.HIDDEN} />
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
  if (type === 'closet' || name.includes('closet') || name.includes('w/w') || name.includes('wardrobe')) {
    return <ClosetFixtures x={x} y={y} width={width} depth={depth} />;
  }

  return null;
};
