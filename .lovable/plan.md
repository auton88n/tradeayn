
## Fix Document Download: Blocked URL and Layout Issues

### Problem 1: Download navigates to blocked URL
The `openDocumentUrl` function in `documentUrlUtils.ts` opens Supabase Storage URLs via `anchor.target = '_blank'`, which navigates the browser to `dfkoxuokfkttjhfjcecx.supabase.co`. Chrome (or ad blockers) blocks this domain, showing "ERR_BLOCKED_BY_CLIENT".

**Fix**: Instead of navigating to the URL, fetch the file as a blob in JavaScript and trigger a download via a temporary blob URL. This avoids the browser ever navigating to the Supabase domain.

### Problem 2: Download card overflows response card
The `DocumentDownloadButton` renders inside the scrollable content area but may push content below the visible area. The card itself looks fine -- the real issue is that clicking it navigates away (Problem 1), so the user never sees the response fully.

Both problems are solved by making the download happen in-place without navigation.

### Changes

**File: `src/lib/documentUrlUtils.ts`** -- Rewrite `openDocumentUrl`
- For HTTPS URLs: use `fetch()` to download the file as a blob, then create a temporary `blob:` URL and trigger download via an anchor click. This never navigates away from the page.
- For data URLs: keep the existing anchor-click approach (already works).
- Add a loading/error state via a simple toast notification so the user knows the download is in progress.

**File: `src/components/eye/DocumentDownloadButton.tsx`** -- Add download state
- Show a loading spinner while the file is being fetched.
- Disable the button during download to prevent double-clicks.

### Technical Details

The key change in `openDocumentUrl`:

```text
Before: anchor.href = url; anchor.target = '_blank'; anchor.click();
         --> Browser navigates to supabase.co --> BLOCKED

After:  fetch(url) --> response.blob() --> URL.createObjectURL(blob)
        --> anchor.href = blobUrl; anchor.download = filename; anchor.click();
        --> File downloads directly, no navigation
```

This pattern is ad-blocker-proof because the fetch happens in JavaScript and the download uses a local `blob:` URL that browsers never block.

**Files to modify:**
- `src/lib/documentUrlUtils.ts` -- fetch-and-download approach
- `src/components/eye/DocumentDownloadButton.tsx` -- loading state
