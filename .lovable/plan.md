

## Fix Download Dropdown and Remove Design Button

### Problem 1: Download dropdown shows "PDF (.pdf)" for image-only responses
When the user asks AYN to generate an image, the LLM response sometimes includes a markdown link to a PDF (or the image URL gets falsely matched as a document URL). This makes `hasBoth` true, showing a confusing dropdown with "PDF (.pdf)" and "Image (.png)" options -- but the PDF option either fails or downloads the wrong thing.

**Fix**: When the detected "document link" URL is the same as the detected image URL (or when the doc link points to an image file, not an actual PDF/Excel), skip showing it as a document. This ensures only the "Download" button (single-click for the image) appears instead of the misleading dropdown.

### Problem 2: "Design" button should be removed
The bottom-right "Design" button (which opens Design LAB) is not needed. The user explicitly asked to remove it.

**Fix**: Remove the Design button and its associated `handleDesignThis` callback from `ResponseCard.tsx`.

### Changes

**File: `src/components/eye/ResponseCard.tsx`**

1. Remove the "Design" button block (lines 675-684) that renders the Palette icon and "Design" text
2. Remove the `handleDesignThis` callback (lines 153-163) and the `Palette` import since they are no longer used
3. Fix the download logic: when determining `hasDoc`, add a check that the doc link URL is NOT the same as the `detectedImageUrl` -- this prevents images from being falsely offered as "PDF" downloads
4. Remove the `useNavigate` import and `navigate` variable if only used by handleDesignThis
5. Remove the `persistDalleImage` import if only used by handleDesignThis

### Technical Detail

```text
// Line 574-577: Add guard so image URLs aren't treated as doc links
const docLink = documentAttachment 
  ? { ... }
  : extractBestDocumentLink(combinedContent);
// NEW: If the "doc" link is actually the image URL, ignore it
const hasDoc = !!docLink && docLink.url !== detectedImageUrl;

// Lines 675-684: Remove Design button entirely
// Lines 153-163: Remove handleDesignThis callback
// Line 18: Remove Palette import
// Line 34: Remove persistDalleImage import (if unused elsewhere)
```

| Area | Change |
|------|--------|
| Download logic | Skip doc link when it matches the image URL |
| Design button | Remove entirely |
| Cleanup | Remove unused imports (Palette, persistDalleImage, useNavigate if unused) |

