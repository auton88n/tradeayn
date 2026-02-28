

## Plan: Fix Trading Coach — 3 Changes

### Problem 1: "I couldn't process that" every time
**Root cause**: `useChartCoach.ts` doesn't send `stream: false`. The backend defaults to `stream = true` and returns an SSE text stream. `supabase.functions.invoke()` can't parse SSE as JSON, so `data` is null/empty and the fallback message triggers.

**Fix**: In `src/hooks/useChartCoach.ts`, add `stream: false` to the request body (line 282-293).

### Problem 2: Replace trading-coach prompt with new voice
**Root cause**: Current prompt in `systemPrompts.ts` (lines 161-268) uses the old "active trader" persona. User wants the new, more detailed prompt.

**Fix**: Replace the `if (intent === 'trading-coach')` block in `supabase/functions/ayn-unified/systemPrompts.ts` with the user's new prompt. Key adaptations:
- The new prompt references `context.livePrices`, `context.scanResults`, `context.fileContext` — but those are already injected into the system prompt by `index.ts` (Pionex data at lines 950-1028, scan results at lines 848-878, chart section at lines 841-845). So the `LIVE DATA INJECTED BELOW` section of the new prompt will use what `index.ts` already injects, not duplicate it.
- Keep `getContextualKnowledge(userMessage)` integrated so the AI still gets the 765-line deep knowledge base (candlestick patterns, SMC, Wyckoff, Elliott Wave, harmonics, on-chain, risk management, etc.) linked to its brain contextually.

### Problem 3: Context field mismatch
**Root cause**: Frontend sends `userContext: { ticker, assetType, timeframe }` but the backend reads `context`. The ticker/assetType/timeframe data never reaches the intent routing or prompt building.

**Fix**: In `src/hooks/useChartCoach.ts`, rename `userContext` to `context` in the request body so the backend can read the ticker, assetType, and timeframe for Pionex live price fetching and prompt injection.

---

### Implementation Steps

1. **`src/hooks/useChartCoach.ts`** — Two fixes:
   - Add `stream: false` to request body
   - Rename `userContext` to `context` so backend receives ticker/assetType/timeframe

2. **`supabase/functions/ayn-unified/systemPrompts.ts`** — Replace lines 161-268 with the new trading-coach prompt that includes:
   - The full trader personality and voice rules
   - Market reading framework (macro → structure → levels → price action → indicators → setup → risk)
   - Data honesty rules (use live data when provided, never fabricate)
   - Situation-specific response templates
   - `getContextualKnowledge(userMessage)` for the deep knowledge base
   - Live data injection section that works with what `index.ts` already appends (Pionex prices, scan results, chart context)

### Trading Knowledge Already Linked
The `tradingKnowledgeBase.ts` file (765 lines) already contains deep knowledge that `getContextualKnowledge(userMessage)` injects contextually:
- **Section 1**: 50+ candlestick patterns with success rates
- **Section 2**: Chart patterns with measured move targets
- **Section 3**: Technical indicators (RSI, MACD, Bollinger, Stochastic, ATR, Volume Profile, Fibonacci, Ichimoku, MAs)
- **Section 4**: Smart Money Concepts (order blocks, FVGs, liquidity, market structure, PO3)
- **Section 5**: Wyckoff Method (accumulation/distribution schematics)
- **Section 6**: Elliott Wave Theory
- **Section 7**: Harmonic Patterns (Gartley, Bat, Butterfly, Crab, Shark, Cypher)
- **Section 8**: On-chain & crypto analysis (MVRV, funding rates, OI, liquidations)
- **Section 9**: Risk management (Kelly criterion, leverage, stops, drawdown rules)
- **Section 10**: Market structure & multi-timeframe analysis
- **Section 11**: Market sessions & macro events
- **Section 12**: Scam detection
- **Section 13**: Trading psychology

All of this gets injected into the prompt based on keyword matching in the user's message. The new prompt will retain this link.

