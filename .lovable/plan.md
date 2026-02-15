

## Simplify Download Button: Only Show for Documents and Images

### What Changes
The Download button in the response card action bar currently always shows with Markdown (.md) and Plain Text (.txt) options. We will:

1. **Remove** the Markdown and Plain Text download options entirely
2. **Only show** the Download button when there is a generated document (PDF/Excel) or image
3. **Single-click download** -- since there will usually be only one file, clicking the button downloads it directly (no dropdown menu needed). If both a document and image exist, show a dropdown with both options.

### Changes

**File: `src/components/eye/ResponseCard.tsx`**

- Add imports: `extractBestDocumentLink` and `openDocumentUrl` from `@/lib/documentUrlUtils`
- Add a `documentLink` memo that checks `documentAttachment` first, then falls back to scanning `combinedContent` with `extractBestDocumentLink`
- Determine if there is a downloadable file: `hasDocument = !!documentLink`, `hasImage = !!detectedImageUrl`
- **If neither exists**: hide the Download button entirely
- **If only one exists** (document or image): clicking Download triggers the download directly via `openDocumentUrl` (no dropdown)
- **If both exist**: show a dropdown with two options (e.g., "Excel (.xls)" and "Image (.png)")
- Remove the old Markdown/Plain Text dropdown options
- Remove `DocumentDownloadButton` import (no longer used anywhere in this file)
- Remove `showDownloadMenu` state if single-click is sufficient, or keep it only for the rare both-exist case

### Technical Detail

```text
Before:
  [Download v]
    -> Markdown (.md)
    -> Plain Text (.txt)
  (always visible)

After:
  [Download]  (only visible when document or image exists)
    -> single click = download the file
    -> if both doc + image: dropdown with 2 options
```

The button label will reflect the file type when there is only one: "Download" with an appropriate icon. The `openDocumentUrl` utility handles both Supabase HTTPS URLs (fetch-as-blob) and data URLs (direct anchor download).
