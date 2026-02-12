
# Fix PDF/Excel Downloads, Image Generation, and Image Display

## Problems Found

1. **PDF/Excel downloads redirect to landing page** -- The download function opens data URLs with `target="_blank"`, which navigates to the AYN website instead of downloading. For base64 data URLs, `target="_blank"` should not be used.

2. **Image generation uses a non-existent model** -- The code calls `google/gemini-2.5-flash-image-preview`, which does not exist. The correct model ID is `google/gemini-2.5-flash-image`.

3. **Image intent rarely triggers** -- Only 4 keywords are checked: "generate image", "create image", "draw", "picture of". Common phrases like "show me an image", "make me a picture", "image of", etc. all miss and fall through to regular chat. The LLM then hallucinates a fake `dalle.text2im` JSON tool call instead of actually generating an image.

4. **Generated images are never displayed** -- When image generation succeeds, the base64 image URL is stored in `labData` on the message object, but no component ever reads `labData`. The ResponseCard only looks for image URLs in the message *text* via regex matching `https://` URLs -- base64 data URLs never match.

## Fixes

### Fix 1: Document download function (`src/lib/documentUrlUtils.ts`)
- Remove `target="_blank"` for data URLs (they should use `download` attribute only)
- Keep `target="_blank"` only for regular HTTP URLs

### Fix 2: Correct image model ID (`supabase/functions/ayn-unified/index.ts`)
- Change `google/gemini-2.5-flash-image-preview` to `google/gemini-2.5-flash-image` in both the fallback chain and the `generateImage` function

### Fix 3: Expand image intent keywords (`supabase/functions/ayn-unified/intentDetector.ts`)
- Add missing keywords: "image of", "make image", "show me", "make a picture", "make me a picture", "photo of", "illustration of", "visualize", "render", "صورة", "ارسم", "image de", "dessine", "montre moi"

### Fix 4: Render generated images in ResponseCard (`src/components/eye/ResponseCard.tsx`)
- Extend `detectedImageUrl` to also check for base64 data URLs in message content
- Also check the message's `labData.json.image_url` field as a fallback source for image URLs

### Fix 5: Also fix the ai-edit-image function model (`supabase/functions/ai-edit-image/index.ts`)
- Change `google/gemini-2.5-flash-image-preview` to `google/gemini-2.5-flash-image`

## Technical Details

### `src/lib/documentUrlUtils.ts` -- lines 18-31
```typescript
export const openDocumentUrl = (url: string, filename?: string): void => {
  if (!url) return;
  
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'document';
  
  // Only use target="_blank" for HTTP URLs, not data URLs
  if (!url.startsWith('data:')) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};
```

### `supabase/functions/ayn-unified/intentDetector.ts` -- line 28
```typescript
const imageKeywords = [
  'generate image', 'create image', 'draw', 'picture of',
  'image of', 'make image', 'make a picture', 'make me a picture',
  'show me an image', 'photo of', 'illustration of', 'visualize',
  'render a', 'render an',
  'صورة', 'ارسم', 'ارسم لي', 'اعطني صورة',
  'image de', 'dessine', 'montre moi', 'genere une image'
];
```

### `supabase/functions/ayn-unified/index.ts` -- model fix
Change both occurrences of `google/gemini-2.5-flash-image-preview` to `google/gemini-2.5-flash-image`.

### `src/components/eye/ResponseCard.tsx` -- image detection
Extend `detectedImageUrl` to also detect base64 image data URLs and check `labData`:
```typescript
const detectedImageUrl = useMemo(() => {
  // Check labData first (from image generation)
  const firstResponse = visibleResponses[0];
  if (firstResponse && 'labData' in firstResponse) {
    const labUrl = (firstResponse as any).labData?.json?.image_url;
    if (labUrl) return labUrl;
  }
  // Existing: markdown image URLs
  const markdownMatch = combinedContent.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  if (markdownMatch) return markdownMatch[1];
  // Existing: plain HTTP image URLs
  const urlMatch = combinedContent.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/i);
  if (urlMatch) return urlMatch[1];
  // New: base64 data URL images
  const dataUrlMatch = combinedContent.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/);
  if (dataUrlMatch) return dataUrlMatch[1];
  return null;
}, [combinedContent, visibleResponses]);
```

## Expected Outcome
- PDF and Excel downloads will trigger a file download instead of navigating away
- Image generation will use the correct model and actually produce images
- More natural language phrases will trigger image generation instead of showing raw JSON
- Generated images will be visible in the chat response card
