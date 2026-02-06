

# Fix: Scope RTL Direction to Public Pages Only

## Problem

When Arabic is selected, `LanguageContext` sets `document.documentElement.dir = "rtl"` on the `<html>` element. This causes the entire application -- including the dashboard, admin panel, modals, toasts, dropdowns, and all portal-based UI -- to flip to RTL. The dashboard has `dir="ltr"` on its container, but portals (rendered under `<body>`) still inherit RTL from `<html>`, breaking layouts.

Per the project's design rules: **translations should only affect public pages (Landing, Services). The dashboard must always stay LTR.**

## Solution

1. **Stop setting `dir` on `<html>`** -- remove the global `document.documentElement.dir = direction` from `LanguageContext`
2. **Add a `dir` wrapper on public pages** -- each public page component already has a root `<div>`, so we add `dir={direction}` from the language context to scope RTL only where needed
3. Keep `document.documentElement.lang` for SEO/accessibility

## Technical Changes

### 1. `src/contexts/LanguageContext.tsx` (~line 1964-1975)

Remove the global direction and RTL class assignments. Keep only the `lang` attribute:

**Before:**
```
document.documentElement.lang = language;
document.documentElement.dir = direction;

if (language === 'ar') {
  document.documentElement.classList.add('rtl');
} else {
  document.documentElement.classList.remove('rtl');
}
```

**After:**
```
document.documentElement.lang = language;
// Direction is applied per-page, not globally, to prevent dashboard/portal breakage
```

### 2. `src/components/LandingPage.tsx` (~line 293)

Add `dir={direction}` to the root div:

```tsx
const { t, language, direction } = useLanguage();
// ...
<div dir={direction} className="min-h-screen bg-background scroll-smooth">
```

### 3. Service pages (all 11 files in `src/pages/services/`)

Each service page already imports `useLanguage`. Add `direction` to the destructure and `dir={direction}` to their root wrapper div:

- `AIEmployee.tsx`
- `AIEmployeeApply.tsx`
- `AIAgents.tsx`
- `AIAgentsApply.tsx`
- `Automation.tsx`
- `AutomationApply.tsx`
- `InfluencerSites.tsx`
- `InfluencerSitesApply.tsx`
- `Ticketing.tsx`
- `TicketingApply.tsx`
- `CivilEngineering.tsx`

### 4. Other public pages

- `src/pages/Terms.tsx` -- add direction wrapper
- `src/pages/Privacy.tsx` -- add direction wrapper

### 5. Pages that stay LTR (NO changes needed)

- Dashboard -- already has `dir="ltr"`
- Settings -- dashboard child
- Pricing -- accessed from dashboard, no RTL needed
- Engineering workspace -- already has `dir="ltr"`
- Admin panel -- dashboard child

### 6. CSS cleanup in `src/index.css`

Review and update any `html.rtl` or `[dir="rtl"]` selectors to work with the scoped approach (they will now match within the public page wrappers instead of the html element).

## Why This Works

- The `<html>` element stays LTR, so all portals (modals, toasts, dropdowns, popovers) default to LTR
- Public pages explicitly opt into RTL via their own wrapper
- The dashboard and all its components remain completely unaffected by language changes
- `lang` attribute stays on `<html>` for SEO and screen readers

## Files Modified (summary)

| File | Change |
|------|--------|
| `LanguageContext.tsx` | Remove global `dir` and `rtl` class |
| `LandingPage.tsx` | Add `dir={direction}` to root div |
| 11 service page files | Add `dir={direction}` to root div |
| `Terms.tsx`, `Privacy.tsx` | Add `dir={direction}` to root div |
| `index.css` | Update RTL selectors if needed |

