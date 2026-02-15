

## Fix: Inline Images and Direct Downloads in Response Card

### Problem 1: Image shows as a link instead of inline
The image URL (`https://...supabase.co/storage/...`) is embedded as `![Generated Image](url)` in the markdown content. Ad-blockers or CORS may block loading images from the Supabase domain, causing the image to show as a broken link instead of rendering inline. The user then clicks the link text and gets navigated to the raw Supabase URL.

### Problem 2: Document download link navigates away
The download link in the response content navigates the browser to the Supabase URL (or falls back to the landing page when blocked), instead of downloading the file in-place.

---

### Solution

**1. Fix image rendering in MessageFormatter (`src/components/shared/MessageFormatter.tsx`)**

Update the `img` component to handle blocked images gracefully:
- Add an `onError` fallback that fetches the image as a blob and re-renders it using a local `blob:` URL (same fetch-as-blob pattern used for documents)
- This bypasses ad-blockers since the image data is fetched via JavaScript, not by the browser's image loader
- Remove the click-to-navigate behavior -- keep only the lightbox (click to zoom)

**2. Fix all links to Supabase storage in MessageFormatter (`src/components/shared/MessageFormatter.tsx`)**

Update the `a` component to intercept ALL Supabase storage URLs (not just ones with `.pdf`/`.xlsx` extensions):
- Add detection for `supabase.co/storage` URLs in the link handler
- When clicked, use `openDocumentUrl` (fetch-as-blob) instead of navigating
- This ensures clicking "Download your 5-Day Schedule here" triggers a proper download

**3. Update `isDocumentUrl` in `documentUrlUtils.ts`**

Expand the URL detection to also match Supabase storage URLs:
- Add check for URLs containing `supabase.co/storage/v1/object`
- This ensures the link handler in MessageFormatter correctly intercepts these URLs

### Technical Details

**File: `src/lib/documentUrlUtils.ts`**
- Update `isDocumentUrl` to also match `supabase.co/storage` URLs

**File: `src/components/shared/MessageFormatter.tsx`**
- `img` component: Add `onError` handler that fetches the image as a blob and sets `src` to a blob URL, with a state to track blob-converted URLs
- `a` component: Also check if `href` contains `supabase.co/storage` to intercept those links for download

**File: `src/components/eye/ResponseCard.tsx`**
- `detectedImageUrl`: No changes needed -- it already extracts image URLs from markdown

### What the user will see after the fix

- **Images**: Render inline in the response card. If the browser blocks the direct load, the image auto-fetches via JavaScript and displays anyway. Clicking opens a zoom lightbox (no navigation).
- **Documents**: Clicking "Download your 5-Day Schedule here" triggers a direct file download. No page navigation, no visible Supabase URL.

