

## Make Analysis Output Concise and Scannable

### Problem

The analysis report is too long and wordy. Users want quick, actionable info -- not an essay. The current output has verbose reasoning paragraphs, redundant sections (Trade Setup duplicates Bot Config data), and long "What To Do Next" / discipline text that buries the actual signal.

### Changes

#### 1. Shorten AI Reasoning Output

**File:** `supabase/functions/analyze-trading-chart/index.ts` (line 439)

Change the reasoning instruction from:
- `"Direct analysis with exact levels. 3-5 sentences."`

To:
- `"2 sentences max. State the signal and the key reason. No fluff."`

Also shorten these fields in the JSON schema:
- `entryTiming.reason`: "One sentence." (was open-ended)
- `entryTiming.aggressive` / `conservative`: "One line with price levels only"
- `actionablePlan` fields: "One line each"
- `confidenceBreakdown.explanation`: "One sentence."
- `riskManagement`: "One sentence."
- `disciplineReminders` fields: Shorten instructions to "Max 10 words each"

Redeploy `analyze-trading-chart` edge function.

#### 2. Restructure Results UI for Scannability

**File:** `src/components/dashboard/ChartAnalyzerResults.tsx`

**Quick View card (lines 379-418):**
- Keep signal badge, ticker, timeframe, confidence -- these are good
- Truncate reasoning display to 2 lines with a "Show more" toggle instead of showing the full paragraph
- Move confidence breakdown into its own collapsible section instead of always showing inline

**Remove "Trade Setup" section (lines 469-498):**
- This is now redundant with the Bot Configuration card which shows the same entry/SL/TP data in a better format
- Delete the entire Trade Setup section

**Simplify "What To Do Next" (lines 301-361):**
- For WAIT: show just the alert prices as a compact 2-column row, drop the "Don't Watch the Chart" essay
- For BUY/SELL: show just 2 steps (Review Setup + Set Stop Loss) instead of 4

**Collapse "Trading Discipline" into the Bot Config card:**
- Instead of a separate section, add a single-line risk reminder at the bottom of BotConfigCard
- Remove the standalone discipline section

**Keep these sections as-is (they're already collapsible):**
- Bot Configuration -- core value
- Entry Timing -- useful
- Pattern Analysis -- useful for deeper dives
- Technical Analysis -- useful for deeper dives
- News Sentiment -- useful
- Psychology Check -- useful

#### 3. Default-Expand Bot Config

**File:** `src/components/dashboard/ChartAnalyzerResults.tsx` (line 366)

Change initial expanded state to auto-open Bot Configuration:
- `useState<Record<string, boolean>>({ botconfig: true })`

This ensures the most actionable section (signal + entry + SL + TP) is visible immediately without clicking.

### Summary of UI Changes

**Before (10 sections, verbose):**
1. Quick View (with long reasoning + inline confidence breakdown)
2. Bot Configuration (collapsed)
3. Entry Timing (collapsed)
4. Psychology Check (collapsed)
5. Trade Setup (collapsed) -- REDUNDANT
6. Pattern Analysis (collapsed)
7. Technical Analysis (collapsed)
8. News Sentiment (collapsed)
9. Trading Discipline (collapsed) -- LOW VALUE standalone
10. What To Do Next (collapsed) -- TOO WORDY

**After (8 sections, concise):**
1. Quick View (2-line reasoning, confidence breakdown moved to collapsible)
2. Bot Configuration (AUTO-EXPANDED -- the main value)
3. Entry Timing (collapsed)
4. Psychology Check (collapsed)
5. Pattern Analysis (collapsed)
6. Technical Analysis (collapsed)
7. News Sentiment (collapsed)
8. What To Do Next (compact, 2-3 lines max)

Trade Setup removed (redundant). Discipline merged into Bot Config as one-liner.

### Files

| File | Change |
|------|--------|
| `supabase/functions/analyze-trading-chart/index.ts` | Shorten reasoning to 2 sentences, compress all text fields |
| `src/components/dashboard/ChartAnalyzerResults.tsx` | Remove Trade Setup section, simplify NextSteps, merge discipline into BotConfig, auto-expand botconfig, truncate reasoning |

