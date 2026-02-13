

# Fix Compliance PDF: Headlines Cut-off and Remove Circle

## Problems
1. **Headlines cut off on page 2**: The "DOORS & HALLWAYS" heading is clipped at the top of the second page because content flows as a single page div without proper page-break handling.
2. **Red circle around percentage**: User wants the circle removed, just showing the percentage number with pass/fail styling.

## Solution

### File: `supabase/functions/generate-compliance-pdf/index.ts`

**1. Remove the score circle element and its CSS**
- Remove the `.score-circle` CSS class entirely
- Replace the circle `<div>` with a simple styled percentage `<span>` (large, bold, colored red/green based on pass/fail)
- Update `.summary-box` layout to remove the circle and just show the percentage inline

**2. Fix page-break handling for category sections**
- Add `page-break-inside: avoid` to `.category-section` (already present but not effective due to single `.page` wrapper)
- Remove the single `.page` wrapper approach -- instead, let the content flow naturally with proper CSS print/page-break rules
- Add `page-break-before: auto` and `page-break-after: auto` on category sections
- Add `page-break-inside: avoid` on table rows and header groups to prevent mid-table splits

### Technical Details

**Summary section change:**
```html
<!-- Before: circle div -->
<div class="score-circle">50%</div>

<!-- After: simple text -->
<span class="score-text">50%</span>
```

**CSS changes:**
- Remove `.score-circle` class
- Add `.score-text` with large font, bold, colored based on status
- Remove single `.page` wrapper min-height constraint
- Add `page-break-inside: avoid` to `.category-header` combined with its table

**Redeploy** the `generate-compliance-pdf` edge function after changes.

