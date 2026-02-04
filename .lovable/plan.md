

## Plan: Fix PDF Drawing Parser for Gemini 3 Flash

### Problem Summary
The `parse-pdf-drawing` edge function was migrated from OpenAI GPT-4o to Gemini 3 Flash via the Lovable AI Gateway. However, the image format used is **incorrect for PDF files**. The code uses:
```typescript
{ type: "image_url", image_url: { url: "data:application/pdf;base64,..." } }
```

This `image_url` format works for images (PNG, JPEG) but **not for PDFs**. PDFs require the newer `file` type format supported by OpenAI-compatible APIs.

### Solution

Update the message format in `parse-pdf-drawing` to use the correct `file` type for PDF content:

```text
Before (incorrect for PDFs):
┌─────────────────────────────────────┐
│  type: "image_url"                  │
│  image_url: {                       │
│    url: "data:application/pdf;..."  │
│  }                                  │
└─────────────────────────────────────┘

After (correct for PDFs):
┌─────────────────────────────────────┐
│  type: "file"                       │
│  file: {                            │
│    filename: "drawing.pdf"          │
│    file_data: "data:application/..."|
│  }                                  │
└─────────────────────────────────────┘
```

### Technical Changes

**File: `supabase/functions/parse-pdf-drawing/index.ts`**

1. **Update CORS headers** - Add all required headers for Lovable AI Gateway compatibility

2. **Change message format** (lines 116-129) - Replace `image_url` format with `file` format:
   - Change `type: "image_url"` to `type: "file"`
   - Replace `image_url: { url: ... }` with `file: { filename: fileName, file_data: ... }`

3. **Keep existing functionality** - All parsing logic, fallback extraction, and terrain analysis remain unchanged

### Files to Modify
| File | Changes |
|------|---------|
| `supabase/functions/parse-pdf-drawing/index.ts` | Update message format from `image_url` to `file` type |

### Expected Outcome
- PDF engineering drawings will be properly analyzed by Gemini 3 Flash
- Survey points, elevations (NGL/FGL), and coordinate data will be extracted
- Confidence scoring will work correctly
- Error handling for rate limits (429) and credits (402) remains in place

### Testing
After implementation:
1. Upload a PDF engineering drawing in the Design Review mode
2. Verify the parsing succeeds and extracts points/elevations
3. Check console logs for any errors from the Lovable AI Gateway

