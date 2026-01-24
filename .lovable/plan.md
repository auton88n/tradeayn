

# Base64 Data URLs for Document Generation (Ad-blocker Proof)

## Goal
Replace Supabase Storage URLs with inline base64 data URLs for PDF/Excel documents. This completely bypasses ad-blockers since data URLs are embedded content - no external network requests that can be blocked.

## Current Problem
Ad-blockers block requests to `supabase.co` domains, causing document downloads to fail even with the proxy workaround. The current flow:
1. `generate-document` creates PDF/Excel → uploads to Supabase Storage → returns URL
2. Frontend tries to download from URL → **blocked by ad-blockers**

## New Approach
1. `generate-document` creates PDF/Excel → converts to base64 → returns data URL inline
2. Frontend receives data URL directly → triggers immediate download with no network request

**Data URL format:**
- PDF: `data:application/pdf;base64,JVBERi0xLjQ...`
- Excel: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQ...`

---

## Files to Modify

### 1. `supabase/functions/generate-document/index.ts`

**Remove:**
- `uploadToStorage()` function (lines 383-423)
- All Supabase Storage logic

**Add:**
- Base64 conversion after generating file buffer

**Current flow (lines 481-498):**
```typescript
// Upload to storage
const downloadUrl = await uploadToStorage(supabase, fileData, filename, ...);
return { success: true, downloadUrl, filename, type, language };
```

**New flow:**
```typescript
// Convert to base64 data URL (no storage needed)
const base64 = btoa(String.fromCharCode(...fileData));
const mimeType = body.type === 'pdf' 
  ? 'application/pdf' 
  : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const downloadUrl = `data:${mimeType};base64,${base64}`;

return { success: true, downloadUrl, filename, type, language };
```

### 2. `src/lib/documentUrlUtils.ts`

**Complete rewrite** - simplify to handle data URLs:

```typescript
/**
 * Check if URL is a base64 data URL
 */
export const isDataUrl = (url: string): boolean => {
  return url?.startsWith('data:');
};

/**
 * Downloads a document from a data URL or regular URL
 */
export const openDocumentUrl = (url: string, filename?: string): void => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'document';
  
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

/**
 * Extract document link from markdown content
 * Updated to handle data URLs
 */
export const extractBestDocumentLink = (content: string): {...} | null => {
  // Updated regex to match data URLs as well as http URLs
  ...
};
```

### 3. `src/components/eye/ResponseCard.tsx`

**Minor update** - pass filename to download function:

```typescript
// Line 464: Update onClick handler
onClick={() => openDocumentUrl(documentLink.url, documentLink.title)}
```

### 4. `supabase/functions/ayn-unified/index.ts`

**No changes needed** - it already passes through `downloadUrl` from `generate-document` response. The data URL flows through automatically.

### 5. Delete (Optional Cleanup)
- `supabase/functions/download-document/index.ts` - no longer needed for documents

---

## Technical Details

### Base64 Conversion in Deno
```typescript
// Uint8Array to base64 string
const base64 = btoa(String.fromCharCode(...fileData));
```

### Size Impact
| Document | Raw Size | Base64 Size | Acceptable |
|----------|----------|-------------|------------|
| 1-3 page PDF | 50-150KB | 67-200KB | ✅ |
| Excel (50 rows) | 20-50KB | 27-67KB | ✅ |
| Large report | 500KB | 667KB | ✅ |

Base64 adds ~33% overhead, but typical documents stay well under 1MB.

### Browser Support
Data URLs are supported in all modern browsers with no size limits for downloads via `<a download>`.

---

## Benefits

1. **100% ad-blocker proof** - data URLs are inline content
2. **Faster downloads** - no second network request
3. **No storage costs** - files aren't persisted in Supabase
4. **Simpler architecture** - remove proxy function and URL normalization
5. **No expired links** - data URLs contain the actual file
6. **Works immediately** - no waiting for upload/download

---

## Testing Checklist

1. Request a PDF document via chat ("create a PDF report about...")
2. Verify download button appears in ResponseCard
3. Click download - file should save immediately
4. Test with ad-blocker enabled - should work
5. Test Excel document generation
6. Test Arabic (RTL) documents
7. Verify filename is correct in downloaded file

