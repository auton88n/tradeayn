/**
 * Room fixture SVG symbols for architectural floor plans.
 * Kitchen counters, bathroom fixtures, beds, garage outlines, etc.
 * All drawn with thin lines (LINE_WEIGHTS.MEDIUM) to not compete with walls.
 */

import React from 'react';
import { LINE_WEIGHTS, DRAWING_COLORS, DASH_PATTERNS } from './drawingConstants';

const FIX_STROKE = DRAWING_COLORS.DARK_GRAY;
const FIX_WEIGHT = LINE_WEIGHTS.MEDIUM;
const FIX_THIN = LINE_WEIGHTS.THIN;

// ── Kitchen ─────────────────────────────────────────────────────────────────

interface FixtureProps {
  x: number;      // Room top-left X (SVG units)
  y: number;      // Room top-left Y (SVG units)
  width: number;  // Room width (SVG units)
  depth: number;  // Room depth (SVG units)
  hasIsland?: boolean;
}

export const KitchenFixtures: React.FC<FixtureProps> = ({ x, y, width, depth, hasIsland = true }) => {
  const pad = 1; // offset from wall
  const counterD = width * 0.15; // counter depth ~2ft proportional
  const maxCounter = Math.min(counterD, 5);

  return (
    <g>
      {/* L-shaped counter along top and right walls */}
      {/* Top counter */}
      <rect x={x + pad} y={y + pad} width={width - pad * 2} height={maxCounter}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      {/* Right counter */}
      <rect x={x + width - pad - maxCounter} y={y + pad + maxCounter} width={maxCounter} height={depth * 0.4}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />

      {/* Sink (double bowl) on top counter */}
      {(() => {
        const sinkX = x + width * 0.35;
        const sinkY = y + pad + maxCounter * 0.2;
        const bowlW = maxCounter * 0.35;
        const bowlH = maxCounter * 0.5;
        return (
          <>
            <rect x={sinkX} y={sinkY} width={bowlW} height={bowlH}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} rx={0.3} />
            <rect x={sinkX + bowlW + 0.3} y={sinkY} width={bowlW} height={bowlH}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} rx={0.3} />
          </>
        );
      })()}

      {/* Stove (4 burners) on top counter, right of center */}
      {(() => {
        const stoveX = x + width * 0.6;
        const stoveY = y + pad;
        const stoveW = maxCounter * 1.2;
        const stoveH = maxCounter;
        const burnerR = stoveH * 0.15;
        return (
          <>
            <rect x={stoveX} y={stoveY} width={stoveW} height={stoveH}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
            <circle cx={stoveX + stoveW * 0.3} cy={stoveY + stoveH * 0.35} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
            <circle cx={stoveX + stoveW * 0.7} cy={stoveY + stoveH * 0.35} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
            <circle cx={stoveX + stoveW * 0.3} cy={stoveY + stoveH * 0.65} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
            <circle cx={stoveX + stoveW * 0.7} cy={stoveY + stoveH * 0.65} r={burnerR}
              fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
          </>
        );
      })()}

      {/* Refrigerator (filled rectangle, top-left area) */}
      <rect x={x + pad} y={y + pad + maxCounter + 0.5} width={maxCounter * 0.8} height={maxCounter * 1.1}
        fill={DRAWING_COLORS.VERY_LIGHT_GRAY} stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />

      {/* Island (if applicable) */}
      {hasIsland && width > 15 && depth > 12 && (
        <rect x={x + width * 0.3} y={y + depth * 0.5} width={width * 0.35} height={depth * 0.15}
          fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      )}
    </g>
  );
};

// ── Bathroom ────────────────────────────────────────────────────────────────

export const BathroomFixtures: React.FC<FixtureProps & { isEnsuite?: boolean }> = ({
  x, y, width, depth, isEnsuite = false,
}) => {
  const pad = 1;

  // Toilet (against left wall, lower area)
  const toiletX = x + pad;
  const toiletY = y + depth * 0.55;
  const toiletW = Math.min(width * 0.2, 3);
  const toiletH = Math.min(depth * 0.2, 4);

  // Vanity (against top wall)
  const vanityW = isEnsuite ? width * 0.5 : width * 0.35;
  const vanityH = Math.min(depth * 0.12, 2.5);
  const vanityX = x + width * 0.5 - vanityW / 2;

  // Tub or shower (against right wall)
  const tubX = x + width - pad - width * 0.3;
  const tubY = y + pad;
  const tubW = width * 0.3;
  const tubH = depth - pad * 2;

  return (
    <g>
      {/* Toilet — tank rectangle + bowl oval */}
      <rect x={toiletX} y={toiletY} width={toiletW} height={toiletH * 0.3}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <ellipse cx={toiletX + toiletW / 2} cy={toiletY + toiletH * 0.65}
        rx={toiletW * 0.45} ry={toiletH * 0.35}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />

      {/* Vanity + basin */}
      <rect x={vanityX} y={y + pad} width={vanityW} height={vanityH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      {/* Basin oval(s) */}
      {isEnsuite ? (
        <>
          <ellipse cx={vanityX + vanityW * 0.3} cy={y + pad + vanityH * 0.5}
            rx={vanityW * 0.1} ry={vanityH * 0.3}
            fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
          <ellipse cx={vanityX + vanityW * 0.7} cy={y + pad + vanityH * 0.5}
            rx={vanityW * 0.1} ry={vanityH * 0.3}
            fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
        </>
      ) : (
        <ellipse cx={vanityX + vanityW * 0.5} cy={y + pad + vanityH * 0.5}
          rx={vanityW * 0.15} ry={vanityH * 0.3}
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
  // Bed centered in room
  const bedW = isMaster ? Math.min(width * 0.45, 12) : Math.min(width * 0.4, 10);
  const bedH = isMaster ? Math.min(depth * 0.5, 13) : Math.min(depth * 0.45, 12);
  const bedX = x + width / 2 - bedW / 2;
  const bedY = y + depth * 0.35;

  const pillowH = bedH * 0.12;

  return (
    <g>
      {/* Bed frame */}
      <rect x={bedX} y={bedY} width={bedW} height={bedH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      {/* Pillows */}
      <rect x={bedX + bedW * 0.05} y={bedY + bedH * 0.02} width={bedW * 0.42} height={pillowH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} rx={0.5} />
      <rect x={bedX + bedW * 0.53} y={bedY + bedH * 0.02} width={bedW * 0.42} height={pillowH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} rx={0.5} />
      {/* Nightstands */}
      <rect x={bedX - 2.5} y={bedY} width={2} height={2}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <rect x={bedX + bedW + 0.5} y={bedY} width={2} height={2}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
    </g>
  );
};

// ── Garage ───────────────────────────────────────────────────────────────────

export const GarageFixtures: React.FC<FixtureProps> = ({ x, y, width, depth }) => {
  const pad = 2;
  const carW = Math.min(width * 0.4, 10);
  const carH = Math.min(depth * 0.7, 28);
  const numCars = width > 16 ? 2 : 1;

  return (
    <g>
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
  // Sofa along bottom wall
  const sofaW = Math.min(width * 0.5, 14);
  const sofaH = Math.min(depth * 0.12, 4);
  const sofaX = x + width * 0.25;
  const sofaY = y + depth - sofaH - 2;

  return (
    <g>
      {/* Sofa */}
      <rect x={sofaX} y={sofaY} width={sofaW} height={sofaH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      {/* Sofa back */}
      <rect x={sofaX} y={sofaY + sofaH - sofaH * 0.25} width={sofaW} height={sofaH * 0.25}
        fill={DRAWING_COLORS.VERY_LIGHT_GRAY} stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      {/* Coffee table */}
      <rect x={sofaX + sofaW * 0.2} y={sofaY - sofaH * 1.5} width={sofaW * 0.6} height={sofaH * 0.8}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
    </g>
  );
};

export const DiningFixtures: React.FC<FixtureProps> = ({ x, y, width, depth }) => {
  // Dining table centered
  const tableW = Math.min(width * 0.4, 8);
  const tableH = Math.min(depth * 0.35, 10);
  const tableX = x + width / 2 - tableW / 2;
  const tableY = y + depth / 2 - tableH / 2;
  const chairR = Math.min(tableW * 0.08, 0.8);

  return (
    <g>
      <rect x={tableX} y={tableY} width={tableW} height={tableH}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      {/* Chairs — circles around table */}
      {/* Top row */}
      <circle cx={tableX + tableW * 0.3} cy={tableY - chairR * 1.5} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <circle cx={tableX + tableW * 0.7} cy={tableY - chairR * 1.5} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      {/* Bottom row */}
      <circle cx={tableX + tableW * 0.3} cy={tableY + tableH + chairR * 1.5} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <circle cx={tableX + tableW * 0.7} cy={tableY + tableH + chairR * 1.5} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      {/* Side chairs */}
      <circle cx={tableX - chairR * 1.5} cy={tableY + tableH * 0.5} r={chairR}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      <circle cx={tableX + tableW + chairR * 1.5} cy={tableY + tableH * 0.5} r={chairR}
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
      {/* Washer */}
      <rect x={x + pad} y={y + pad} width={unitSize} height={unitSize}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_WEIGHT} />
      <circle cx={x + pad + unitSize / 2} cy={y + pad + unitSize / 2} r={unitSize * 0.3}
        fill="none" stroke={FIX_STROKE} strokeWidth={FIX_THIN} />
      {/* Dryer */}
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

  // Skip very small rooms
  if (width < 5 || depth < 5) return null;

  if (type === 'kitchen') {
    return <KitchenFixtures x={x} y={y} width={width} depth={depth} hasIsland={name.includes('island')} />;
  }
  if (type === 'bathroom' || type === 'ensuite') {
    return <BathroomFixtures x={x} y={y} width={width} depth={depth} isEnsuite={type === 'ensuite'} />;
  }
  if (type === 'bedroom') {
    return <BedroomFixtures x={x} y={y} width={width} depth={depth} isMaster={name.includes('master') || name.includes('primary')} />;
  }
  if (type === 'garage') {
    return <GarageFixtures x={x} y={y} width={width} depth={depth} />;
  }
  if (type === 'living' || type === 'family') {
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
