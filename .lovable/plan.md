

## Three Critical Fixes

### Fix 1: Unify Performance Dashboards

**Problem:** `PerformanceDashboard.tsx` (embedded in Chart Analyzer) lacks realtime subscriptions, the AI Decision Log, and the `allTrades` query that the standalone `Performance.tsx` page has.

**Solution:** Replace the entire `PerformanceDashboard.tsx` content with the logic from `Performance.tsx`, minus the page-level wrapper (no Helmet, no Back button, no navigate). This means:

- Add Supabase realtime channels for `ayn_paper_trades` (all events) and `ayn_account_state` (UPDATE)
- Add `isLive` state with pulsing green dot on "Open Positions" header
- Add `allTrades` query (fetches last 50 trades for the decision log)
- Import and render `AIDecisionLog` component after Recent Trades
- Keep 30s polling as fallback alongside realtime
- Clean up channels on unmount

**File:** `src/components/trading/PerformanceDashboard.tsx`

---

### Fix 2: Strengthen Anti-Fabrication (Broaden Keyword Detection)

**Problem:** The `performanceKeywords` array in `ayn-unified/index.ts` (line 755) misses common conversational phrases like "how are you", "how is it going", "doing well", etc. When a user says "tell me about your trading", the keyword check fails, no DB data is fetched, and the AI fabricates numbers.

**Solution:** Two changes:

**A. Expand keyword list** (line 755-758):
Add these keywords:
- `'how are you'`, `'how is'`, `'how you doing'`, `'how\'s it going'`, `'doing'`, `'going'`, `'status'`, `'results'`, `'show me'`, `'tell me about'`, `'your trading'`, `'how much'`, `'winning'`, `'losing'`

**B. Always inject performance data for trading-coach intent** (line 760):
Change the condition from requiring keyword match to always fetching when `intent === 'trading-coach'`. The overhead is minimal (3 parallel queries, cached by Supabase connection pooling), and it eliminates all false negatives.

```
const isPerformanceQuery = intent === 'trading-coach';
```

This ensures "Tell me about your trading", "how are you doing?", or any trading-coach query gets real DB data injected.

**File:** `supabase/functions/ayn-unified/index.ts` (lines 755-761)

---

### Fix 3: End-to-End Verification

This is a manual test flow, not a code change. After deploying Fixes 1 and 2:

1. Go to Chat tab, send "do paper testing"
2. Verify scanner runs with real Pionex data and AI picks a token
3. Switch to Performance tab -- trade should appear within 1-2 seconds (realtime)
4. Send "how are you doing?" in chat
5. Verify AI reports real balance and open positions from database
6. Wait 5 minutes for `ayn-monitor-trades` cron to check prices
7. Verify any TP/SL hits update the Performance tab instantly

---

### Technical Summary

| File | Change |
|------|--------|
| `src/components/trading/PerformanceDashboard.tsx` | Add realtime subscriptions, `isLive` indicator, `allTrades` fetch, `AIDecisionLog` component |
| `supabase/functions/ayn-unified/index.ts` | Line 760: change `isPerformanceQuery` to always true for `trading-coach` intent |

Total: 2 files modified, no new tables, no new edge functions.

