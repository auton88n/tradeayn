

# Restore RTL Support for Landing Page & Services Pages

## Problem

My previous fix removed global RTL support entirely, which broke RTL on:
- **Landing Page** - Should support RTL when Arabic is selected
- **Services Pages** - Should support RTL when Arabic is selected

However, the **Dashboard** (after sign-in) should always stay LTR as intended.

---

## Current State

| Component | Current Behavior | Expected Behavior |
|-----------|------------------|-------------------|
| LandingPage | Always LTR ❌ | Respects language direction |
| Services Pages | Always LTR ❌ | Respects language direction |
| Dashboard | Has `dir="ltr"` hardcoded ✅ | Always LTR |
| AI Response Content | Auto-detects Arabic ✅ | RTL for Arabic text |

---

## Solution

### Approach: Restore Global RTL, Dashboard Overrides It

1. **Restore global RTL in LanguageContext** - Set `document.dir` and RTL class when Arabic is selected
2. **Dashboard already has protection** - Line 195 has `<div dir="ltr">` which will override the global setting

This is the simplest approach because:
- Dashboard already explicitly sets `dir="ltr"` on its root container
- Public pages (Landing, Services) will inherit the document direction
- No changes needed to Landing or Services pages

---

## Implementation

### File: `src/contexts/LanguageContext.tsx`

**Restore the global direction logic:**

```typescript
// Current (broken):
useEffect(() => {
  document.documentElement.lang = language;
  // Do NOT set dir="rtl" on document...
}, [language]);

// Fixed:
useEffect(() => {
  // Update document direction and language for public pages
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  
  // Add/remove RTL class for global styling
  if (language === 'ar') {
    document.documentElement.classList.add('rtl');
  } else {
    document.documentElement.classList.remove('rtl');
  }
}, [language, direction]);
```

---

## How It Works After Fix

```text
┌─────────────────────────────────────────────────────────────┐
│  document.documentElement                                    │
│  dir="rtl" (when Arabic selected)                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Landing Page / Services Pages                          ││
│  │  → Inherits dir="rtl" from document                    ││
│  │  → Text flows right-to-left                            ││
│  │  → Layout flips naturally                               ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Dashboard (after sign-in)                              ││
│  │  <div dir="ltr"> ← Explicit override                   ││
│  │  → Layout stays left-to-right                          ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  AI Response Card                                  │ ││
│  │  │  <div dir="rtl"> ← Auto-detected for Arabic text  │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Result

| Page | When English | When Arabic |
|------|-------------|-------------|
| Landing Page | LTR layout | RTL layout ✅ |
| Services Pages | LTR layout | RTL layout ✅ |
| Pricing | LTR layout | RTL layout ✅ |
| Dashboard | LTR layout | LTR layout (forced) ✅ |
| AI Response | LTR text | RTL text (auto) ✅ |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/contexts/LanguageContext.tsx` | Restore `document.dir = direction` and RTL class toggle |

This is a 1-file fix that restores RTL support for all public pages while keeping the Dashboard protected with its existing `dir="ltr"` override.

