
# Comprehensive Translation Fix Plan

## Overview

After thorough analysis of the codebase, I've identified multiple pages and components that contain hardcoded English text instead of using the translation system (`t()` function from `LanguageContext`). This affects the Arabic and French language experiences significantly.

---

## Pages & Components Requiring Translation

### Critical Pages (Fully Hardcoded)

| Page/Component | Status | Issues Found |
|---|---|---|
| **Pricing.tsx** | ❌ Not translated | All text hardcoded: FAQ items, button labels, headings, trust indicators, enterprise modal |
| **Engineering.tsx** | ❌ Not translated | Calculator titles, descriptions, features section, buttons |
| **MobileBlockScreen.tsx** | ❌ Not translated | Title, description, device labels, buttons |
| **UsageCard.tsx** | ❌ Not translated | "HOO Credit", "Unlimited", "Resets in", "Remaining", "Active", status labels |
| **AccountPreferences.tsx** | Partial | "Usage & Limits" hardcoded (line 218) |

### Service Pages (Partial Translation)

| Page | Status | Issues |
|---|---|---|
| **AIAgentsApply.tsx** | Partial | Form labels like "Contact Information", "Company Name", industry options, agent type options all hardcoded |
| **InfluencerSitesApply.tsx** | Partial | Similar form issues |
| **AutomationApply.tsx** | Partial | Similar form issues |
| **AIAgents.tsx** | Partial | Some UI elements hardcoded ("AI Assistant", "Connected") |

---

## Implementation Plan

### Part 1: Add Missing Translation Keys

Add new keys to all three language sections (en, ar, fr) in `LanguageContext.tsx`:

**Pricing Page Keys** (~40 keys):
```
pricing.title, pricing.subtitle, pricing.chooseYourPlan, pricing.unlockPower
pricing.yourPlan, pricing.mostPopular, pricing.contactUs, pricing.tailored
pricing.billedMonthly, pricing.cancelAnytime, pricing.perMonth
pricing.contactSales, pricing.managePlan, pricing.currentPlan
pricing.upgrade, pricing.downgrade, pricing.getStarted, pricing.switchPlan
pricing.securePayments, pricing.cancelAnytime, pricing.noHiddenFees
pricing.policyNote, pricing.faq
pricing.faq.whatAreCredits, pricing.faq.whatAreCreditsAnswer
pricing.faq.pdfExcel, pricing.faq.pdfExcelAnswer
... (7 FAQ items)
pricing.enterprise.companyName, pricing.enterprise.email
pricing.enterprise.requirements, pricing.enterprise.submit
```

**Engineering Page Keys** (~25 keys):
```
engineering.title, engineering.subtitle
engineering.aiPowered, engineering.professionalCalcs
engineering.designDescription
engineering.tools.grading, engineering.tools.gradingDesc
engineering.tools.beam, engineering.tools.beamDesc
engineering.tools.foundation, engineering.tools.foundationDesc
engineering.tools.column, engineering.tools.columnDesc
engineering.tools.slab, engineering.tools.slabDesc
engineering.tools.retainingWall, engineering.tools.retainingWallDesc
engineering.tools.parking, engineering.tools.parkingDesc
engineering.features.3dViz, engineering.features.dxfExport
engineering.features.aiAnalysis
engineering.back, engineering.compare, engineering.history, engineering.export
engineering.comingSoon
```

**Mobile Block Screen Keys** (~6 keys):
```
engineering.mobile.title, engineering.mobile.description
engineering.mobile.tablet, engineering.mobile.desktop
engineering.mobile.backToDashboard, engineering.mobile.learnMore
```

**Usage Card Keys** (~15 keys):
```
usage.title, usage.credits, usage.unlimited
usage.resetsIn, usage.remaining, usage.active
usage.used, usage.left, usage.normal, usage.warning, usage.low
usage.unlimitedPlan, usage.messagesSent
```

**Application Form Keys** (~30 keys for service applications):
```
apply.contactInfo, apply.projectDetails
apply.companyName, apply.fullName, apply.email, apply.phone
apply.industry.*, apply.agentType.*, apply.budget.*, apply.timeline.*
apply.integrations, apply.useCase
```

### Part 2: Update Components

1. **Pricing.tsx**
   - Import `useLanguage` hook
   - Replace all hardcoded strings with `t('pricing.*')` calls
   - Convert FAQ items array to use translation keys
   - Update enterprise modal text

2. **Engineering.tsx**
   - Import `useLanguage` hook
   - Create translated `calculatorOptions` using `t()` function
   - Translate features section
   - Translate header text

3. **MobileBlockScreen.tsx**
   - Import `useLanguage` hook
   - Replace all hardcoded strings with `t()` calls

4. **UsageCard.tsx**
   - Import `useLanguage` hook
   - Replace "HOO Credit", "Unlimited", status labels with `t()` calls

5. **AccountPreferences.tsx**
   - Replace "Usage & Limits" with `t('settings.usageAndLimits')`

6. **Service Application Pages**
   - Update form labels and select options to use translations

---

## Translation Quality Guidelines

To ensure grammatically correct translations:

### English
- Proper capitalization (sentence case for descriptions, title case for headings)
- Correct punctuation and grammar

### Arabic (العربية)
- Use Modern Standard Arabic (فصحى)
- Proper RTL text flow
- Correct diacritics where important for meaning
- Arabic question mark (؟) and comma (،)
- Grammatically correct verb conjugations

### French (Français)
- Proper accents (é, è, ê, à, ù, ç, etc.)
- Correct gender agreement
- Proper article usage (le, la, les, un, une, des)
- Formal "vous" form for UI text

---

## Files to Modify

| File | Changes |
|---|---|
| `src/contexts/LanguageContext.tsx` | Add ~120 new translation keys for all 3 languages |
| `src/pages/Pricing.tsx` | Replace ~50 hardcoded strings with t() calls |
| `src/pages/Engineering.tsx` | Replace ~30 hardcoded strings with t() calls |
| `src/components/engineering/MobileBlockScreen.tsx` | Replace ~8 hardcoded strings |
| `src/components/dashboard/UsageCard.tsx` | Replace ~12 hardcoded strings |
| `src/components/settings/AccountPreferences.tsx` | Replace 1 hardcoded string |
| `src/pages/services/AIAgentsApply.tsx` | Replace ~20 hardcoded form labels |
| `src/pages/services/InfluencerSitesApply.tsx` | Replace ~15 hardcoded form labels |
| `src/pages/services/AutomationApply.tsx` | Replace ~15 hardcoded form labels |

---

## Example Translations

**Pricing Page Title:**
- EN: "Choose Your Plan"
- AR: "اختر خطتك"
- FR: "Choisissez Votre Forfait"

**FAQ "What are credits?":**
- EN: "Credits are used for AI interactions. Free users get 5 credits per day (resets daily). Paid users receive their full monthly allowance upfront."
- AR: "تُستخدم الاعتمادات للتفاعلات مع الذكاء الاصطناعي. يحصل المستخدمون المجانيون على 5 اعتمادات يومياً (تُجدد يومياً). يتلقى المستخدمون المدفوعون حصتهم الشهرية كاملة مقدماً."
- FR: "Les crédits sont utilisés pour les interactions IA. Les utilisateurs gratuits reçoivent 5 crédits par jour (réinitialisés quotidiennement). Les utilisateurs payants reçoivent leur allocation mensuelle complète d'avance."

**Engineering Mobile Block:**
- EN: "Larger Screen Required"
- AR: "شاشة أكبر مطلوبة"
- FR: "Écran Plus Grand Requis"

---

## Priority Order

1. **High Priority**: Pricing.tsx (revenue-impacting page)
2. **High Priority**: Engineering.tsx (feature page)
3. **Medium Priority**: UsageCard.tsx (visible on dashboard)
4. **Medium Priority**: MobileBlockScreen.tsx (blocking screen)
5. **Lower Priority**: Service application forms
