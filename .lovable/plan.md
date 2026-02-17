

## Separate Chart Analyzer History + Unified AYN View

### What's happening now

The Chart Analyzer page has 3 tabs: **Chat**, **History**, **Performance**.

- **History** tab shows chart analysis results from the `chart_analyses` table (uploaded screenshots with technical analysis, patterns, signals).
- **Performance** tab shows AYN's paper trades from `ayn_paper_trades` (autonomous trades, P&L, equity curve).

The problem: these two are disconnected. Chart analyses live in History, paper trades live in Performance, and there's no way to see the full picture of what AYN has been doing.

### The Plan

**1. Keep Chart Analyzer History as-is (no changes)**

The History tab already works well -- it shows chart analyses with filters, search, comparison, and detail views. This stays untouched.

**2. Add "Activity Timeline" section to Performance tab**

Add a new card at the top of the Performance dashboard (before stats) that shows a unified timeline of ALL AYN activity:

- **Chart analyses** (from `chart_analyses` -- "Analyzed BTC/USDT 4H chart -- BULLISH 78%")
- **Trades opened** (from `ayn_paper_trades` -- "Opened BUY SOL_USDT @ $186.50")
- **Trades closed** (from `ayn_paper_trades` -- "Closed SOL_USDT +2.3% ($23.00)")

Each entry shows a timestamp, icon, and one-line summary. This gives a chronological view of everything AYN has done -- analyses and trades together.

**3. Link chart analyses to trades**

When clicking a chart analysis entry in the timeline, navigate to the History tab and select that item. When clicking a trade entry, scroll to it in the trades list below.

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| `src/components/trading/PerformanceDashboard.tsx` | Add `chart_analyses` query (last 20), merge with trades into a sorted timeline, render new `ActivityTimeline` card at the top |
| `src/components/trading/ActivityTimeline.tsx` (new) | Renders the unified chronological list of analyses + trades with icons and one-line summaries |
| `src/pages/ChartAnalyzerPage.tsx` | Accept a callback from Performance tab to switch to History tab and select a specific analysis |

**Data flow:**
- Query `chart_analyses` (last 20, ordered by `created_at` desc)
- Query `ayn_paper_trades` (last 50, already fetched as `allTrades`)
- Merge both arrays by timestamp into a single sorted timeline
- Render each with appropriate icon: camera icon for analyses, arrow-up for buys, arrow-down for sells, check for closed trades

**No database changes needed.** Both tables already exist with all required columns.

### Result

- Chart Analyzer keeps its own dedicated History tab for deep-diving into chart analyses
- Performance tab gets a unified "Activity Timeline" showing everything AYN has done chronologically
- You can see the full story: "AYN analyzed BTC chart -> found bullish setup -> opened trade -> hit TP1"
