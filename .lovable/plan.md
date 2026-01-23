
Goal  
Make “Download PDF” reliably work by ensuring the UI always uses a valid, downloadable Storage URL (and never an invalid/expired “signed” URL), and by preventing the ResponseCard from accidentally grabbing the wrong link.

What we found (important)  
1) Supabase Storage is now correctly configured for public downloads:
- `documents` bucket is `public = true`.
- The “Public read for documents” RLS policy exists.
- I verified a real PDF file in storage is reachable via a public URL.

2) Your chat history contains a mix of document links:
- Some messages contain correct links: `/storage/v1/object/public/documents/...` (these are good).
- Some contain signed links: `/storage/v1/object/sign/documents/...?...token=...` (these are fragile/expire).
- At least one contains a broken signed link with NO `?token=...` and the referenced PDF doesn’t exist in `storage.objects` (so it will fail no matter what). This explains “download not working” even after the DB fix.

3) The frontend currently detects document links by regex-scanning the response text (markdown), not by using the backend’s structured fields like `documentUrl`. That means:
- If any older/invalid link is present in the visible response text, the “Download” button can point to the wrong URL.
- If the AI ever “hallucinates” a PDF link (like the non-existent one we saw), the UI will still render a download card for it.

Key fix strategy  
A) Frontend: Normalize document URLs (signed → public) + always pick the best/latest link  
B) Frontend: Prefer backend-provided `documentUrl` by saving it into the existing `messages.attachment_url` fields, instead of relying on markdown parsing alone  
C) UX: Make clicking download more compatible (use a real `<a href>` download/open behavior, not only `window.open`)

Implementation plan (code changes)

1) ResponseCard: robust document link selection
- In `src/components/eye/ResponseCard.tsx`:
  - Replace the current `documentLink` regex logic (which grabs the first match) with a “collect all matches” approach.
  - Pick the best candidate using this priority:
    1) Prefer URLs containing `/storage/v1/object/public/`
    2) Otherwise, take the last match (most recent link)
  - Add `normalizeDocumentUrl(url)`:
    - If URL contains `/storage/v1/object/sign/documents/`, convert it to `/storage/v1/object/public/documents/`
    - Strip any `?token=...` query
    - This prevents “Invalid JWT/token” errors and avoids expirations for public documents.

2) MessageFormatter: normalize document links in markdown too
- In `src/components/MessageFormatter.tsx`:
  - Inside the `a:` renderer, before opening the link, normalize it the same way:
    - signed-doc URL → public URL
  - Result: even old messages with signed links will still download via the public path (as long as the file exists).

3) Download button behavior: use an anchor-based download/open
- In `ResponseCard.tsx`, change the download action from `window.open(...)` to a proper `<a>` behavior (or programmatic “create an anchor and click it”):
  - This improves compatibility on browsers that are stricter about `window.open`.
  - Still opens in a new tab, but in a way that’s less likely to be blocked.

4) Make document downloads “source-of-truth” from backend response (prevents hallucinated links)
- In `src/hooks/useMessages.ts`:
  - When `webhookData.intent === 'document'` and `webhookData.documentUrl` exists:
    - Save the document URL into the AYN message as an attachment:
      - `attachment_url = webhookData.documentUrl`
      - `attachment_name = filename-like label (derive from title or use “Document”)`
      - `attachment_type = webhookData.documentType === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'`
    - Optionally remove the raw markdown link from `content` so you don’t get duplicate “link + card”.
  - This uses your existing DB columns (`attachment_url`, `attachment_name`, `attachment_type`) — no schema changes required.

5) ResponseCard: prefer attachments when present (best reliability)
- Still in `ResponseCard.tsx`:
  - If the current AYN message has `attachment` with type pdf/excel, render the download card from that attachment.
  - Only fall back to parsing markdown if no attachment exists (backward compatibility).

How this fixes your specific symptom (“Invalid JWT” on download)
- Even if the visible text contains a signed URL (or the UI accidentally picks an older signed URL), the app will convert it to the public URL before opening.
- Public URLs don’t rely on JWT tokens, so the “Invalid JWT / token error” goes away.
- If the link was hallucinated and the file doesn’t exist, you’ll get a clean “Object not found / 404” instead of a confusing JWT error — and with step (4)/(5), we stop showing download cards for hallucinated links entirely.

Validation steps after implementation
1) Generate a fresh PDF from chat (“make me a pdf about …”).
2) Confirm:
   - The message shows the download card.
   - Clicking Download opens the PDF successfully.
3) Click an older signed-link message:
   - It should still open via the normalized public URL (if the file exists).
4) Confirm there are no “Invalid JWT” errors in the download flow.

Contingency (if you still see “Invalid JWT” after these changes)
- We’ll capture the exact URL being opened by logging it (in the click handler) and compare it to the known-good public URL pattern.
- This will quickly tell us whether the user is still being sent to a `/sign/` URL or to a non-existent object path.
