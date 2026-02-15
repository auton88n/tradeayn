

## Make Excel Output Professional and Remove Download Card

### Problem 1: CSV output looks plain and unprofessional
The current "Excel" generation produces a basic CSV file with no styling, no column widths, and no visual structure. When opened in Excel/Google Sheets, it looks like raw data dumped into cells (as seen in the screenshot).

**Fix**: Replace the CSV generator with a proper `.xlsx` generator using the Office Open XML format built from scratch in pure TypeScript (no external dependencies). This will include:
- Styled header row with background color and bold text
- Auto-sized column widths
- Alternating row colors for readability
- Proper sheet naming based on language
- Section headings styled as merged, bold rows

Since `xlsx` library fails to import in Deno, we will generate the `.xlsx` XML manually (the format is just a ZIP of XML files). Alternatively, we can use a lighter approach: generate a proper HTML table file with `.xls` extension, which Excel opens natively with full styling support. This is a well-known technique used by many enterprise apps.

### Problem 2: Remove the separate DocumentDownloadButton card
The big download card (screenshot 2) takes up space and feels disconnected. Instead, the document download should be an inline link within the response text, similar to how PDFs already work via markdown links.

**Fix**: 
- Remove the `DocumentDownloadButton` rendering from `ResponseCard.tsx` (lines 545-553)
- The download already works via the markdown link in the response text (the `MessageFormatter` intercepts Supabase storage URLs and triggers blob downloads)
- The existing action bar "Download" button at the bottom also provides download options

### Changes

**File: `supabase/functions/generate-document/index.ts`**
- Replace the `generateExcel` function with one that produces a styled HTML table saved as `.xls`
- The HTML table format supports: bold headers, background colors, column widths, borders, font styling
- Change content type to `application/vnd.ms-excel` and extension to `.xls`
- Excel, Google Sheets, and LibreOffice all open HTML `.xls` files with full styling

**File: `src/components/eye/ResponseCard.tsx`**
- Remove the `DocumentDownloadButton` import and the block rendering it (lines 545-553)
- The download link in the markdown response text handles everything

**File: `src/components/eye/DocumentDownloadButton.tsx`**
- No deletion needed (may still be used in transcript history), but it will no longer render in the main response card

### Technical Details

The HTML-table-as-XLS approach:

```text
Before: Plain CSV with no styling
  Title,,,
  Date,,,
  Section Heading,,,
  Data1,Data2,Data3

After: Styled HTML table saved as .xls
  <html><head><style>
    th { background: #1a1a2e; color: white; font-weight: bold; padding: 8px; }
    td { padding: 6px; border: 1px solid #ddd; }
    tr:nth-child(even) { background: #f8f8fc; }
    .section-heading { font-size: 14px; font-weight: bold; background: #f0f0f5; }
  </style></head>
  <body><table>...</table></body></html>
```

This produces a professional-looking spreadsheet with:
- Dark header row matching the PDF style
- Alternating row colors
- Proper borders and padding
- Section headings as styled merged rows
- No external dependencies required

