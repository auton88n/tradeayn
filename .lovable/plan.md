

## Fix: Coach Chat Fetching Wrong Ticker + Hallucinated Prices

### The Problem

When you asked "what's the price of Solana?" in the coach chat, the system:

1. Only fetched live Pionex data for **USDC/USD** (the chart you analyzed), not SOL
2. The AI then **made up** the SOL price ($186.23) instead of the real price (~$86.70)

This happens because the coach only fetches live data for the ticker passed in `context.ticker` (from the analyzed chart), and ignores what the user is actually asking about.

### The Fix

**In `supabase/functions/ayn-unified/index.ts`:**

1. **Detect ticker from user message**: Before the Pionex fetch, scan the user's last message for known crypto names/symbols (e.g., "solana" -> SOL, "bitcoin" -> BTC, "ethereum" -> ETH). If found, use THAT ticker for the Pionex fetch instead of (or in addition to) the chart's ticker.

2. **Fetch both tickers if different**: If the user asks about a different coin than the analyzed chart, fetch live data for BOTH -- the chart ticker (for context) and the asked-about ticker (for the answer).

3. **Add anti-hallucination guard**: Add an explicit instruction in the system prompt: "If the user asks about a ticker you do NOT have live data for, say 'I don't have live data for that coin right now' instead of guessing a price."

### Ticker Detection Logic

```text
Common crypto mappings:
  "solana", "sol" -> SOL_USDT
  "bitcoin", "btc" -> BTC_USDT
  "ethereum", "eth" -> ETH_USDT
  "xrp", "ripple" -> XRP_USDT
  "dogecoin", "doge" -> DOGE_USDT
  "cardano", "ada" -> ADA_USDT
  ... (30+ common mappings)

Scan the user's last message for these terms.
If found and different from ctxTicker, fetch that symbol too.
```

### Technical Details

| File | Change |
|------|--------|
| `supabase/functions/ayn-unified/index.ts` | Add `detectTickerFromMessage()` function that maps common crypto names to Pionex symbols. In the trading-coach block, if the user mentions a different ticker, fetch live Pionex data for that ticker too. Add anti-hallucination instruction to system prompt: "Never fabricate prices. If you lack live data for a coin, say so." |

### After the Fix

```text
User: "What's the price of Solana?"
  -> detectTickerFromMessage("solana") -> "SOL"
  -> Fetch SOL_USDT from Pionex -> real price ~$86.70
  -> AI responds with accurate data

User: "Is my BTC chart still valid?"
  -> Chart context: BTC/USDT (already correct)
  -> Fetch BTC_USDT from Pionex
  -> AI responds with live BTC data

User: "What about some random altcoin?"
  -> No match found
  -> AI says "I don't have live data for that coin"
  -> No hallucinated price
```

