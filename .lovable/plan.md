

## Fix: Make Firecrawl Web Search Work for All Coach Questions

### The Problem

Firecrawl web search only triggers when the user's message contains specific news keywords ("news", "latest", "headlines", "sentiment", "outlook"). For any other question -- "what's happening with Solana?", "why did BTC dump?", "is ETH a good buy?" -- no web search happens, so the AI has no external context and may hallucinate.

The bottleneck is in the **frontend** (`src/hooks/useChartCoach.ts`), where `detectSearchIntent()` only returns a search query if `NEWS_PATTERNS` matches. The backend (`ayn-unified`) already handles whatever `searchQuery` it receives -- it just never gets one for non-news questions.

### The Fix

**1. Broaden search intent detection (`src/hooks/useChartCoach.ts`)**

Replace the narrow `NEWS_PATTERNS` regex with a much broader pattern that triggers a Firecrawl web search for any trading/market/price question -- essentially any question where external data would help.

New patterns to trigger web search:
- Price questions: "what's the price", "how much is", "current price"
- Market questions: "why did X dump/pump", "what's happening with", "is X going up/down"
- Analysis questions: "should I buy/sell", "is X a good buy", "what do you think about"
- News (existing): "news", "latest", "headlines", "sentiment", "outlook"
- General crypto questions: "tell me about", "what is", when paired with a crypto name

Build the search query intelligently based on the detected ticker + question context.

**2. Also detect search intent on the backend (`supabase/functions/ayn-unified/index.ts`)**

As a safety net, if the frontend didn't send a `searchQuery` but the user's message clearly asks about market conditions or a specific coin, the backend should generate a search query itself using the already-detected `mentionedSymbol` and the user's message. This way even if the frontend detection misses something, the backend catches it.

### Technical Details

| File | Change |
|------|--------|
| `src/hooks/useChartCoach.ts` | Broaden `NEWS_PATTERNS` and `detectSearchIntent()` to cover price questions, market analysis, "why" questions, buy/sell questions, and general crypto inquiries. Any message mentioning a crypto name/ticker or asking about market conditions triggers a search query. |
| `supabase/functions/ayn-unified/index.ts` | Add backend fallback: if no `searchQuery` was sent from frontend but `mentionedSymbol` exists or the message asks a market question, generate a search query server-side (e.g., `"${mentionedSymbol} crypto trading analysis today"`) and run Firecrawl search. |

### Updated Search Intent Logic

```text
Frontend (useChartCoach.ts):
  Triggers on:
  - news/latest/headlines/sentiment/outlook (existing)
  - price/how much/current value/worth
  - why did/dump/pump/crash/surge/rally/moon
  - should I buy/sell/hold/enter/exit
  - what's happening/going on with
  - is X bullish/bearish/good/bad
  - tell me about/what is [crypto name]
  - any message containing a known crypto name + question mark

Backend (ayn-unified, fallback):
  If no searchQuery from frontend BUT mentionedSymbol detected:
    -> searchQuery = "{SYMBOL} crypto latest price analysis today"
  If message contains "why" + crypto name:
    -> searchQuery = "{SYMBOL} crypto why price movement today"
```

### After the Fix

```text
User: "What's happening with Solana?"
  -> Frontend detects: "what's happening" + "solana"
  -> searchQuery = "Solana trading news analysis today"
  -> Firecrawl searches -> AI gets real context
  -> Pionex also fetches live SOL price
  -> AI responds with accurate, sourced info

User: "Why did BTC dump?"
  -> Frontend detects: "why did" + "BTC"
  -> searchQuery = "BTC why price drop today"
  -> Firecrawl + Pionex both fire
  -> AI explains with real data

User: "Should I buy ETH?"
  -> Frontend detects: "should I buy" + "ETH"
  -> searchQuery = "ETH buy analysis today"
  -> AI responds with web-sourced analysis + live price

User: "Tell me a joke"
  -> No crypto name, no market pattern
  -> No search triggered (correct behavior)
```
