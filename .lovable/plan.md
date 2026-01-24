
Goal
- Fix PDF/Excel “Download” so it reliably opens even when the browser blocks direct Supabase Storage URLs.
- Ensure the “document generating” state stays as-is (it’s already implemented), but make the final “Download” button use the proxy endpoint (download-document edge function) instead of the raw Storage URL.

What I found (why it still fails)
- Document generation is working server-side:
  - `ayn-unified` returns `documentUrl` successfully (network shows 200 + a valid public storage URL).
  - `generate-document` logs show “Document created …pdf”.
- The failure is on the download step (your answer), and our UI is still opening the Storage URL directly:
  - `ResponseCard` “Download” button currently uses `anchor.href = documentLink.url` (a `/storage/v1/object/public/...` URL).
  - `MessageFormatter` link clicks also open `/storage/v1/object/...` URLs directly.
  - In your network snapshot, there were no browser calls to `/functions/v1/download-document`, which means the proxy is not being used from the UI.
- The proxy edge function itself works (I tested it directly):
  - Calling `/functions/v1/download-document?path=...` returns a real PDF with `Content-Type: application/pdf`.

Root cause
- We created the proxy function + helper utilities, but the “Download” button (and markdown links) are not wired to use `openDocumentUrl()` / `toProxyUrl()`. So the app still triggers the browser’s blocked path.

Implementation approach (no DB changes)
A) Wire the ResponseCard download button to the proxy
1) Update `src/components/eye/ResponseCard.tsx`
   - Remove the inline “create anchor and open documentLink.url” behavior.
   - Import and use `openDocumentUrl(documentLink.url)` (from `src/lib/documentUrlUtils.ts`) so it opens:
     - `.../functions/v1/download-document?path=...`
   - Also update the visible link (if any) / button behavior so right-click “Open in new tab” also uses the proxy URL (not just onClick). Best practice:
     - Set the underlying href to `toProxyUrl(documentLink.url)`.

B) Wire markdown document links to the proxy too (so clicking the 📄 link works)
2) Update `src/components/MessageFormatter.tsx`
   - Replace its local `normalizeDocumentUrl()` logic for storage links with:
     - `isDocumentStorageUrl(href)` and then `toProxyUrl(href)` or `openDocumentUrl(href)`
   - Behavior:
     - If link is a document storage URL (documents bucket / .pdf / .xlsx), prevent default and open via proxy.
     - For normal links, keep existing behavior.

C) Eliminate duplicate/fragile document parsing logic + make attachments the source of truth
3) Improve “which URL is the real document” selection (prevents wrong link selection in long chats)
   - `ResponseCard` currently has a large inline `extractBestDocumentLink()` implementation.
   - Replace it with imports from `src/lib/documentUrlUtils.ts` to keep it consistent everywhere.

4) Ensure the download card can render even if the text content doesn’t contain a markdown link
   - Right now ResponseCard only knows `content` from `responseBubbles`, not the message attachment metadata that we save in `useMessages`.
   - Update bubble plumbing so ResponseCard can see attachments:
     - Update `src/hooks/useBubbleAnimation.ts`:
       - Extend `ResponseBubble` to include optional `attachment?: { url: string; name: string; type: string }`.
       - Update `emitResponseBubble()` signature to accept an optional attachment.
     - Update `src/components/dashboard/CenterStageLayout.tsx`:
       - When emitting the response bubble from `lastMessage`, pass `lastMessage.attachment`.
     - Update `src/components/eye/ResponseCard.tsx`:
       - Prefer rendering the download card from `responses[0].attachment` when it’s a PDF/Excel.
       - Fall back to `extractBestDocumentLink(combinedContent)` only if there is no attachment.

D) Validation steps
5) Test end-to-end in the browser
   - Ask: “Create a PDF about Greenland” (or any topic).
   - Confirm:
     - You see the generating card during the request.
     - The download card appears after completion.
     - Clicking Download triggers a network request to:
       - `/functions/v1/download-document?path=...`
     - PDF opens without “blocked by client” behavior.

Files to change (expected)
- src/components/eye/ResponseCard.tsx
- src/components/MessageFormatter.tsx
- src/hooks/useBubbleAnimation.ts
- src/components/dashboard/CenterStageLayout.tsx
- src/lib/documentUrlUtils.ts (small enhancements only, e.g., avoid double-proxying)

Notes / edge cases handled
- If the file truly doesn’t exist in storage, proxy will return 404 cleanly (instead of confusing token/JWT errors).
- This fix does not depend on ad-blockers being installed; it addresses any client/network rule that blocks direct Storage URLs but still allows Edge Functions.

After you approve this plan, I’ll implement the wiring changes and then we’ll re-test the download button together.
