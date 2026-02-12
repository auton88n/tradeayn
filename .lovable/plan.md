
# Fix PDF/Excel Downloads, Image Generation, and Display -- Complete Fix

## Root Causes (3 separate issues)

### Issue 1: Edge function was never redeployed
The server logs confirm all recent requests show `Detected intent: chat` or `Detected intent: files`. The code changes from the previous fix (server-side fallback, JSON extraction) were written to the files but the `ayn-unified` edge function needs to be redeployed for them to take effect.

### Issue 2: Generated images are never shown to the user
When image generation succeeds, the server returns `{ imageUrl, content, ... }`. The client stores this as `labData` on the Message object. However:
- The `CenterStageLayout` extracts `message.attachment` but **never extracts `message.labData`** when creating the response bubble
- The `ResponseBubble` interface has no `labData` field
- Even if `detectedImageUrl` detects the image, **there is no `<img>` tag** in `ResponseCard.tsx` -- it only uses the URL for a "Design" button

### Issue 3: Document attachment flows correctly but may be blocked by JSON parsing
The document flow is correct in theory: server returns `documentUrl` in JSON, client maps it to `message.attachment`, which flows to `ResponseBubble.attachment`, which renders the `DocumentDownloadButton`. The blocker is that the LLM often fails to return valid JSON, so the document never gets generated.

## Fixes

### Fix 1: Redeploy the `ayn-unified` edge function
Force a redeployment so the server-side intent fallback and JSON extraction fixes take effect.

### Fix 2: Add image rendering to ResponseCard (`src/components/eye/ResponseCard.tsx`)
Add an `<img>` tag that renders when `detectedImageUrl` is detected. Place it between the message content and the document download button:

```typescript
{/* Generated image display */}
{detectedImageUrl && (
  <div className="px-3 pb-2">
    <img
      src={detectedImageUrl}
      alt="Generated image"
      className="w-full max-w-md rounded-lg border border-border"
      loading="lazy"
    />
  </div>
)}
```

### Fix 3: Pass `labData` through the bubble pipeline

**Option A (simpler)**: Instead of threading `labData` through the bubble system, embed the image URL directly in the message content as a markdown image when the server returns an `imageUrl`. This way it flows through naturally.

In `src/hooks/useMessages.ts`, when handling the non-streaming image response (around line 573-606), prepend the image to the response content:

```typescript
// If image was returned, embed it in the content for display
if (webhookData?.imageUrl) {
  const imageContent = `![Generated Image](${webhookData.imageUrl})`;
  response = imageContent + '\n\n' + responseContent;
}
```

This works because `StreamingMarkdown` and `MessageFormatter` already render markdown images, and the image URL is a base64 data URL that doesn't need external loading.

### Fix 4: Ensure document system prompt strictly enforces JSON
The system prompt already says "RESPOND ONLY WITH VALID JSON" -- this is correct. The retry mechanism in the edge function (stripping markdown fences, regex extraction) should catch most failures. The main fix is simply **deploying** the current code.

## Files to Change

1. **`supabase/functions/ayn-unified/index.ts`** -- Redeploy (no code changes needed, just deploy)
2. **`src/hooks/useMessages.ts`** -- Embed image URL in content when `webhookData.imageUrl` exists (~line 576)
3. **`src/components/eye/ResponseCard.tsx`** -- Add `<img>` rendering for `detectedImageUrl` (between content and document button, ~line 532)

## Expected Outcome
- Images will generate correctly and display inline in the chat
- PDF and Excel documents will generate (JSON extraction works with retry)
- Document download button will appear and trigger proper file downloads
