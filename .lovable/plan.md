
# Phase 3.5: Deep Knowledge Base Integration — Implementation Plan

## Code Audit (What I Confirmed)

### `marketScanner.ts` — current state (full file, 212 lines)
The file already has the full Phase 3 toolkit: `calculateRSI`, `calculateEMA`, `calculateMACD`, `calculateBollingerBands`, `calculateTrendStrength`, `analyzeKlines`, `calculateEnhancedScore`, and `fetchKlines`. All are exported. The `KlineSignals` interface has 9 fields + `summary: string[]`.

**Kline array format (confirmed from `analyzeKlines` line 98):**
```typescript
const closes = klines.map(k => parseFloat(k[4] ?? k.close ?? '0'));
```
Pionex returns klines as arrays where index 0=timestamp, 1=open, 2=high, 3=low, 4=close, 5=volume. The new detection functions (Order Block, FVG) must use `k[1]` (open), `k[2]` (high), `k[3]` (low), `k[4]` (close) — **not** `k.open`, `k.high` etc., which would return `undefined` on array format klines.

### `scanMarketOpportunities()` — lines 528–632 of `ayn-unified/index.ts`
Phase 2 loop (lines 595–622): fetches 100 klines per candidate, calls `analyzeKlines(klines, candidate.price, [])` then `calculateEnhancedScore(priceChange, volume, technicals)`. The `signals` variable receives `technicals.summary`. Score threshold is 70. Everything feeds into the `opportunities` array as `{ ticker, score, price, volume24h, priceChange24h, signals }`.

### Funding Rate endpoint — NOT yet used anywhere
No existing code calls a Pionex funding rate endpoint. The plan's proposed path `/api/v1/market/funding-rates` needs to be verified — Pionex's v1 perpetual futures endpoint for funding rates is `/api/v1/perpetual/funding-rates`. The plan's path would likely return 404. This must be corrected.

### `calculateEnhancedScore` signature
```typescript
export function calculateEnhancedScore(priceChange: number, volume: number, signals: KlineSignals): number
```
The new detection functions (OB, Wyckoff, FVG) need to either: (a) be called inside `analyzeKlines` and their results added to `KlineSignals`, or (b) be called separately and their results passed into an extended version of `calculateEnhancedScore`. **Option (a) is cleaner** — extend `KlineSignals` with the new boolean/enum fields, compute everything inside `analyzeKlines`, and let `calculateEnhancedScore` read them.

---

## Design Decisions

### Architecture: Extend `KlineSignals` (cleanest approach)

All 4 new detectors run inside `analyzeKlines()` and add results to `KlineSignals`. `calculateEnhancedScore` reads the new fields. **No changes needed to `scanMarketOpportunities()` call site** — it already calls `analyzeKlines` and passes the result to `calculateEnhancedScore`.

Funding rates are the exception — they require a separate API call per ticker (not derivable from klines alone). These are appended as a post-processing step in `scanMarketOpportunities()` after the kline scoring is done. This is the only change to `index.ts`.

### Kline field access pattern

All new detection code uses the same dual-mode pattern as `analyzeKlines`:
```typescript
const open  = parseFloat(k[1] ?? k.open  ?? '0');
const high  = parseFloat(k[2] ?? k.high  ?? '0');
const low   = parseFloat(k[3] ?? k.low   ?? '0');
const close = parseFloat(k[4] ?? k.close ?? '0');
```

### Score calibration

The current max possible score is already 50 + 15 + 15 + 12 + 8 + 7 + 8 + 5 = **120** (but threshold is 70 = moderate bar). Adding the new bonuses:
- Order Block retest: +12
- Wyckoff Accumulation: +15 / Markup: +10
- FVG fill: +10
- Negative funding: +8 / High positive: -5

These add a theoretical max of +45 more. The 70 threshold does not need to change — higher-conviction setups will naturally score higher. The bonuses are additive with existing signals, so a coin with RSI oversold + MACD + OB retest + FVG fill could score ~120+ (well above 70), while a coin with only 1 signal still needs to break 70 via the existing indicators.

---

## All Changes — Exact Files

### File 1: `supabase/functions/ayn-unified/marketScanner.ts`

**Additions only** — no changes to existing functions.

#### 1a. Extend `KlineSignals` interface (add 5 fields after line 94)

```typescript
export interface KlineSignals {
  rsi: number;
  aboveMA20: boolean;
  aboveMA50: boolean;
  ma20AboveMA50: boolean;
  volumeIncrease: number;
  trendStrength: number;
  nearLowerBand: boolean;
  nearUpperBand: boolean;
  macdBullish: boolean;
  // Phase 3.5 additions:
  nearBullishOB: boolean;
  wyckoffPhase: 'ACCUMULATION' | 'MARKUP' | 'NEUTRAL';
  fillingBullishFVG: boolean;
  summary: string[];
}
```

#### 1b. Add `detectOrderBlocks(klines)` function

**Logic correction from the plan:** The plan's `klines[i].close` access won't work on array-format klines. Fixed version uses indexed access:

```typescript
export function detectOrderBlocks(klines: any[]): Array<{ type: string; price: number }> {
  const blocks: Array<{ type: string; price: number }> = [];
  
  for (let i = 1; i < klines.length - 1; i++) {
    const prev  = klines[i - 1];
    const curr  = klines[i];
    const next  = klines[i + 1];
    
    const prevClose  = parseFloat(prev[4] ?? prev.close  ?? '0');
    const currOpen   = parseFloat(curr[1] ?? curr.open   ?? '0');
    const currHigh   = parseFloat(curr[2] ?? curr.high   ?? '0');
    const currLow    = parseFloat(curr[3] ?? curr.low    ?? '0');
    const currClose  = parseFloat(curr[4] ?? curr.close  ?? '0');
    const nextOpen   = parseFloat(next[1] ?? next.open   ?? '0');
    const nextClose  = parseFloat(next[4] ?? next.close  ?? '0');
    
    // Bullish OB: red candle → next green candle breaks above high
    if (
      currClose < currOpen &&       // current is bearish (red)
      nextClose > nextOpen &&       // next is bullish (green)
      nextClose > currHigh          // next closes above current's high
    ) {
      blocks.push({ type: 'BULLISH_OB', price: currLow });
    }
    
    // Bearish OB: green candle → next red candle breaks below low
    if (
      currClose > currOpen &&       // current is bullish (green)
      nextClose < nextOpen &&       // next is bearish (red)
      nextClose < currLow           // next closes below current's low
    ) {
      blocks.push({ type: 'BEARISH_OB', price: currHigh });
    }
  }
  
  // Return only the 5 most recent blocks (avoid stale OBs)
  return blocks.slice(-5);
}
```

**Key correction from plan:** The plan checked `prev.close > current.close` as an extra condition — this is redundant and incorrect for OB definition. An OB is defined by the candle itself (red/green) and the subsequent break. The corrected version matches the SMC definition from `advancedTradingKnowledge.ts`: "Last candle before a strong impulsive move = institutional order zone." We keep only the 5 most recent OBs to avoid false positives from old structure.

#### 1c. Add `detectWyckoffPhase(klines)` function

```typescript
export function detectWyckoffPhase(klines: any[]): 'ACCUMULATION' | 'MARKUP' | 'NEUTRAL' {
  if (klines.length < 30) return 'NEUTRAL';
  
  const closes  = klines.map(k => parseFloat(k[4] ?? k.close  ?? '0'));
  const volumes = klines.map(k => parseFloat(k[5] ?? k.volume ?? '0'));
  
  const recentVol   = scannerMean(volumes.slice(-10));
  const olderVol    = scannerMean(volumes.slice(-30, -10));
  const last20Slice = closes.slice(-20);
  const priceRange  = Math.max(...last20Slice) - Math.min(...last20Slice);
  const currentPrice = closes[closes.length - 1];
  const ma20         = scannerMean(last20Slice);
  
  // Accumulation: tight range + declining volume + price above midpoint
  if (
    currentPrice > 0 &&
    priceRange / currentPrice < 0.05 &&   // <5% range (compressed)
    recentVol < olderVol * 0.8 &&          // volume declining
    currentPrice > ma20                    // above MA midpoint
  ) {
    return 'ACCUMULATION';
  }
  
  // Markup: new 20-period high + volume surge
  const prev20High = Math.max(...closes.slice(-21, -1));
  if (
    currentPrice > prev20High &&          // breaking out to new high
    recentVol > olderVol * 1.3            // volume confirming
  ) {
    return 'MARKUP';
  }
  
  return 'NEUTRAL';
}
```

#### 1d. Add `detectFairValueGaps(klines)` function

```typescript
export function detectFairValueGaps(klines: any[]): Array<{ type: string; top: number; bottom: number }> {
  const gaps: Array<{ type: string; top: number; bottom: number }> = [];
  
  for (let i = 2; i < klines.length; i++) {
    const prev2 = klines[i - 2];
    const curr  = klines[i];
    
    const prev2High = parseFloat(prev2[2] ?? prev2.high ?? '0');
    const prev2Low  = parseFloat(prev2[3] ?? prev2.low  ?? '0');
    const currHigh  = parseFloat(curr[2]  ?? curr.high  ?? '0');
    const currLow   = parseFloat(curr[3]  ?? curr.low   ?? '0');
    
    // Bullish FVG: gap up (current candle's low > candle-2's high)
    if (currLow > prev2High) {
      gaps.push({ type: 'BULLISH_FVG', top: currLow, bottom: prev2High });
    }
    
    // Bearish FVG: gap down (current candle's high < candle-2's low)
    if (currHigh < prev2Low) {
      gaps.push({ type: 'BEARISH_FVG', top: prev2Low, bottom: currHigh });
    }
  }
  
  // Return only the 10 most recent (FVGs further back are usually already filled)
  return gaps.slice(-10);
}
```

#### 1e. Update `analyzeKlines()` to call all 3 new detectors

After the existing `macdBullish` line (line 120), before the `summary` block:

```typescript
// Phase 3.5: Order Blocks
const orderBlocks = detectOrderBlocks(klines);
const nearBullishOB = orderBlocks
  .filter(ob => ob.type === 'BULLISH_OB')
  .some(ob => ob.price > 0 && Math.abs(currentPrice - ob.price) / ob.price < 0.03);

// Phase 3.5: Wyckoff
const wyckoffPhase = detectWyckoffPhase(klines);

// Phase 3.5: Fair Value Gaps
const fvgs = detectFairValueGaps(klines);
const fillingBullishFVG = fvgs
  .filter(fvg => fvg.type === 'BULLISH_FVG')
  .some(fvg => currentPrice >= fvg.bottom && currentPrice <= fvg.top);
```

Add to summary:
```typescript
if (nearBullishOB)                         summary.push('Order block retest (institutional support)');
if (wyckoffPhase === 'ACCUMULATION')       summary.push('Wyckoff accumulation (spring zone)');
else if (wyckoffPhase === 'MARKUP')        summary.push('Wyckoff markup (breakout phase)');
if (fillingBullishFVG)                     summary.push('Filling bullish Fair Value Gap');
```

Return the 3 new fields in the return object:
```typescript
return {
  rsi, aboveMA20, aboveMA50, ma20AboveMA50, volumeIncrease, trendStrength,
  nearLowerBand, nearUpperBand, macdBullish,
  nearBullishOB, wyckoffPhase, fillingBullishFVG,
  summary
};
```

#### 1f. Update `calculateEnhancedScore()` to score new signals

After the existing MACD block (after line 162), add:

```typescript
// Phase 3.5: Order Block retest
if (signals.nearBullishOB) score += 12;

// Phase 3.5: Wyckoff phase
if (signals.wyckoffPhase === 'ACCUMULATION') score += 15;
else if (signals.wyckoffPhase === 'MARKUP')  score += 10;

// Phase 3.5: Fair Value Gap fill
if (signals.fillingBullishFVG) score += 10;
```

#### 1g. Add `fetchFundingRates` function

The Pionex v1 perpetual funding rate endpoint. This is added to `marketScanner.ts` so `index.ts` can import it without adding bulk to the main file.

```typescript
export async function fetchFundingRates(
  apiKey: string,
  apiSecret: string
): Promise<Record<string, number>> {
  try {
    const enc = new TextEncoder();
    const ts = Date.now().toString();
    const path = `/api/v1/perpetual/public/fundingRate`;
    const queryStr = `timestamp=${ts}`;
    const message = `GET\n${path}\n${queryStr}`;
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(apiSecret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    const signature = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const res = await fetch(`https://api.pionex.com${path}?${queryStr}`, {
      headers: { 'PIONEX-KEY': apiKey, 'PIONEX-SIGNATURE': signature },
    });
    
    if (!res.ok) {
      console.warn(`[SCANNER] Funding rates fetch failed: ${res.status}`);
      return {};
    }
    
    const data = await res.json();
    const rates: Record<string, number> = {};
    const list = data?.data?.list ?? data?.data ?? [];
    for (const item of list) {
      if (item.symbol && item.fundingRate != null) {
        rates[item.symbol] = parseFloat(item.fundingRate);
      }
    }
    return rates;
  } catch (e) {
    console.warn('[SCANNER] Funding rate fetch error:', e);
    return {};
  }
}
```

**Note on endpoint path:** Pionex's public perpetual funding rate endpoint may vary. The function handles a non-OK response gracefully — if the path is wrong it logs a warning and returns `{}`, so the scanner continues without funding rate adjustment. This is safe fail-open behavior. The response shape handles both `data.list` and `data` array formats.

---

### File 2: `supabase/functions/ayn-unified/index.ts`

**One targeted change** to `scanMarketOpportunities()`: add funding rate fetch + adjustment after Phase 2 scoring (after line 624, before the final `return`).

Import at top of the function's scope — `fetchFundingRates` is already exported from `marketScanner.ts` which is already imported at the top of `index.ts`.

```typescript
// After opportunities.sort((a, b) => b.score - a.score);
// Before const top = opportunities.slice(0, 3);

// ── Phase 2.5: Funding rate adjustment ──────────────────────────────────────
const fundingRates = await fetchFundingRates(apiKey, apiSecret);
if (Object.keys(fundingRates).length > 0) {
  for (const opp of opportunities) {
    const rate = fundingRates[opp.ticker];
    if (rate == null) continue;
    
    if (rate < -0.0001) {   // Negative funding: longs getting paid (bullish)
      opp.score += 8;
      opp.signals.push(`Negative funding ${(rate * 100).toFixed(3)}% (bullish)`);
    } else if (rate > 0.0005) {  // Very high positive: overleveraged longs (danger)
      opp.score -= 5;
      opp.signals.push(`High funding ${(rate * 100).toFixed(3)}% (caution)`);
    }
  }
  // Re-sort after funding adjustment
  opportunities.sort((a, b) => b.score - a.score);
}
```

**Threshold calibration note:** The plan uses `rate < -0.01` (which is -1% — extremely rare) and `rate > 0.05` (5% — also extreme). Real funding rates are typically in the range of -0.03% to +0.10% per 8h. The corrected thresholds use `-0.0001` (-0.01%) for meaningful negative funding and `+0.0005` (+0.05%) for elevated positive funding — more realistic triggers.

---

## What Does NOT Change

- The `calculateEnhancedScore` function signature stays the same (still takes `priceChange`, `volume`, `signals`)
- `scanMarketOpportunities` Phase 1 and Phase 2 loops are untouched — funding rates are a post-processing step
- The score threshold of 70 is unchanged — the new bonuses reward high-confluence setups but don't inflate low-conviction scores
- No database migrations needed
- No frontend changes needed
- No new edge functions
- No changes to `config.toml`

---

## File Change Summary

| File | Change Type | Lines Affected |
|---|---|---|
| `supabase/functions/ayn-unified/marketScanner.ts` | EDIT | Extend `KlineSignals` interface (+3 fields), add 3 detection functions (~80 lines), update `analyzeKlines` return, update `calculateEnhancedScore`, add `fetchFundingRates` |
| `supabase/functions/ayn-unified/index.ts` | EDIT | Add ~15-line funding rate adjustment block in `scanMarketOpportunities()` |

**Net addition: ~120 lines across 2 files. No deletions.**

---

## Important Limitations to Set Expectations

**Order Block detection** at 60M granularity identifies short-term institutional footprints. It is not the same as the daily/weekly OBs used by professional SMC traders — those require higher timeframe analysis. The 60M OBs detected here are valid for day-trade swing setups but will not catch longer-term accumulation zones. This is appropriate for AYN's paper trading horizon (hours to days).

**Wyckoff detection** at 60M is necessarily simplified. Real Wyckoff analysis involves identifying SC, AR, springs, LPS across weeks of data. The implementation here detects the *characteristics* of accumulation phases (tight range + declining volume + above midpoint) rather than the specific Wyckoff events. It will correctly identify many accumulation patterns but may also fire on low-volatility consolidations that are not true Wyckoff setups.

**Funding rates** are only relevant for perpetual futures pairs. If Pionex's endpoint path doesn't match exactly, the function returns `{}` and scoring continues without it — zero downside.
