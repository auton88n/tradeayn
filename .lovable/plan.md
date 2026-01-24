
## Plan: Fix Download Blocking and Add Document Generation Indicator

### Problem Analysis

**Issue 1: ERR_BLOCKED_BY_CLIENT**
The error `dfkoxuokfkttjhfjcecx.supabase.co is blocked` is caused by **browser extensions** (ad-blockers like uBlock Origin, or privacy tools like Privacy Badger) blocking the Supabase domain. This is NOT a code bug - the URL normalization we implemented is correct. The browser is blocking ALL requests to Supabase, including the download link.

**Workaround**: We can implement a **proxy download approach** that routes document downloads through your own domain, avoiding ad-blocker detection of the Supabase domain.

**Issue 2: No Document Generation Progress Indicator**
When a user requests a document (PDF/Excel), there's no visual feedback during the generation process. The user only sees the standard "thinking" indicator, then suddenly a download card appears. For document generation which can take 5-10 seconds, a specific progress indicator would improve UX.

---

### Implementation Plan

#### Part 1: Fix Ad-Blocker Blocking (Download Proxy)

Create an edge function that proxies document downloads, so the browser never sees the Supabase storage URL directly.

**Step 1: Create `download-document` Edge Function**
- Accepts a `path` parameter (e.g., `documents/user-id/filename.pdf`)
- Fetches the file from Supabase Storage using server-side credentials
- Returns the file with proper Content-Type and Content-Disposition headers
- The URL will be `your-domain/functions/v1/download-document?path=...` instead of `supabase.co/storage/...`

**Step 2: Update Response Handling**
- In `ayn-unified/index.ts`, return a proxy URL instead of direct Supabase URL
- The proxy URL uses the edge function endpoint which bypasses ad-blocker domain blocking

---

#### Part 2: Add Document Generation Progress Indicator

**Step 3: Add `isGeneratingDocument` State**
- In `useMessages.ts`, add a new state: `isGeneratingDocument: boolean`
- Set to `true` when intent is detected as `document` (before sending)
- Set to `false` when response is received

**Step 4: Create `DocumentGeneratingCard` Component**
- A visual card that appears during document generation
- Shows animated progress indicator
- Displays message like "Generating your PDF..." or "Creating Excel spreadsheet..."
- Supports multiple languages (EN/AR/FR)

**Step 5: Update `ResponseCard.tsx`**
- Before showing the download card, check if `isGeneratingDocument` is true
- If true, show the `DocumentGeneratingCard` instead
- When generation completes, transition smoothly to the download card

**Step 6: Update `CenterStageLayout.tsx`**
- Pass `isGeneratingDocument` prop down to `ResponseCard`
- Detect document intent from user message to trigger the indicator early

---

### Technical Details

| Aspect | Details |
|--------|---------|
| Files Created | 2 (`download-document` edge function, `DocumentGeneratingCard.tsx`) |
| Files Modified | 4 (`ayn-unified/index.ts`, `useMessages.ts`, `ResponseCard.tsx`, `CenterStageLayout.tsx`) |
| Complexity | Medium |
| Risk | Low - no existing functionality affected |

### Visual Flow After Implementation

```text
User asks: "Create a PDF about project management"
    |
    v
[Eye shows "thinking" + "Generating your PDF..." card appears]
    |
    v
[Card updates: "Almost ready..." with progress animation]
    |
    v
[Card transforms into Download card with button]
    |
    v
User clicks Download -> Opens via proxy (bypasses ad-blocker)
```

### About the Ad-Blocker Issue

**Important Note**: The `ERR_BLOCKED_BY_CLIENT` error is caused by browser extensions blocking the Supabase domain. This affects ALL Supabase functionality, not just downloads. If users see this error:

1. **Immediate Workaround**: Disable ad-blocker for your domain
2. **Our Fix**: The proxy approach routes downloads through your own domain, which ad-blockers typically don't block

The code-level URL normalization we already implemented is correct - signed URLs are properly converted to public URLs. The blocking happens at the network level before the request even reaches Supabase.
