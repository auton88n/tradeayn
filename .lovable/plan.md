## Replace Trading Knowledge Base with Complete Version

### What's changing

Replace the current `tradingKnowledge.ts` (~20 patterns, basic indicators) with the comprehensive knowledge base containing 100+ entries, and update the edge function to use the new retrieval functions.

### Files to modify

**1. `supabase/functions/analyze-trading-chart/tradingKnowledge.ts**` -- Full replacement

Replace entire file with the comprehensive knowledge base containing:

- TypeScript interfaces (`Pattern`, `Indicator`, `Fundamental`)
- All data objects: `CANDLESTICK_PATTERNS` (50+), `CHART_PATTERNS` (30+), `INDICATORS` (15+), `STOCK_FUNDAMENTALS` (10+), `CRYPTO_INDICATORS` (6+), `MARKET_STRUCTURE`, `RISK_MANAGEMENT`
- Retrieval functions: `getFullKnowledgeBase(assetType)`, `getCompactKnowledge(assetType)`, and individual getters for each category

**2. `supabase/functions/analyze-trading-chart/index.ts**` -- Update imports and calls

- Change import from `buildTradingContext` to `getFullKnowledgeBase, getCompactKnowledge`
- Step 3 (Prediction): Replace `buildTradingContext(assetType, timeframe)` with `getFullKnowledgeBase(assetType)` for rich context (~15K tokens)
- Optionally inject `getCompactKnowledge(assetType)` into Step 1 (Vision) prompt as a pattern checklist (~2K tokens)

### Technical Details

**Asset-type filtering:**

- `'stock'` includes stock fundamentals, excludes crypto indicators
- `'crypto'` includes crypto indicators, excludes stock fundamentals
- `'both'` includes everything (fallback when asset type unclear)

**Token budget:**

- `getCompactKnowledge`: ~2,000 tokens (pattern names + types only, for Vision step)
- `getFullKnowledgeBase`: ~15,000 tokens (full rules + explanations, for Prediction step)
- Gemini 2.5 Flash context: 1,000,000 tokens -- plenty of headroom

**Post-deploy:** Redeploy the `analyze-trading-chart` edge function with the updated knowledge base.  
  
Add a **"Success Criteria"** section at the end:

markdown

```markdown
### Success Criteria
After deployment, verify:
1. Stock chart analysis mentions P/E ratio, EPS growth, VWAP
2. Crypto chart analysis mentions funding rate, exchange netflow, MVRV
3. Pattern names in response match knowledge base (no hallucinations)
4. Predictions include stop loss and risk/reward ratios
```