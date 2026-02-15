

## Fix Excel Detection + Remove Inline Download Links

### Problem 1: Excel download not detected
The `extractBestDocumentLink` regex only matches `[Download]` or `[Download here]` as link text. But the LLM generates links like `[Download Riyadh_Weather_Report.xlsx](url)` -- the word "Download" is followed by more text, so the regex fails and the Download button never appears for Excel files.

### Problem 2: Inline download text still visible
The response card shows both the inline markdown link ("Click here to download your PDF" / "Download Riyadh_Weather_Report.xlsx") AND the Download button at the bottom. Since the Download button is the intended way to download, the inline text should be hidden.

### Changes

**File 1: `src/lib/documentUrlUtils.ts`**
- Broaden the `downloadRegex` to match any link text starting with "Download" (not just "Download" or "Download here")
- Also add a general catch-all regex for any markdown link pointing to a document URL (Supabase storage, `.pdf`, `.xlsx`, `.xls`, or data URLs for documents)
- This ensures Excel links like `[Download Riyadh_Weather_Report.xlsx](url)` are properly detected

**File 2: `src/components/shared/MessageFormatter.tsx`**
- In the `preprocessContent` or as a new step, strip inline document download links from the rendered markdown content
- Remove lines matching patterns like `📄 [Click here to download...](url)` or `[Download ...](url)` when the URL points to a document
- This hides the inline text since users will use the Download button instead
- Keep non-document links (regular external links) untouched

### Technical Detail

**documentUrlUtils.ts -- broader regex:**
```
// Before: only matches "[Download]" or "[Download here]"
/\[([Dd]ownload(?:\s+here)?)\]\((url)\)/g

// After: matches any link text starting with "Download" or "Click here"
/\[([Dd]ownload[^\]]*|[Cc]lick here[^\]]*)\]\((url)\)/g
```

Also add a generic document URL matcher as a final fallback -- any markdown link `[title](url)` where the URL contains `.pdf`, `.xlsx`, `.xls`, or is a Supabase storage URL or document data URL.

**MessageFormatter.tsx -- strip document links from display:**
Add a content preprocessing step that removes lines containing document download links (emoji + markdown link patterns, or "Download ..." links pointing to document URLs). This runs before the markdown is rendered, so users only see the clean text and use the Download button.

```
// Remove lines like: 📄 [Click here to download your PDF](https://...)
// Remove lines like: [Download Riyadh_Weather_Report.xlsx](https://...)
// Keep the surrounding text content intact
```

### Summary

| File | Change |
|------|--------|
| `src/lib/documentUrlUtils.ts` | Broaden download link regex + add generic document URL fallback |
| `src/components/shared/MessageFormatter.tsx` | Strip inline document download links from rendered content |
