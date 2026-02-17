
## Expand Trading Knowledge Base + Pionex-Based Market Intelligence

### Overview

Two upgrades, zero new external APIs:

1. **9 knowledge modules** added to a new file, with a condensed summary injected into the trading-coach prompt
2. **Market intelligence extracted from existing Pionex data** (price momentum, volume analysis, session timing, scam flags) injected into the chart analysis prediction prompt
3. **Basic scam detection** using Pionex data + ticker heuristics
4. **Market Context UI card** in chart analysis results

---

### Files

**NEW: `supabase/functions/analyze-trading-chart/advancedTradingKnowledge.ts`**

9 exported string constants containing the full educational knowledge:
- `SCAM_DETECTION_RULES` -- liquidity, contract, tokenomics, social, chart red flags, verification checklist
- `SMART_MONEY_CONCEPTS` -- order blocks, FVGs, liquidity pools, BOS, CHOCH, premium/discount zones, inducement
- `FUNDING_RATES_KNOWLEDGE` -- funding rates, open interest, liquidation levels, long/short ratio
- `TOKEN_UNLOCK_KNOWLEDGE` -- vesting schedules, impact sizing, trading around unlocks
- `WYCKOFF_METHOD` -- accumulation/distribution schematics (Phases A-E), volume analysis
- `ADVANCED_RISK_MANAGEMENT` -- math of loss, position sizing rules, portfolio heat, Kelly criterion, leverage rules
- `MARKET_CYCLES_ADVANCED` -- Bitcoin halving cycles, psychology stages, altseason identification, macro factors
- `SESSION_AND_NEWS_KNOWLEDGE` -- trading sessions, CPI/FOMC/NFP events, crypto events, weekend effects
- `MULTI_TIMEFRAME_KNOWLEDGE` -- timeframe hierarchy, top-down process, confluence setups

Also exports `getAdvancedKnowledgeSummary()` returning a condensed version (key decision rules only) for the trading-coach prompt, keeping token usage manageable.

---

**UPDATE: `supabase/functions/ayn-unified/systemPrompts.ts`**

In the `trading-coach` intent (line 160-265):
- Import `getAdvancedKnowledgeSummary` from the analyze-trading-chart function folder (or inline the condensed summary to avoid cross-function imports -- since edge functions can't import across function boundaries, the summary will be inlined directly as a string constant in systemPrompts.ts)
- Append the condensed advanced knowledge after the existing "Risk Management" section and before "CONVERSATION RULES"
- Add a "GENIUS TRADING MINDSET" section encouraging creative reasoning: synthesize multiple data points, find contrarian edges, combine concepts for novel strategies, sector rotation awareness

The condensed summary covers key decision rules from all 9 modules (not the full walls of text), roughly 150-200 lines of concise rules.

---

**UPDATE: `supabase/functions/analyze-trading-chart/index.ts`**

Two additions:

1. **`extractMarketIntelligence(pionexData)`** function (after line 318, before Step 2):
   - Extracts 24h price change and momentum signal from existing Pionex ticker data
   - Volume analysis from Pionex volume data (surge/decline detection)
   - Session timing (Asian/London/NY) from current UTC time -- no API needed
   - Weekend warning -- no API needed
   - Returns a text block for prompt injection

2. **`checkScamSignals(ticker, pionexData)`** function:
   - Checks volume < $100K (liquidity risk)
   - Checks price change > 50% in 24h (manipulation pattern)
   - Checks suspicious ticker patterns (MOON, SAFE, ELON, etc.)
   - Returns `{ isHighRisk, severity, flags }` object

3. In `generatePrediction()` (line 420):
   - Accept new `marketIntelligence` string parameter
   - Inject it at the top of the prompt before the technical analysis section
   - If scam flags detected, append warning to prompt

4. In main handler (line 798-802):
   - After `fetchPionexData`, call `extractMarketIntelligence(pionexData)` and `checkScamSignals(ticker, pionexData)`
   - Pass `marketIntelligence` to `generatePrediction()`
   - Include `marketContext` and `scamWarning` in the response object

---

**UPDATE: `src/types/chartAnalyzer.types.ts`**

Add:
```text
interface MarketContext {
  priceChange24h: number | null;
  volume24h: number | null;
  session: string;
  isWeekend: boolean;
  volatility: 'high' | 'normal';
}

interface ScamWarning {
  isHighRisk: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: string[];
}
```

Add to `ChartAnalysisResult`:
```text
marketContext?: MarketContext;
scamWarning?: ScamWarning;
```

---

**UPDATE: `src/components/dashboard/ChartAnalyzerResults.tsx`**

Add a "Market Context" card at the top of results (before the signal card) when `result.marketContext` is present:
- 2x2 grid: 24h Change (color-coded), 24h Volume, Current Session, Volatility
- Scam warning alert banner if `result.scamWarning?.isHighRisk`

---

### Technical Notes

- **No cross-function imports:** The advanced knowledge file lives in the `analyze-trading-chart` folder but the trading-coach prompt is in `ayn-unified`. Since edge functions can't import across boundaries, the condensed knowledge summary will be inlined as a constant in `systemPrompts.ts`.
- **Bundle size:** The full 9-module knowledge file is large but only used by the analyze-trading-chart function as reference. The systemPrompts.ts gets only the condensed summary.
- **No new APIs, no new secrets, no database changes.**
- **Edge functions to redeploy:** `analyze-trading-chart`, `ayn-unified`
