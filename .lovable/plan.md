

## Fix PDF Export Rendering Issues

### Problem Analysis

The PDF export has two visible issues:

1. **Design Status Box Incomplete**: The green box under "4. DESIGN STATUS" shows only the checkmark icon, but the text "DESIGN ADEQUATE" and subtext are missing
2. **Duplicate Content with Black Bar**: A page break creates a black bar, followed by duplicated content (Design Status box and Disclaimer)

### Root Cause

The `react-to-pdf` library uses `html2canvas` under the hood, which:
- Has issues with certain CSS properties when content exceeds page height
- Creates awkward page breaks that can split elements or duplicate content
- May not render nested divs correctly in some scenarios

The `.status-box` HTML structure:
```html
<div class="status-box status-adequate">
  <div class="status-icon">✓</div>
  <div class="status-text">DESIGN ADEQUATE</div>
  <div class="status-subtext">All code requirements satisfied per ACI 318-25</div>
</div>
```

The CSS shows `text-align: center` but the child divs may not inherit or display correctly in the canvas render.

---

### Solution

**Approach 1: Inline styles for status box elements**

Force visibility by adding explicit inline styles that `html2canvas` handles better:

**File**: `supabase/functions/generate-engineering-pdf/index.ts`

Update the status box HTML (lines 533-537):
```html
<div class="status-box ${hasFail ? 'status-inadequate' : hasReview ? 'status-review-box' : 'status-adequate'}">
  <div style="font-size: 36px; margin-bottom: 8px; display: block;">${hasFail ? '✗' : hasReview ? '⚠' : '✓'}</div>
  <div style="font-size: 16px; font-weight: 700; display: block;">${hasFail ? 'DESIGN INADEQUATE' : hasReview ? 'DESIGN REQUIRES REVIEW' : 'DESIGN ADEQUATE'}</div>
  <div style="font-size: 11px; color: #666; margin-top: 5px; display: block;">${hasFail ? 'Some code requirements not satisfied - revision required' : hasReview ? 'Some items require professional engineering review' : `All code requirements satisfied per ${codeRef.name}`}</div>
</div>
```

**Approach 2: Add page break prevention**

Add CSS to prevent awkward page breaks and limit page height:

```css
.section { page-break-inside: avoid; break-inside: avoid; }
.status-box { page-break-inside: avoid; break-inside: avoid; }
.disclaimer { page-break-inside: avoid; break-inside: avoid; }
.page { overflow: hidden; }
```

**Approach 3: Use CSS display: block explicitly**

Update the CSS classes to be more explicit:

```css
.status-icon { font-size: 36px; margin-bottom: 8px; display: block; }
.status-text { font-size: 16px; font-weight: 700; display: block; }
.status-subtext { font-size: 11px; color: #666; margin-top: 5px; display: block; }
```

---

### Recommended Implementation

Apply all three approaches for maximum compatibility:

| File | Change |
|------|--------|
| `supabase/functions/generate-engineering-pdf/index.ts` | Add `display: block` to status-icon, status-text, status-subtext CSS classes |
| `supabase/functions/generate-engineering-pdf/index.ts` | Add `page-break-inside: avoid` to sections |
| `supabase/functions/generate-engineering-pdf/index.ts` | Add inline styles as fallback for critical visibility |

---

### CSS Updates (lines 391-393)

Current:
```css
.status-icon { font-size: 36px; margin-bottom: 8px; }
.status-text { font-size: 16px; font-weight: 700; }
.status-subtext { font-size: 11px; color: #666; margin-top: 5px; }
```

Updated:
```css
.status-icon { font-size: 36px; margin-bottom: 8px; display: block; width: 100%; }
.status-text { font-size: 16px; font-weight: 700; display: block; width: 100%; }
.status-subtext { font-size: 11px; color: #666; margin-top: 5px; display: block; width: 100%; }
```

---

### Additional CSS for Page Breaks (add after line 407)

```css
/* Prevent page break issues */
.section { page-break-inside: avoid; }
.status-box { page-break-inside: avoid; }
.disclaimer { page-break-inside: avoid; }
.signature-section { page-break-inside: avoid; }
```

---

### Expected Result

| Before | After |
|--------|-------|
| Only checkmark visible in green box | Full "DESIGN ADEQUATE" text visible |
| Black bar page break | Clean page flow without duplication |
| Duplicate disclaimer | Single disclaimer at correct position |

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-engineering-pdf/index.ts` | Add `display: block` to status elements, add page break prevention CSS |

