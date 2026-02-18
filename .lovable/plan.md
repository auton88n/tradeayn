
# Rebuild: AYN Trade — Chart Analysis as the Brand

## What You Want

Strip everything down to the Chart Analysis product. Make it the brand. One focused app where:
- The **landing page** sells the Chart Analyzer
- The **app** IS the Chart Analyzer (Chat, History, Performance tabs)
- Everything else (services pages, engineering, ticketing, civil engineering, grading, compliance, etc.) is deleted

---

## What Gets Kept (Zero Changes to Logic)

| Kept As-Is | Why |
|---|---|
| `ChartUnifiedChat.tsx` | The core chat + upload analysis UI |
| `ChartHistoryTab.tsx` + all sub-components | History tab |
| `PerformanceDashboard.tsx` | Performance tab |
| `ChartCoachSidebar.tsx` | Session sidebar |
| `supabase/functions/analyze-trading-chart` | AI analysis engine |
| `supabase/functions/ayn-open-trade`, `ayn-close-trade`, `ayn-monitor-trades` | Paper trading backend |
| `useChartAnalyzer`, `useChartHistory`, `useChartCoach` hooks | All data hooks |
| Auth system (`AuthModal`, Supabase auth) | Login/signup |
| `ThemeToggle`, `LanguageSwitcher`, shared UI | Utilities |

---

## What Gets Deleted / Stripped

| Removed | Replacement |
|---|---|
| All services pages (`/services/*`) | Gone |
| Engineering, Grading, Compliance, Support pages | Gone |
| Old `LandingPage.tsx` (800+ lines with services sections, AI employee mockups, etc.) | New focused landing page |
| Old `Hero.tsx` with the Brain eye animation | Replaced with a chart-focused hero |
| `Dashboard.tsx` (the catch-all authenticated dashboard) | Gone — auth now routes directly to `/chart-analyzer` |
| `Index.tsx` complex routing logic | Simplified: unauthenticated = landing, authenticated = redirect to `/chart-analyzer` |
| Service mockup components (`MobileMockup`, `DeviceMockups`, `AutomationFlowMockup`, `AIEmployeeMockup`, `EngineeringMockup`, `TicketingMockup`) | Gone |
| All services page routes in `App.tsx` | Removed |
| `src/pages/services/` folder | Gone |

---

## New Architecture

```text
/ (root)
├── Unauthenticated → New Landing Page (sells Chart Analyzer)
└── Authenticated → Redirect to /chart-analyzer

/chart-analyzer (the app)
├── Tab: Chat      — upload chart, get AI analysis
├── Tab: History   — past analyses
└── Tab: Performance — AYN paper trading stats
```

---

## New Landing Page Design

A single-page, focused brand landing that replaces the entire old `LandingPage.tsx`:

**Section 1 — Hero**
- Brand name: **AYN Trade**
- Tagline: *"Upload a chart. Get a professional trading analysis in seconds."*
- Big CTA: "Analyze Your First Chart →" (opens auth modal)
- A static chart screenshot/mockup visual on the right

**Section 2 — How It Works (3 steps)**
1. Upload any trading chart screenshot
2. AYN's AI reads the technicals (RSI, EMA, MACD, Wyckoff, etc.)
3. Get a full analysis: signal, entry, stop loss, take profits, R:R

**Section 3 — What You Get**
- Analysis confidence score
- Entry price & order type
- Stop Loss with percentage
- Take Profit 1 & 2 levels
- Risk:Reward ratio
- Invalidation condition
- AI coaching follow-up questions

**Section 4 — AYN Paper Trading**
- Small section: "AYN also paper-trades its own signals — live in the Performance tab"
- Shows win rate / trades taken callout

**Section 5 — CTA Footer**
- "Start analyzing free" button
- Theme toggle + language switcher

---

## Files to Create/Modify

| File | Action |
|---|---|
| `src/components/LandingPage.tsx` | **Rewrite** — new focused Chart Analyzer brand landing |
| `src/components/landing/Hero.tsx` | **Rewrite** — chart analysis hero (no eye animation) |
| `src/pages/Index.tsx` | **Simplify** — unauthenticated = landing, authenticated = navigate to `/chart-analyzer` |
| `src/App.tsx` | **Trim routes** — remove all services/engineering/ticketing/compliance/grading routes |
| `src/pages/services/` (all files) | **Delete** — all 10 service pages gone |
| `src/pages/EngineeringWorkspacePage.tsx` | **Delete** |
| `src/pages/CompliancePage.tsx` | **Delete** |
| `src/pages/AIGradingDesigner.tsx` | **Delete** |
| `src/pages/Support.tsx` | **Delete** |
| `src/pages/Performance.tsx` | **Delete** (performance lives inside `/chart-analyzer`) |
| `src/components/Dashboard.tsx` | **Delete** |
| `src/components/services/` (all mockup components) | **Delete** |

---

## New Color/Brand Identity

The Chart Analyzer already uses **amber/orange** (`amber-500`) as its accent — tabs glow amber, the ambient gradient is warm orange. The new landing page will lean into this:

- **Primary accent**: Amber / warm orange — signals urgency, gold, trading wins
- **Background**: Clean white / near-black (existing dark mode)
- **Typography**: Keep `Syne` (display) + system sans — professional, modern
- **Logo**: `BarChart3` icon from lucide (already used on the chart analyzer page) next to "AYN Trade"

---

## Route Map After Rebuild

```text
/                  → Landing page (unauthenticated) or redirect to /chart-analyzer (authenticated)
/chart-analyzer    → The main app (auth-gated)
/reset-password    → Password reset
/pricing           → Pricing (kept — needed for subscription)
/settings          → Settings (kept — needed for account)
/subscription-success  → Kept
/subscription-canceled → Kept
/terms             → Kept
/privacy           → Kept
/approval-result   → Kept (needed for admin flows)
/* → 404
```

Everything else is deleted.

---

## Implementation Steps (In Order)

1. **Trim `App.tsx`** — remove all service/engineering/support/compliance route imports and `<Route>` entries
2. **Rewrite `src/pages/Index.tsx`** — if authenticated, `navigate('/chart-analyzer')` immediately; if not, show new landing
3. **Rewrite `src/components/LandingPage.tsx`** — new brand-focused 5-section page
4. **Rewrite `src/components/landing/Hero.tsx`** — chart analysis hero
5. **Delete** all service pages, mockup components, Dashboard.tsx, and unused pages
6. **Update `ChartAnalyzerPage.tsx`** — remove the "Back" button (there's nowhere to go back to now — the landing is the root)

No backend changes. No database changes. No edge function changes.
