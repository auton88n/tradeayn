/**
 * Post-Processing Validation Layer
 * Intercepts AI-generated trading responses and redacts any fabricated
 * dollar amounts, tickers, or trade claims before they reach the user.
 */

export interface ValidationContext {
  accountBalance: number;
  startingBalance: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  openPositions: Array<{ ticker: string; entryPrice: number; pnl: number }>;
  recentTrades: Array<{ ticker: string; entryPrice: number; exitPrice: number; pnl: number }>;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedResponse?: string;
  violations: string[];
}

// Words that match the ticker regex but are NOT trade tickers
const EXCLUDED_WORDS = new Set([
  'USD', 'API', 'FAQ', 'PDF', 'URL', 'UTC', 'GMT', 'KYC', 'AML',
  'RSI', 'SMA', 'EMA', 'ATH', 'ATL', 'OB', 'FVG', 'SMC', 'ICT',
  'TP', 'SL', 'RR', 'PNL', 'ROI', 'AYN', 'AI', 'LLM', 'GPT',
  'CEX', 'DEX', 'TVL', 'APY', 'APR', 'LP', 'DCA', 'HODL',
  'MACD', 'BB', 'CCI', 'ADX', 'OBV', 'VWAP', 'NA', 'USD',
  'BUY', 'SELL', 'LONG', 'SHORT', 'OPEN', 'STOP', 'YES', 'NO',
]);

// Phrases that prove the AI invented a trade (only checked when totalTrades === 0)
const FABRICATION_PHRASES = [
  /\brecent trade\b/i,
  /\blast trade\b/i,
  /\bprevious trade\b/i,
  /\bentered\s+(?:at|@)\s*$/i,
  /\bshorted\s+(?:at|@)\s*$/i,
  /\bbought\s+(?:at|@)\s*$/i,
  /\bclosed\s+(?:at|@)\s*$/i,
  /\bexit(?:ed)?\s+(?:at|@)\s*$/i,
  /\bopened\s+(?:a|the)?\s*(?:long|short|position)\b/i,
  /\bclosed\s+(?:a|the|my)?\s*(?:long|short|position)\b/i,
  /\btrade\s+(?:result|outcome|closed|opened)\b/i,
];

// Ticker regex — 2–7 uppercase letters, not followed by lowercase (avoids matching acronyms mid-sentence)
const TICKER_REGEX = /\b([A-Z]{2,7})\b/g;

// Trade-context words — ticker must appear near one of these to count as a trade mention
const TRADE_CONTEXT_WORDS = [
  /\b(?:bought|sold|shorted|longed|entered|exited|opened|closed|trade[d]?|position|signal)\b/i,
];

function isNearTradeContext(text: string, index: number): boolean {
  const window = text.slice(Math.max(0, index - 60), index + 60);
  return TRADE_CONTEXT_WORDS.some(r => r.test(window));
}

export function validateTradingResponse(
  aiResponse: string,
  ctx: ValidationContext
): ValidationResult {
  const violations: string[] = [];

  // ── 1. Build allowed dollar amounts ──────────────────────────────────────
  const allowedDollars = new Set<number>();
  const add = (n: number) => allowedDollars.add(Math.round(n * 100) / 100);

  add(ctx.accountBalance);
  add(ctx.startingBalance);
  add(Math.abs(ctx.accountBalance - ctx.startingBalance)); // total P&L dollars

  for (const pos of ctx.openPositions) {
    add(pos.entryPrice);
    add(Math.abs(pos.pnl));
  }
  for (const trade of ctx.recentTrades) {
    add(trade.entryPrice);
    add(trade.exitPrice);
    add(Math.abs(trade.pnl));
  }

  // ── 2. Check dollar amounts ───────────────────────────────────────────────
  const dollarRegex = /\$([0-9,]+(?:\.[0-9]{1,2})?)/g;
  let match: RegExpExecArray | null;

  // Reset lastIndex before iterating
  dollarRegex.lastIndex = 0;
  while ((match = dollarRegex.exec(aiResponse)) !== null) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    if (isNaN(amount)) continue;

    // Allow very small amounts (fees, etc.) without flagging
    if (amount < 1) continue;

    const isAllowed = Array.from(allowedDollars).some(
      allowed => Math.abs(amount - allowed) <= 0.50
    );

    if (!isAllowed) {
      violations.push(`Fabricated dollar amount: $${amount} (not in database)`);
      // Limit noise — stop after 3 dollar violations
      if (violations.length >= 3) break;
    }
  }

  // ── 3. Check fabrication phrases (only when 0 trades) ────────────────────
  if (ctx.totalTrades === 0 && ctx.openPositions.length === 0) {
    for (const pattern of FABRICATION_PHRASES) {
      if (pattern.test(aiResponse)) {
        violations.push('Mentioned trade activity when database shows 0 trades');
        break; // one violation is enough for this category
      }
    }
  }

  // ── 4. Check ticker mentions in trade context (only when 0 trades) ────────
  if (ctx.totalTrades === 0 && ctx.openPositions.length === 0) {
    TICKER_REGEX.lastIndex = 0;
    const seenTickers = new Set<string>();
    while ((match = TICKER_REGEX.exec(aiResponse)) !== null) {
      const ticker = match[1];
      if (EXCLUDED_WORDS.has(ticker)) continue;
      if (seenTickers.has(ticker)) continue;
      if (ticker.length < 2 || ticker.length > 7) continue;

      // Only flag if ticker appears near trade-context language
      if (isNearTradeContext(aiResponse, match.index)) {
        seenTickers.add(ticker);
        violations.push(`Fabricated ticker in trade context: ${ticker} (no trades in database)`);
        if (violations.length >= 5) break;
      }
    }
  }

  // ── 5. No violations → pass through unchanged ────────────────────────────
  if (violations.length === 0) {
    return { isValid: true, violations: [] };
  }

  // ── 6. Violations found → build sanitized replacement ────────────────────
  const pnlDollars = ctx.accountBalance - ctx.startingBalance;
  const pnlSign = pnlDollars >= 0 ? '+' : '';
  const pnlPct = ctx.startingBalance > 0
    ? ((pnlDollars / ctx.startingBalance) * 100).toFixed(2)
    : '0.00';

  let sanitizedResponse: string;

  if (ctx.totalTrades === 0) {
    sanitizedResponse =
      `My paper trading account is live with $${ctx.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.

No trades executed yet — I'm being selective and waiting for high-conviction setups that meet my 65%+ confidence threshold. I never force trades just to show activity.

You can track my performance live on the Performance page.`;
  } else {
    const posLines = ctx.openPositions.length > 0
      ? ctx.openPositions.map(p =>
          `- ${p.ticker}: ${p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}% unrealized`
        ).join('\n')
      : 'None';

    const tradeLines = ctx.recentTrades.length > 0
      ? ctx.recentTrades.slice(0, 5).map(t =>
          `- ${t.ticker}: Entry $${t.entryPrice.toFixed(2)} → Exit $${t.exitPrice.toFixed(2)} (${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}%)`
        ).join('\n')
      : 'No closed trades yet';

    sanitizedResponse =
      `Account Balance: $${ctx.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pnlSign}${pnlPct}%)

Total Trades: ${ctx.totalTrades}
Win Rate: ${ctx.winRate.toFixed(1)}% (${ctx.winningTrades}W / ${ctx.losingTrades}L)

Open Positions:
${posLines}

Recent Closed Trades:
${tradeLines}`;
  }

  return {
    isValid: false,
    sanitizedResponse,
    violations,
  };
}
