

# Per-Page SEO Audit: Already Implemented

## Finding

After auditing all page components, **nearly every page already has unique SEO metadata** via the `<SEO>` component (which uses `react-helmet-async` internally). Creating a separate `seoConfig.ts` would duplicate existing work and decouple SEO data from the pages that own it.

### Pages with unique SEO (already done)

| Page | Title |
|------|-------|
| Landing (`LandingPage.tsx`) | "AYN AI - Personal AI Assistant That Learns You..." |
| Settings | "Account Settings" |
| Pricing | "Pricing - AYN" |
| Support | "Help & Support" |
| Engineering | "Civil Engineering Calculator..." |
| AI Grading | "AI Grading Designer - Civil Engineering" |
| AI Employee | "AI Employees - Hire 24/7 AI Team Members" |
| AI Agents | "Custom AI Agents for Your Business" |
| Automation | "Business Process Automation Solutions" |
| Ticketing | Dynamic per-language title |
| All Apply pages | Unique titles |
| Privacy | "Privacy Policy - AYN" |
| Terms | "Terms of Service - AYN" |
| Subscription Success/Canceled | Unique titles |
| Civil Engineering | Has SEO component |
| Influencer Sites | Has SEO component |

### Pages missing SEO (3 minor pages)

| Page | Fix |
|------|-----|
| `NotFound.tsx` | Add `<SEO title="Page Not Found" noIndex={true} />` |
| `ResetPassword.tsx` | Add `<SEO title="Reset Password" noIndex={true} />` |
| `ApprovalResult.tsx` | Add `<SEO title="Approval Result" noIndex={true} />` |

### `index.html` improvement

Update the static fallback `<title>` and `<meta name="description">` in `index.html` to be more descriptive. These show briefly before React hydrates:

- Title: `AYN AI - Personal AI Assistant That Learns You`
- Description: keep the current one (it is already reasonable)

## Changes

| File | Change |
|------|--------|
| `index.html` | Update static `<title>` to match landing page title |
| `src/pages/NotFound.tsx` | Add `<SEO>` with `noIndex` |
| `src/pages/ResetPassword.tsx` | Add `<SEO>` with `noIndex` |
| `src/pages/ApprovalResult.tsx` | Add `<SEO>` with `noIndex` |

No new `seoConfig.ts` file needed -- the existing per-page `<SEO>` component pattern is the correct approach and is already in place for all public pages.

