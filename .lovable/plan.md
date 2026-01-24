
# Fix UI Visibility Issues & Create Terms/Privacy Pages

## Summary

This plan addresses three distinct issues:
1. **Ticketing Mockup QR Code** - The QR code displays as a broken grid pattern instead of a recognizable visual
2. **404 Page Text Visibility** - The description text uses `text-muted-foreground` which is invisible on dark backgrounds
3. **Missing Legal Pages** - The `/terms` and `/privacy` routes don't exist, causing 404 errors when users click the auth modal links

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/services/TicketingMockup.tsx` | Modify | Create a proper QR code pattern with finder patterns |
| `src/pages/NotFound.tsx` | Modify | Fix text visibility for dark/light mode compatibility |
| `src/pages/Terms.tsx` | Create | Full Terms of Service page with all 12 sections |
| `src/pages/Privacy.tsx` | Create | Full Privacy Policy page |
| `src/App.tsx` | Modify | Add routes for `/terms` and `/privacy` |

---

## Part 1: Fix Ticketing Mockup QR Code

**Current Issue**: The QR code uses random dots that look broken/incomplete.

**Solution**: Create a proper QR code visual with:
- Corner finder patterns (3 squares in corners) - standard QR code requirement
- Consistent center pattern that looks like actual QR code data
- Remove randomness that causes the broken appearance

**Changes to `TicketingMockup.tsx`**:
- Replace the random `qrPattern` generator (lines 334-346) with a static, visually proper QR code pattern
- The pattern will have 7x7 finder patterns in 3 corners and meaningful-looking data pixels

```typescript
const qrPattern = useMemo(() => {
  // Proper QR code pattern with finder patterns in corners
  return [
    [true, true, true, true, true, true, true],
    [true, false, false, false, false, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, false, false, false, false, true],
    [true, true, true, true, true, true, true],
  ];
}, []);
```

---

## Part 2: Fix 404 Page Text Visibility

**Current Issue**: Line 28 uses `text-muted-foreground` which becomes invisible on dark backgrounds.

**Current code**:
```tsx
<p className="text-muted-foreground mb-8 leading-relaxed">
```

**Fixed code**:
```tsx
<p className="text-white/70 dark:text-white/70 mb-8 leading-relaxed">
```

Also fix the help text at line 52:
```tsx
<p className="text-sm text-white/50 dark:text-white/50">
```

Add explicit background styling to the Card to ensure consistent contrast:
```tsx
<Card className="glass text-center p-12 max-w-lg bg-neutral-900/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/20">
```

---

## Part 3: Create Terms of Service Page

**New file: `src/pages/Terms.tsx`**

This page will include:
- Professional header with AYN branding
- All 12 sections from the TermsModal content (reformatted for full-page reading)
- Sections cover: Information Collection, Usage, Sharing, Security, Retention, Rights, Transfers, Cookies, Children's Privacy, Updates, No Refunds, AI Disclaimer
- Bilingual support via translation keys
- Navigation back to home
- Professional styling matching the platform design

**Key features**:
- Reuses the policy content from TermsModal but in a full-page format
- Includes section anchors for direct linking
- Responsive layout for all devices
- Proper dark/light mode support

---

## Part 4: Create Privacy Policy Page

**New file: `src/pages/Privacy.tsx`**

This page will include:
- Same professional design as Terms page
- Focus on privacy-specific sections (1-10)
- Contact information for privacy inquiries
- Links to Terms page for refund/AI disclaimer policies
- Last updated date display

---

## Part 5: Add Routes to App.tsx

**Changes to `src/App.tsx`**:
- Add lazy imports for Terms and Privacy pages
- Add routes for `/terms` and `/privacy`

```typescript
// Add imports
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

// Add routes (before the catch-all)
<Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
<Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
```

---

## Technical Implementation

### QR Code Fix

The current implementation uses `Math.random()` which generates different patterns on each render. The fix creates a static, visually coherent pattern that resembles a real QR code with proper finder patterns.

### Text Visibility Fix

The `text-muted-foreground` class resolves to a gray color that has poor contrast on dark backgrounds. Using `text-white/70` (white at 70% opacity) ensures visibility on both the dark glassmorphic card and darker backgrounds.

### Legal Pages Architecture

Both legal pages will:
1. Use the same section component structure as TermsModal for consistency
2. Include a sticky header with navigation
3. Use scroll-based section highlighting
4. Support all 3 languages (English, Arabic, French) via translation keys
5. Include a "Back to Home" button
6. Display last updated dates
7. Have proper SEO meta tags

---

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Ticketing QR Code | Random dots, broken appearance | Proper QR pattern with finder squares |
| 404 Page Text | Invisible on dark background | Clearly visible in all themes |
| Terms link (/terms) | 404 error | Full Terms of Service page |
| Privacy link (/privacy) | 404 error | Full Privacy Policy page |

---

## Summary

This implementation ensures:
1. All UI elements are visible in both light and dark modes
2. Users can access full legal documents before signing up
3. The ticketing mockup displays a professional-looking QR code
4. The 404 page has proper contrast for readability
