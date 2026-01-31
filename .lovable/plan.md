
# Fix PDF Download - Data URL Not Working in Markdown Links

## Problem Identified

The PDF generation is **working correctly** on the backend (generating a 14KB base64 data URL), but the download fails because:

1. **Data URLs are too long for markdown links** - A 14KB base64 PDF data URL embedded in `[Title](data:application/pdf;base64,...)` format creates parsing issues
2. **ReactMarkdown can't reliably parse 14,000+ character URLs** inside link syntax
3. **The link gets corrupted** and instead of downloading the PDF, it redirects to the app's base URL

## Solution: Separate Document URL from Message Content

Instead of embedding the massive data URL inside the markdown text, we should:

1. **Keep the data URL in a separate field** (already exists as `documentUrl` in the response)
2. **Show a styled download button** in the UI when a document is available
3. **Use the `openDocumentUrl` function** directly with the attachment URL

## Implementation Plan

### Part 1: Update ayn-unified Response Format

**File:** `supabase/functions/ayn-unified/index.ts`

Change the success message to NOT include the data URL in the markdown. Instead, use a placeholder or simple text:

```text
Before (broken):
📄 [Greenland Report](data:application/pdf;base64,JVBERi0...)

After (fixed):
Document created successfully!

📄 **Greenland Report** - Click the download button below

_(30 credits used • 70 remaining)_
```

The actual download URL stays in the response JSON (`documentUrl` field) and is rendered by the UI as a separate button.

### Part 2: Update ResponseCard to Show Download Button

**File:** `src/components/eye/ResponseCard.tsx`

Add a document download button that appears when the response includes a document attachment:

- Check if `visibleResponses[0]?.attachment` has a document type
- Show a styled download button with the document icon
- Use `openDocumentUrl(attachment.url, attachment.name)` on click

### Part 3: Update useMessages to Pass Document Attachment

**File:** `src/hooks/useMessages.ts`

Ensure the document URL from the webhook response is properly saved as an attachment:

- Already saves `attachment_url` from `webhookData?.documentUrl` 
- Verify it's being passed correctly to the ResponseCard

### Part 4: Add Document Download Button Component

**File:** `src/components/eye/DocumentDownloadButton.tsx` (new)

Create a reusable download button component:

```text
┌────────────────────────────────────────┐
│  📄  Greenland Report.pdf    [Download]│
└────────────────────────────────────────┘
```

Features:
- Shows document icon (PDF or Excel)
- Displays filename
- Download button triggers `openDocumentUrl()`
- Clean styling matching the response card

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/ayn-unified/index.ts` | Modify | Remove data URL from markdown, keep in JSON field |
| `src/components/eye/ResponseCard.tsx` | Modify | Show download button when document attachment exists |
| `src/components/eye/DocumentDownloadButton.tsx` | Create | Styled download button component |
| `src/hooks/useMessages.ts` | Verify | Ensure attachment is passed correctly |

## Technical Flow After Fix

```text
User: "Create a PDF about Greenland"
                │
                ▼
┌─────────────────────────────────────────┐
│  ayn-unified edge function              │
│  ─────────────────────────────────────  │
│  1. Generate PDF → data:application/... │
│  2. Return JSON:                        │
│     {                                   │
│       content: "Document created! 📄",  │
│       documentUrl: "data:...",          │  ← Separate field
│       documentType: "pdf"               │
│     }                                   │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  useMessages.ts                         │
│  ─────────────────────────────────────  │
│  Save response with:                    │
│  - content: "Document created! 📄"      │
│  - attachment_url: "data:..."           │
│  - attachment_type: "application/pdf"   │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  ResponseCard.tsx                       │
│  ─────────────────────────────────────  │
│  Render:                                │
│  ┌─────────────────────────────────┐    │
│  │ Document created successfully!  │    │
│  │                                 │    │
│  │ ┌───────────────────────────┐   │    │
│  │ │ 📄 Greenland.pdf [⬇️]     │   │    │ ← Download button
│  │ └───────────────────────────┘   │    │
│  │                                 │    │
│  │ (30 credits • 70 remaining)    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                │
                ▼
User clicks [⬇️] → openDocumentUrl() → Browser downloads PDF
```

## Why This Works

1. **Data URL stays intact** - Not embedded in markdown, so no parsing issues
2. **Clean user experience** - Dedicated download button is clearer than a text link
3. **Works with ad-blockers** - Data URLs bypass network requests entirely
4. **Preserves existing logic** - `openDocumentUrl()` already handles data URLs correctly
