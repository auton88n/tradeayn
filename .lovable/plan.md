
## Critical Frontend Cleanup — Implementation Plan

### What the Audit Confirmed (Exact Line Counts)

- `src/pages/Performance.tsx` — 406 lines, entirely self-contained with its own `StatsCard`, `OpenPositionCard` (no Close button), `TradeRow`, `loadData`, and 2 realtime channels. Missing: kill switch, manual close, circuit breakers, activity timeline.
- `src/components/trading/PerformanceDashboard.tsx` — 529 lines, the correct authoritative component. Has kill switch, manual close (`onClose` prop), circuit breakers, activity timeline, `toast`-ready structure.
- `src/components/dashboard/ChartAnalyzer.tsx` — 266 lines, confirmed orphaned. The search shows it is only referenced by itself internally. `ChartUnifiedChat.tsx` replaced it. Safe to delete.
- `supabase/functions/ayn-daily-snapshot/index.ts` — Uses `SUPABASE_SERVICE_ROLE_KEY` internally (correct). The cron job migration uses the anon key in the HTTP header, which is a security gap but low priority since the function itself uses service role for DB access. The real risk is unauthorized triggering.
- `PerformanceDashboard` is exported as `default` and used correctly in `ChartAnalyzerPage.tsx` already.

---

### All 8 Changes — Exact Files and Lines

#### Change 1: Replace `src/pages/Performance.tsx` (CRITICAL — eliminates 366 lines)

Replace the entire 406-line file with a ~40-line shell that:
- Keeps the `Helmet`, `ArrowLeft` back button (navigate to `/`), page title, live indicator
- Reads `isLive` from the `PerformanceDashboard`'s realtime — instead of duplicating the subscription, expose a simple `onLiveChange` callback prop on `PerformanceDashboard` OR just remove the live dot from the standalone page header (it's displayed inside `PerformanceDashboard` itself already)
- Renders `<PerformanceDashboard />` with no `onNavigateToHistory` prop (not needed on this page — there is no History tab to jump to)
- The `PerformanceDashboard` component already has its own loading state, kill switch, activity timeline, close buttons, and circuit breakers

The new `Performance.tsx` will be approximately:
```
import Helmet, ArrowLeft, useNavigate
import PerformanceDashboard from '@/components/trading/PerformanceDashboard'

export default function Performance() {
  const navigate = useNavigate()
  return (
    <>
      <Helmet title="AYN Trading Performance" />
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
        <Button ghost onClick={() => navigate('/')}>← Back</Button>
        <div>
          <h1>AYN's Trading Performance</h1>
          <p>Live paper trading account — full transparency</p>
        </div>
        <PerformanceDashboard />
      </div>
    </>
  )
}
```

This automatically gives `/performance` the kill switch button, manual close buttons, circuit breaker banner, activity timeline, and all future improvements.

#### Change 2: Delete `src/components/dashboard/ChartAnalyzer.tsx` (CRITICAL — removes 266 lines)

The file is confirmed unused — no other file imports it. `ChartUnifiedChat.tsx` replaced it when the page was refactored to a conversational interface. Delete with no other changes needed.

#### Change 3: Fix equity curve threshold in `PerformanceDashboard.tsx` line 418 (HIGH)

Change `{snapshots.length > 1 &&` to `{snapshots.length > 0 &&`. A single-point Recharts AreaChart renders a dot on the line, which is valid and informative. Add a helper note below the chart: `"Updated daily at midnight UTC"`. This makes the equity curve visible immediately since the first snapshot has already been seeded.

#### Change 4: Fix equity curve threshold in `Performance.tsx` line 288 (HIGH — will be moot after Change 1)

This is automatically resolved once `Performance.tsx` is replaced in Change 1. No separate action needed.

#### Change 5: Add kill switch toast feedback in `PerformanceDashboard.tsx` lines 296–310 (HIGH)

In `handleKillSwitch`:
- **On success**: after `await loadData()`, add `toast.success(isKillSwitchActive ? 'Kill switch deactivated. Trading resumed.' : 'Kill switch activated. All trading halted.')`
- **On error**: in the catch block, add `toast.error(\`Kill switch failed: ${err.message || 'Unknown error'}\`, { duration: 10000 })`

Import `toast` from `'sonner'` at the top of the file (it's already installed — used throughout the app via `src/components/ui/sonner.tsx`).

#### Change 6: Add setup performance empty state in `PerformanceDashboard.tsx` lines 499–522 (HIGH)

Change the `{setupPerf.length > 0 && ...}` conditional to always render the card. When `setupPerf.length === 0`, show a muted placeholder inside the card:
```
"Setup performance will appear after the first trade closes.
Win rates and profit factors are tracked per setup type automatically."
```

#### Change 7: Fix close error persistence in `PerformanceDashboard.tsx` lines 313–322 (MEDIUM)

After `await loadData()` completes successfully in `handleCloseTrade`, add `setCloseError(null)`. Also add a `toast.success('Position closed successfully')` on success and `toast.error(...)` in the catch so the user gets feedback beyond the inline error banner.

#### Change 8: Add auth context banner on `/performance` for unauthenticated visitors (MEDIUM)

In the new `Performance.tsx`, use `useAuth()` to check if the user is logged in. If not, show a subtle info banner above the dashboard:
```
"This is AYN's live paper trading performance. Sign in to start your own trading analysis."
```
This preserves the public nature of the page while giving unauthenticated users context.

---

### Cron Job Security Note

The `ayn-daily-snapshot` function uses `SUPABASE_SERVICE_ROLE_KEY` **internally** for all database operations — this is correct and safe. The cron job calling it with the anon key in the Authorization header only means any user with the anon key (which is public by design in Supabase) can trigger the snapshot on demand. Since the function is idempotent (upsert, not insert), a user triggering it manually would only update today's snapshot to the current values — no data corruption. This is a low-severity issue. To fix it properly would require adding a `CRON_SECRET` environment variable and checking it in the function, which is a separate task outside this critical cleanup pass.

---

### Implementation Order

1. Delete `ChartAnalyzer.tsx` — no dependencies, zero risk
2. Replace `Performance.tsx` — eliminates all duplicate code in one edit
3. Fix equity curve threshold in `PerformanceDashboard.tsx` (line 418)
4. Add kill switch toast feedback in `PerformanceDashboard.tsx` (lines 296–310)
5. Add setup performance empty state in `PerformanceDashboard.tsx` (lines 499–522)
6. Fix close error + add success toast in `PerformanceDashboard.tsx` (lines 313–322)
7. Add auth banner in new `Performance.tsx`

---

### Net Change

| File | Before | After | Delta |
|---|---|---|---|
| `src/pages/Performance.tsx` | 406 lines | ~45 lines | -361 |
| `src/components/dashboard/ChartAnalyzer.tsx` | 266 lines | deleted | -266 |
| `src/components/trading/PerformanceDashboard.tsx` | 529 lines | ~565 lines | +36 |
| **Total** | | | **-591 lines** |

No new dependencies needed. No database changes. No edge function changes. All 8 changes are pure frontend.
