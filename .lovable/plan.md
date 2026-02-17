

## Transform AYN from Coach to Active Trader

### What Changes

Two updates -- one backend (prompt), one frontend (display). No new pages or paper trading system yet (that requires a database to track positions, which is a separate feature).

---

### 1. System Prompt Update

**File: `supabase/functions/ayn-unified/systemPrompts.ts`** (lines 160-329)

Replace the trading-coach intent section with the "active trader" mindset:

- Remove coach/advisor framing ("My recommendation is...", "You might want to consider...")
- Add first-person trader language ("I'm buying X at Y", "I'm risking $X to make $Y")
- Add banned phrases list (no "not financial advice", no "testing mode", no "options for you")
- Add required phrases list (conviction-based language with exact positions)
- Add position sizing discipline (2-3% risk, max 3 concurrent positions)
- Add seasonal awareness (weekend/pre-news restraint)
- Add win/loss ownership language (own losses, celebrate wins with process)
- Add conviction levels (high = 3% max size, medium = 1.5%, low = no trade)
- Keep all existing knowledge base sections (patterns, SMC, Wyckoff, etc.) -- only the framing changes
- Keep the SECURITY section (never reveal internals)
- Remove line 325: `"Always end strategy responses with: Testing mode -- verify all levels..."` and line 8 from CONVERSATION RULES

---

### 2. Chart Analysis Results Display Update

**File: `src/components/dashboard/ChartAnalyzerResults.tsx`**

**Signal card (lines 433-482):** Change from passive "Signal: BUY" to active first-person:
- "I'M BUYING {ticker}" / "I'M SELLING {ticker}" / "WAITING ON {ticker}"
- Show "My Entry", "My Stop" instead of just "Entry", "Stop Loss"
- Add risk/reward in dollar terms ("If wrong: -X% / If right: +Y%")
- Keep confidence display but frame as conviction

**Remove testing disclaimer (lines 630-642):** Delete the entire "TESTING MODE -- HIGH RISK" block at the bottom. Replace with a single subtle line: "Paper trading signals -- track performance over time."

**Bot Config card (lines 236-325):** Update labels from neutral to first-person:
- "Entry Price" becomes "My Entry"
- "Stop Loss" becomes "My Stop"
- Add a "Why I'm Taking This Trade" section using `result.prediction.reasoning`

**Next Steps card (lines 327-360):** Reframe from educational to action-oriented.

---

### What We're NOT Building Yet

- Paper trading performance page (requires new database tables for position tracking, P&L calculation, trade history)
- Live position tracking system
- Weekly performance summaries

These need a proper database schema (positions table, trades table, P&L tracking) and are a separate feature. The prompt changes will make AYN *talk* like an active trader immediately; the tracking infrastructure can follow.

---

### Technical Details

**Files changed:**
1. `supabase/functions/ayn-unified/systemPrompts.ts` -- Replace trading-coach intent (lines 160-329) with active trader prompt
2. `src/components/dashboard/ChartAnalyzerResults.tsx` -- Update signal display, remove testing disclaimer, reframe labels

**Edge functions to redeploy:** `ayn-unified`

**No database changes. No new files. No new APIs.**

