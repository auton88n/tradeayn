/**
 * Trading Knowledge Base
 * Expert-level patterns, indicators, and context injected into AI prompts
 * for more accurate chart analysis and predictions.
 */

// ─── Chart Patterns ───
export const CHART_PATTERNS = {
  bullish: [
    { name: 'Ascending Triangle', reliability: 'high', signal: 'Breakout above resistance', description: 'Higher lows converging toward flat resistance. Volume typically decreases during formation and spikes on breakout.' },
    { name: 'Inverse Head & Shoulders', reliability: 'high', signal: 'Reversal from downtrend', description: 'Three troughs with the middle being deepest. Neckline break confirms reversal. Volume increases on right shoulder and breakout.' },
    { name: 'Bull Flag', reliability: 'high', signal: 'Continuation after strong move up', description: 'Sharp upward move (pole) followed by slight downward consolidation (flag). Breakout continues the prior trend.' },
    { name: 'Cup and Handle', reliability: 'high', signal: 'Bullish continuation', description: 'U-shaped cup followed by a small downward drift (handle). Breakout above handle resistance triggers buy signal.' },
    { name: 'Double Bottom', reliability: 'high', signal: 'Reversal at support', description: 'Two roughly equal lows forming a "W" shape. Neckline break confirms reversal. Higher volume on second bottom is ideal.' },
    { name: 'Falling Wedge', reliability: 'medium', signal: 'Bullish reversal or continuation', description: 'Converging trendlines both sloping downward. Breakout above upper trendline signals upside move.' },
    { name: 'Morning Star', reliability: 'medium', signal: 'Bullish reversal (3-candle)', description: 'Long bearish candle, small-bodied candle (gap down), then long bullish candle closing above midpoint of first.' },
    { name: 'Bullish Engulfing', reliability: 'medium', signal: 'Reversal at support', description: 'Small bearish candle followed by large bullish candle that completely engulfs the prior body.' },
    { name: 'Three White Soldiers', reliability: 'medium', signal: 'Strong bullish momentum', description: 'Three consecutive long bullish candles with small wicks, each opening within the prior candle body.' },
  ],
  bearish: [
    { name: 'Descending Triangle', reliability: 'high', signal: 'Breakdown below support', description: 'Lower highs converging toward flat support. Breakdown with volume confirms bearish move.' },
    { name: 'Head & Shoulders', reliability: 'high', signal: 'Reversal from uptrend', description: 'Three peaks with middle being highest. Neckline break with volume confirms downside target equal to pattern height.' },
    { name: 'Bear Flag', reliability: 'high', signal: 'Continuation after strong move down', description: 'Sharp downward move (pole) followed by slight upward consolidation (flag). Breakdown continues the prior downtrend.' },
    { name: 'Double Top', reliability: 'high', signal: 'Reversal at resistance', description: 'Two roughly equal highs forming an "M" shape. Neckline break confirms reversal.' },
    { name: 'Rising Wedge', reliability: 'medium', signal: 'Bearish reversal or continuation', description: 'Converging trendlines both sloping upward. Breakdown below lower trendline signals downside.' },
    { name: 'Evening Star', reliability: 'medium', signal: 'Bearish reversal (3-candle)', description: 'Long bullish candle, small-bodied candle (gap up), then long bearish candle closing below midpoint of first.' },
    { name: 'Bearish Engulfing', reliability: 'medium', signal: 'Reversal at resistance', description: 'Small bullish candle followed by large bearish candle that completely engulfs the prior body.' },
    { name: 'Three Black Crows', reliability: 'medium', signal: 'Strong bearish momentum', description: 'Three consecutive long bearish candles with small wicks, each opening within the prior candle body.' },
  ],
  neutral: [
    { name: 'Symmetrical Triangle', reliability: 'medium', signal: 'Breakout in either direction', description: 'Converging trendlines with lower highs and higher lows. Direction of breakout determines signal.' },
    { name: 'Rectangle/Range', reliability: 'medium', signal: 'Breakout from consolidation', description: 'Price bouncing between horizontal support and resistance. Trade the range or wait for breakout.' },
    { name: 'Doji', reliability: 'low', signal: 'Indecision / potential reversal', description: 'Open and close nearly equal. Context matters: at key levels it signals reversal, mid-trend it signals pause.' },
  ],
};

// ─── Technical Indicators Guide ───
export const INDICATOR_GUIDE = {
  rsi: {
    name: 'RSI (Relative Strength Index)',
    range: '0-100',
    overbought: 70,
    oversold: 30,
    interpretation: [
      'Above 70: Overbought — potential pullback or reversal',
      'Below 30: Oversold — potential bounce or reversal',
      '50 level: Acts as dynamic support/resistance for trend direction',
      'Divergence: Price makes new high but RSI doesn\'t = bearish divergence (and vice versa)',
      'Hidden divergence: Confirms trend continuation',
    ],
  },
  macd: {
    name: 'MACD (Moving Average Convergence Divergence)',
    interpretation: [
      'MACD line crosses above signal line: Bullish crossover (buy signal)',
      'MACD line crosses below signal line: Bearish crossover (sell signal)',
      'Histogram increasing: Momentum strengthening in current direction',
      'Zero line cross: Confirms trend direction change',
      'Divergence from price: Strong reversal signal',
    ],
  },
  movingAverages: {
    name: 'Moving Averages',
    key_periods: [9, 20, 50, 100, 200],
    interpretation: [
      'Golden Cross (50 MA crosses above 200 MA): Strong long-term bullish signal',
      'Death Cross (50 MA crosses below 200 MA): Strong long-term bearish signal',
      'Price above all MAs: Strong uptrend',
      'Price below all MAs: Strong downtrend',
      'MAs acting as dynamic support/resistance',
      'EMA 9/21 crossover: Short-term trend changes',
    ],
  },
  volume: {
    name: 'Volume Analysis',
    interpretation: [
      'Rising price + rising volume: Healthy trend, likely to continue',
      'Rising price + falling volume: Weakening trend, potential reversal',
      'Falling price + rising volume: Strong selling pressure, bearish',
      'Volume spike at key level: Confirms breakout/breakdown validity',
      'Low volume consolidation before breakout: Coiled spring effect',
    ],
  },
  bollinger: {
    name: 'Bollinger Bands',
    interpretation: [
      'Price touching upper band: May be overextended, watch for reversal',
      'Price touching lower band: May be oversold, watch for bounce',
      'Band squeeze (narrow): Low volatility, big move incoming',
      'Band expansion: High volatility breakout in progress',
      'Walking the bands: Strong trend confirmation',
    ],
  },
  fibonacci: {
    name: 'Fibonacci Retracement',
    key_levels: [0.236, 0.382, 0.5, 0.618, 0.786],
    interpretation: [
      '0.382: Shallow pullback in strong trends',
      '0.5: Psychological midpoint, common bounce level',
      '0.618: Golden ratio, strongest retracement level',
      '0.786: Deep pullback, last defense before trend reversal',
      'Extensions (1.272, 1.618): Profit target levels',
    ],
  },
};

// ─── Asset-Specific Knowledge ───
export const ASSET_CONTEXT = {
  stock: {
    factors: ['Earnings reports', 'Sector rotation', 'Market cap / institutional ownership', 'Dividend schedule', 'FDA approvals (biotech)', 'Options expiry (OpEx)'],
    timing: 'Pre-market (4-9:30 AM ET), Regular (9:30 AM-4 PM ET), After-hours (4-8 PM ET)',
    volatility_note: 'Highest volatility at market open (first 30 min) and close (last 15 min)',
  },
  crypto: {
    factors: ['Bitcoin dominance', 'On-chain metrics', 'Funding rates', 'Exchange inflows/outflows', 'Whale wallet movements', 'DeFi TVL changes', 'Regulatory news'],
    timing: '24/7 market — Sunday open and Friday close often see volatility',
    volatility_note: 'Crypto is 3-5x more volatile than stocks. Wider stop losses needed.',
  },
  forex: {
    factors: ['Central bank interest rates', 'GDP data', 'Employment (NFP)', 'CPI/inflation', 'Trade balance', 'Geopolitical events'],
    timing: 'London (3-12 PM UTC), New York (1-10 PM UTC), Asian (12-9 AM UTC)',
    volatility_note: 'Most volatile during London-New York overlap (1-5 PM UTC)',
  },
  commodity: {
    factors: ['Supply/demand reports', 'Weather events', 'OPEC decisions (oil)', 'USD strength', 'Seasonal patterns', 'Inventory data'],
    timing: 'Follows specific exchange hours, seasonal cycles matter greatly',
    volatility_note: 'Commodities trend strongly — breakout strategies work well',
  },
  index: {
    factors: ['Broad economic data', 'Sector earnings', 'Fed decisions', 'Yield curve', 'VIX (fear index)', 'Put/call ratio'],
    timing: 'Regular market hours, futures trade nearly 24/5',
    volatility_note: 'Indices tend to trend up over time (survivorship bias). Mean-reversion works on short timeframes.',
  },
};

// ─── Timeframe Context ───
export const TIMEFRAME_CONTEXT: Record<string, { 
  holdingPeriod: string; 
  noiseLevel: string; 
  bestIndicators: string[];
  tradingStyle: string;
}> = {
  '1m': { holdingPeriod: 'Seconds to minutes', noiseLevel: 'Very high', bestIndicators: ['VWAP', 'EMA 9/21', 'Volume'], tradingStyle: 'Scalping' },
  '5m': { holdingPeriod: 'Minutes to hours', noiseLevel: 'High', bestIndicators: ['EMA 9/21', 'RSI', 'VWAP'], tradingStyle: 'Scalping / Day trading' },
  '15m': { holdingPeriod: 'Hours', noiseLevel: 'Moderate', bestIndicators: ['EMA 20/50', 'RSI', 'MACD'], tradingStyle: 'Day trading' },
  '1H': { holdingPeriod: 'Hours to days', noiseLevel: 'Low-moderate', bestIndicators: ['EMA 20/50', 'RSI', 'MACD', 'Bollinger'], tradingStyle: 'Day / Swing trading' },
  '4H': { holdingPeriod: 'Days to weeks', noiseLevel: 'Low', bestIndicators: ['EMA 50/200', 'RSI', 'MACD', 'Fibonacci'], tradingStyle: 'Swing trading' },
  'Daily': { holdingPeriod: 'Weeks to months', noiseLevel: 'Very low', bestIndicators: ['SMA 50/200', 'RSI', 'MACD', 'Volume profile'], tradingStyle: 'Swing / Position trading' },
  'Weekly': { holdingPeriod: 'Months', noiseLevel: 'Minimal', bestIndicators: ['SMA 50/200', 'RSI monthly', 'Long-term trendlines'], tradingStyle: 'Position trading / Investing' },
  'Monthly': { holdingPeriod: 'Months to years', noiseLevel: 'Minimal', bestIndicators: ['Long-term MAs', 'Secular trends'], tradingStyle: 'Long-term investing' },
};

// ─── Risk Management Rules ───
export const RISK_RULES = [
  'Never risk more than 1-2% of total capital per trade',
  'Always set a stop loss before entering a trade',
  'Risk/reward ratio should be at least 1:2 (ideally 1:3)',
  'Don\'t add to losing positions (no averaging down without a plan)',
  'Take partial profits at key levels (scale out)',
  'Respect the trend — counter-trend trades need higher conviction',
  'Volume confirms price action — low volume moves are suspect',
  'Multiple timeframe alignment increases trade probability',
  'News can invalidate technical setups — always check the calendar',
  'Correlation: Don\'t stack correlated positions (e.g., multiple tech stocks)',
];

/**
 * Build a context string for the AI prompt based on detected asset and timeframe
 */
export function buildTradingContext(assetType: string, timeframe: string): string {
  const asset = ASSET_CONTEXT[assetType as keyof typeof ASSET_CONTEXT];
  const tf = TIMEFRAME_CONTEXT[timeframe];
  
  let context = '## Trading Knowledge Context\n\n';
  
  if (tf) {
    context += `### Timeframe: ${timeframe}\n`;
    context += `- Trading Style: ${tf.tradingStyle}\n`;
    context += `- Typical Holding Period: ${tf.holdingPeriod}\n`;
    context += `- Noise Level: ${tf.noiseLevel}\n`;
    context += `- Best Indicators: ${tf.bestIndicators.join(', ')}\n\n`;
  }
  
  if (asset) {
    context += `### Asset Type: ${assetType}\n`;
    context += `- Key Factors: ${asset.factors.join(', ')}\n`;
    context += `- Active Hours: ${asset.timing}\n`;
    context += `- Note: ${asset.volatility_note}\n\n`;
  }
  
  context += '### Risk Management\n';
  context += RISK_RULES.slice(0, 5).map(r => `- ${r}`).join('\n');
  
  return context;
}
