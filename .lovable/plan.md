
# Fix Excel Downloads, Image Display, and Response Card Cutoff

## Problem 1: Excel and Image Links Navigate to Landing Page

When the AI response contains markdown links with base64 data URLs (e.g., `[Download](data:application/vnd...)`), the `MessageFormatter` link renderer checks `isDocumentStorageUrl()`. This function correctly identifies PDF and Excel data URLs. However, for **image** data URLs (`data:image/png;base64,...`), `isDocUrl` returns `false`, so the link renders as a regular `<a target="_blank">` tag. Clicking it causes the browser to navigate away to the app's root route instead of downloading or displaying the image.

For Excel, the `DocumentDownloadButton` component works correctly (as seen with PDF in the screenshot), but if any markdown links with base64 data URLs leak into the content, they also trigger the same navigation bug.

### Fix in `src/components/shared/MessageFormatter.tsx`
- Update the `a` link renderer to intercept ALL `data:` URLs (not just document ones)
- For `data:` URLs: always call `e.preventDefault()` and use `openDocumentUrl()` to trigger a proper download
- Remove `target="_blank"` for data URLs (it causes browser navigation instead of download)

### Fix in `src/lib/documentUrlUtils.ts`
- Add `data:image/` to `isDocumentUrl` detection so image data URLs are also handled properly
- Or better: create a general `isDataUrl` check in the link handler that prevents navigation for any data URL

## Problem 2: Image Detection Misses Base64 Data URLs

In `ResponseCard.tsx` line 117, the `detectedImageUrl` regex only looks for `https?://` URLs in markdown images:
```
/!\[.*?\]\((https?:\/\/[^\s)]+)\)/
```
This completely misses `data:image/png;base64,...` URLs. So when an image is generated, it's embedded in markdown but never detected by the ResponseCard's separate image display logic.

### Fix in `src/components/eye/ResponseCard.tsx`
- Update the `detectedImageUrl` regex to also match `data:image/` URLs from markdown
- Pattern: `/!\[.*?\]\((data:image\/[^)]+)\)/` as a fallback match

## Problem 3: Response Card Gets Cut Off at Bottom

The content area has `max-h-[28vh] sm:max-h-[32vh]` (line 502), and the parent wrapper in `CenterStageLayout.tsx` uses `maxHeight: calc(100vh - ${footerHeight + 240}px)` with `overflow: hidden`. When the content + action bar + document button exceed this height, the bottom action bar (Copy, Download, thumbs up/down) gets clipped.

### Fix in `src/components/eye/ResponseCard.tsx`
- Increase the content area max-height from `max-h-[28vh] sm:max-h-[32vh]` to `max-h-[35vh] sm:max-h-[40vh]`
- Ensure the action bar uses `flex-shrink-0` so it never gets pushed out of view

### Fix in `src/components/dashboard/CenterStageLayout.tsx`
- Adjust the parent wrapper calculation to give more room: reduce the offset from 240px to 200px

## Technical Summary

| File | Change |
|------|--------|
| `src/components/shared/MessageFormatter.tsx` | Intercept all `data:` URLs in link handler, prevent navigation |
| `src/lib/documentUrlUtils.ts` | No change needed (already handles data URLs for documents) |
| `src/components/eye/ResponseCard.tsx` | (1) Add base64 image URL regex match (2) Increase max-height |
| `src/components/dashboard/CenterStageLayout.tsx` | Reduce maxHeight offset for more card space |

## Deployment
No edge function changes needed -- all fixes are client-side.
