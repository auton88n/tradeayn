
## Fix: Stop AYN from Fabricating Paper Trading Data

AYN currently invents trades and balances from its training data instead of querying the actual database. This fix ensures all performance responses use real data.

### Changes

**1. `supabase/functions/ayn-unified/index.ts`** -- Add database query and context injection

- Add a `getAccountPerformance()` function that queries:
  - `ayn_account_state` for balance, P&L, win rate
  - `ayn_paper_trades` with status IN ('OPEN', 'PARTIAL_CLOSE') for open positions
  - `ayn_paper_trades` with closed statuses for recent trade history (limit 5)
- Before building the system prompt (~line 700), detect if the user's message relates to performance using keyword matching (balance, trades, win rate, P&L, performance, how are you doing, portfolio, etc.)
- If matched, call `getAccountPerformance()` and prepend a system message with the real data, explicitly labeled as "FROM DATABASE -- USE THIS, DO NOT FABRICATE"

**2. `supabase/functions/ayn-unified/systemPrompts.ts`** -- Add anti-fabrication rules to trading-coach prompt

Add to the trading-coach section (after the existing conversation rules):

```
PAPER TRADING ACCOUNT RULES (MANDATORY -- NEVER VIOLATE):
- You have a REAL paper trading account tracked in the database
- When asked about performance, you will receive REAL data injected into context
- NEVER fabricate trades, balances, or P&L numbers
- NEVER invent historical trades that don't exist in context
- If context shows 0 trades: "Account is live. Balance: $10,000. No trades executed yet. Waiting for high-conviction setups."
- If context shows trades: report ONLY the exact numbers from context
- Transparency builds trust. Only report database facts.
```

### Technical Details

The performance query runs in parallel with the existing `Promise.all` block (limit check, user context, chart history) to avoid adding latency. The injected context goes before the system prompt so the AI treats it as ground truth.

Keywords that trigger the query: `performance`, `win rate`, `balance`, `trades`, `p&l`, `profit`, `loss`, `portfolio`, `how are you doing`, `how's your account`, `paper trading`, `track record`, `open positions`.

### Result

- "How are you doing?" returns real balance from `ayn_account_state`
- "Show me your trades" lists actual trades from `ayn_paper_trades` or says "No trades yet"
- AYN can never again fabricate a SOL/USD trade that doesn't exist
