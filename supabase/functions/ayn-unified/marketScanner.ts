// marketScanner.ts — Technical indicator helpers for the enhanced market scanner
// Imported by ayn-unified/index.ts

export function scannerMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

export function scannerStdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = scannerMean(arr);
  return Math.sqrt(scannerMean(arr.map(n => Math.pow(n - avg, 2))));
}

export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  const slice = closes.slice(-(period + 1));
  for (let i = 1; i < slice.length; i++) {
    const change = slice[i] - slice[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateEMA(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calculateMACD(closes: number[]): { macd: number; signal: number } {
  if (closes.length < 26) return { macd: 0, signal: 0 };
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdValue = ema12 - ema26;

  // Build 9-bar MACD history for signal line
  const macdHistory: number[] = [];
  const startIdx = Math.max(0, closes.length - 9);
  for (let i = startIdx; i < closes.length; i++) {
    const slice = closes.slice(0, i + 1);
    if (slice.length < 26) { macdHistory.push(0); continue; }
    macdHistory.push(calculateEMA(slice, 12) - calculateEMA(slice, 26));
  }
  const signal = calculateEMA(macdHistory, 9);
  return { macd: macdValue, signal };
}

export function calculateBollingerBands(closes: number[], period = 20, multiplier = 2): {
  upper: number; middle: number; lower: number;
} {
  if (closes.length < period) {
    const last = closes[closes.length - 1] ?? 0;
    return { upper: last * 1.05, middle: last, lower: last * 0.95 };
  }
  const slice = closes.slice(-period);
  const middle = scannerMean(slice);
  const std = scannerStdDev(slice);
  return {
    upper: middle + std * multiplier,
    middle,
    lower: middle - std * multiplier,
  };
}

export function calculateTrendStrength(closes: number[]): number {
  if (closes.length < 20) return 50;
  const slice = closes.slice(-20);
  const ma20 = scannerMean(slice);
  const aboveMA = slice.filter(c => c > ma20).length;
  return (aboveMA / 20) * 100;
}

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
  summary: string[];
}

export function analyzeKlines(klines: any[], currentPrice: number, recentVolumes: number[]): KlineSignals {
  const closes = klines.map(k => parseFloat(k[4] ?? k.close ?? '0'));
  const volumes = klines.map(k => parseFloat(k[5] ?? k.volume ?? '0'));

  const rsi = calculateRSI(closes, 14);

  const ma20 = scannerMean(closes.slice(-20));
  const ma50 = closes.length >= 50 ? scannerMean(closes.slice(-50)) : scannerMean(closes);
  const aboveMA20 = currentPrice > ma20;
  const aboveMA50 = currentPrice > ma50;
  const ma20AboveMA50 = ma20 > ma50;

  // Volume: compare last 10 klines vs prior 20
  const recentVol = scannerMean(volumes.slice(-10));
  const olderVol = scannerMean(volumes.slice(-30, -10));
  const volumeIncrease = olderVol > 0 ? ((recentVol - olderVol) / olderVol) * 100 : 0;

  const trendStrength = calculateTrendStrength(closes);
  const bb = calculateBollingerBands(closes, 20, 2);
  const nearLowerBand = currentPrice < bb.lower * 1.05;
  const nearUpperBand = currentPrice > bb.upper * 0.95;

  const macdData = calculateMACD(closes);
  const macdBullish = macdData.macd > macdData.signal;

  const summary: string[] = [];
  if (rsi >= 30 && rsi <= 45) summary.push(`RSI ${rsi.toFixed(0)} — oversold recovering (buy zone)`);
  else if (rsi >= 50 && rsi <= 65) summary.push(`RSI ${rsi.toFixed(0)} — bullish momentum`);
  else if (rsi > 75) summary.push(`RSI ${rsi.toFixed(0)} — overbought (caution)`);
  if (ma20AboveMA50 && aboveMA20) summary.push('Golden cross (bullish trend)');
  if (volumeIncrease > 50) summary.push(`Volume surge +${volumeIncrease.toFixed(0)}%`);
  if (macdBullish) summary.push('MACD bullish');
  if (nearLowerBand) summary.push('Near Bollinger lower band (oversold)');

  return { rsi, aboveMA20, aboveMA50, ma20AboveMA50, volumeIncrease, trendStrength, nearLowerBand, nearUpperBand, macdBullish, summary };
}

export function calculateEnhancedScore(
  priceChange: number,
  volume: number,
  signals: KlineSignals
): number {
  let score = 50;

  // RSI zones
  if (signals.rsi >= 30 && signals.rsi <= 45) score += 15;
  else if (signals.rsi >= 50 && signals.rsi <= 65) score += 10;
  else if (signals.rsi > 75) score -= 15;
  else if (signals.rsi < 25) score -= 10;

  // Trend (MA alignment)
  if (signals.aboveMA20 && signals.aboveMA50 && signals.ma20AboveMA50) score += 15;
  else if (signals.aboveMA20 && signals.ma20AboveMA50) score += 10;
  else if (!signals.aboveMA20 && !signals.aboveMA50) score -= 10;

  // Volume confirmation
  if (signals.volumeIncrease > 50) score += 12;
  else if (signals.volumeIncrease > 25) score += 8;
  else if (signals.volumeIncrease < -30) score -= 8;

  // Bollinger Bands
  if (signals.nearLowerBand) score += 8;
  else if (signals.nearUpperBand) score -= 5;

  // MACD
  if (signals.macdBullish) score += 7;

  // Trend strength
  if (signals.trendStrength > 70) score += 8;
  else if (signals.trendStrength < 30) score -= 5;

  // Liquidity bonus
  if (volume > 1000000) score += 5;

  // Overextended penalty
  if (priceChange > 20) score -= 15;

  return score;
}

export async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number,
  apiKey: string,
  apiSecret: string
): Promise<any[] | null> {
  try {
    const enc = new TextEncoder();
    const ts = Date.now().toString();
    const path = `/api/v1/market/klines`;
    const queryStr = `symbol=${symbol}&interval=${interval}&limit=${limit}&timestamp=${ts}`;
    const message = `GET\n${path}\n${queryStr}`;
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(apiSecret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    const res = await fetch(`https://api.pionex.com${path}?${queryStr}`, {
      headers: { 'PIONEX-KEY': apiKey, 'PIONEX-SIGNATURE': signature },
    });

    if (!res.ok) {
      console.warn(`[SCANNER] Klines fetch failed for ${symbol}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data?.data?.klines ?? data?.data ?? null;
  } catch (e) {
    console.warn(`[SCANNER] Klines error for ${symbol}:`, e);
    return null;
  }
}
