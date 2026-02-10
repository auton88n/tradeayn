

# Conversational Creative Studio with AYN AI + Higher Quality Images

## Overview

Transform the Creative Editor from a "configure settings then click generate" tool into a **conversational experience** where you chat with AYN about what you want, and AYN creates and iterates on the image. Also upgrade image quality to the pro model and add proper download functionality.

## Changes

### 1. Upgrade Image Model (Edge Function)

**File: `supabase/functions/twitter-generate-image/index.ts`**

- Change model from `google/gemini-2.5-flash-image` to `google/gemini-3-pro-image-preview` for significantly higher quality output
- Keep the same prompt structure -- just swap the model ID on line 87

### 2. New Edge Function: `twitter-creative-chat`

**New file: `supabase/functions/twitter-creative-chat/index.ts`**

A conversational AI endpoint where AYN acts as a creative director. The user describes what they want, AYN asks clarifying questions, then generates/refines the image.

- Uses `google/gemini-3-pro-image-preview` for image generation
- Has a system prompt that makes AYN act as a brand-aware creative director for AYN's marketing
- Accepts conversation history (messages array) + current creative params
- When AYN decides to generate, it calls the image model and returns the result
- Uploads to `generated-images` storage bucket (same as existing flow)
- Can also return text-only responses for the conversation phase

Flow:
1. User says "I want a dark techy image with our tagline"
2. AYN responds: "nice -- i'm thinking dark navy with grid lines, your tagline centered in a clean sans-serif. want the eye logo as a watermark? any specific accent color?"
3. User says "yes logo, use blue accent, and add a CTA saying Try AYN Free"
4. AYN generates the image with those specs and returns it
5. User says "make the text smaller and move the CTA higher"
6. AYN regenerates with adjustments

### 3. Redesign Creative Editor with Chat Interface

**File: `src/components/admin/marketing/CreativeEditor.tsx`** -- Full rewrite

New layout (still a dialog, but completely different UX):

```text
+--------------------------------------------------+
|  AYN Creative Studio                          [X] |
+--------------------------------------------------+
|                    |                              |
|   PREVIEW AREA     |   CHAT WITH AYN             |
|   (60%)            |   (40%)                     |
|                    |                              |
|  [Generated image  |  AYN: hey! tell me what     |
|   or AYN branded   |  kind of creative you're    |
|   placeholder]     |  imagining for this tweet.   |
|                    |                              |
|                    |  You: dark background with   |
|                    |  the AYN eye logo            |
|                    |                              |
|                    |  AYN: got it -- generating   |
|                    |  a dark navy creative with   |
|                    |  grid lines and your eye...  |
|                    |                              |
|                    |  [image generated!]          |
|                    |                              |
|                    +------------------------------+
|                    | [Type your idea...]   [Send] |
|  [Download]        +------------------------------+
+--------------------------------------------------+
```

Key features:
- **Left panel**: Live preview of current/latest image, with Download button overlay
- **Right panel**: Chat messages with AYN (scrollable), input at bottom
- AYN's first message is auto-generated based on the tweet text: "hey! i see your tweet is about [topic]. want me to create a visual for it? tell me the vibe -- light, dark, colorful? any specific text overlay?"
- Quick-action chips below the chat input for common requests: "Dark theme", "Light & clean", "Add CTA", "Regenerate", "Make text smaller"
- The manual controls (background, colors, logo) are still available as a collapsible "Manual Controls" section below the chat, for power users who want direct control
- Download button works via creating a temporary `<a>` element with `download` attribute for proper file download (not just opening in new tab)

### 4. Proper Download Function

Instead of `window.open()` which just opens in a new tab, implement actual file download:

```typescript
const downloadImage = async (url: string, filename?: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename || 'ayn-creative.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};
```

This will trigger a real browser download dialog.

### 5. Update TwitterMarketingPanel Integration

**File: `src/components/admin/TwitterMarketingPanel.tsx`**

- Pass the `post_id` to CreativeEditor so the chat function can save images to the correct post
- When CreativeEditor generates an image via chat, update the post's `image_url` in local state

## File Summary

| File | Action |
|------|--------|
| `supabase/functions/twitter-generate-image/index.ts` | Edit -- swap model to `google/gemini-3-pro-image-preview` |
| `supabase/functions/twitter-creative-chat/index.ts` | New -- conversational creative AI endpoint |
| `src/components/admin/marketing/CreativeEditor.tsx` | Rewrite -- chat-based UI with AYN conversation |
| `src/components/admin/TwitterMarketingPanel.tsx` | Edit -- pass `post_id`, handle chat-generated images |

## Technical Notes

- The `twitter-creative-chat` edge function uses the same storage upload pattern as `twitter-generate-image` (upload base64 to `generated-images` bucket, return public URL)
- AYN's creative director personality matches the existing casual tone from `ayn-unified` ("hey", "nice", lowercase, no corporate speak)
- The chat history is kept in React state (not persisted to DB) since it's a session-based creative flow
- Quick-action chips send predefined messages to AYN, making common operations one-click
- The manual controls section is collapsible and starts collapsed -- chat-first experience
- Rate limit (429) and credit (402) errors from the AI gateway are caught and shown as toast notifications

