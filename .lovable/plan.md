

# Marketing HQ — Make It Actually Work

## Problems Identified

1. **AYN co-pilot is useless** — it says "what's the play today?" but can't actually DO anything meaningful. The [SCAN_URL] tag shows raw in the chat instead of being handled. Image generation responses just say "image generated" with a checkmark instead of showing the actual image.
2. **Layout is side-by-side columns** — Pipeline shows Draft/Scheduled/Posted as 3 cramped columns. You want them stacked vertically so each gets full width.
3. **No image generation for marketing** — There's no way to generate a standalone marketing image (image-only tweet). The Creative Editor only opens when you click a tiny camera icon on an existing draft.
4. **Image generation is boring** — The prompt generates text-heavy images. You want catchy, visual, design-forward marketing images with minimal text overlay — not paragraphs on a background.
5. **AYN has no design intelligence** — It doesn't suggest visual styles, search for inspiration, or propose creative directions. It just asks "what vibe?"

## What Changes

### 1. Fix the Co-Pilot so it actually works

- **Show generated images inline** in the chat (the `image_url` exists in the response but the UI only shows a tiny "image generated" text — will render actual image thumbnails)
- **Handle [SCAN_URL] properly** — the raw tag is leaking into chat. Will ensure the scan response is processed and the tag never shows to user
- **Add "Generate Image" as a first-class action** — new quick action button that generates a standalone marketing visual without needing a tweet first
- **Add "Image-Only Tweet" capability** — generate and post an image with just a short catchy overlay line, not a full 280-char tweet

### 2. Stack Pipeline columns vertically

Change the `grid-cols-3` side-by-side Kanban to a vertical stacked layout:
- **Drafts** section at top (full width)
- **Scheduled** section below
- **Posted** section at bottom
- Each section is collapsible with a header showing count
- Cards flow horizontally within each section (scrollable row) or as a clean list

### 3. Add image-first marketing mode

- New "Image Post" generation button alongside Tweet/Thread/Campaign
- When clicked, AYN generates a visually striking 1080x1080 image with:
  - Short catchy text (5-10 words max, not a paragraph)
  - Bold, eye-catching design (not boring text-on-white)
  - Brand colors and styling
- The image becomes the tweet content (image-only tweet with a short caption)
- Image preview shows directly in the pipeline card

### 4. Upgrade AYN's creative intelligence (backend)

Update `twitter-creative-chat` system prompt to:
- **Propose 2-3 visual concepts** when asked for images (e.g., "option 1: dark gradient with bold stat, option 2: split comparison, option 3: testimonial card")
- **Use design terminology** — talk about contrast, hierarchy, white space, focal points
- **Suggest catchy overlay text** — max 5-10 words, punchy hooks, not full sentences
- **Think visually first** — when generating images, default to striking visuals with minimal text, not text-heavy layouts

### 5. Upgrade image generation prompts

Update `twitter-generate-image` and the image gen in `twitter-creative-chat` to:
- Default to **bold, eye-catching** designs (not subtle/understated)
- Use **short overlay text** (5-10 words) not paragraphs
- Include variety: gradients, bold typography, geometric shapes, contrast
- Generate images that make people stop scrolling

## Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `MarketingCoPilot.tsx` | Show images inline in chat, add "Generate Image" quick action, fix scan_url display, add image-only tweet flow |
| `ContentPipeline.tsx` | Change from 3-column grid to stacked vertical sections with collapsible headers, add "Image Post" button, show image previews prominently |
| `MarketingCommandCenter.tsx` | Minor layout adjustments to support new flow |
| `twitter-creative-chat/index.ts` | Upgrade system prompt for design intelligence, add image-only tweet mode, improve visual concept proposals |
| `twitter-generate-image/index.ts` | Update prompt to generate bold/catchy images with short text overlay instead of paragraph-heavy designs |

### No new files or database changes needed

Everything hooks into existing infrastructure — just upgrading the prompts, UI rendering, and adding the image-post flow.

### Implementation order

1. Fix `MarketingCoPilot.tsx` — inline images, fix scan leak, add image generation action
2. Rewrite `ContentPipeline.tsx` — vertical stacked layout, image-first cards
3. Upgrade `twitter-creative-chat` system prompt — design intelligence + image-only mode
4. Upgrade `twitter-generate-image` prompt — bold visuals, short text
5. Deploy edge functions

