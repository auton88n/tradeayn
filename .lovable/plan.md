
# AYN Marketing Creative Studio

## Summary

Transform the Twitter Marketing tab into a full **Marketing Creative Studio** inspired by Google's Pomelli/Banza campaign tool. This includes a brand kit section, a visual creative editor with live preview, campaign gallery view, and improved image generation with proper AYN branding.

## Part 1: Brand Kit Panel

Add a collapsible "Brand Kit" card at the top of the Twitter Marketing panel showing AYN's brand identity at a glance:

- **Logo**: AYN eye symbol (Brain icon with sparkles, matching the existing EmotionalEye component style)
- **Fonts**: Inter (primary), JetBrains Mono (code), Playfair Display (accent) -- already installed
- **Colors**: Brand palette swatches -- Primary blue (#0EA5E9), Foreground, Background, Muted, plus accent colors
- **One-liner**: "i see, i understand, i help"
- **Brand values**: Perceptive, Friendly, Intelligent

This is a static display component (no database changes needed), styled like the Banza brand kit screenshot.

## Part 2: Creative Editor Panel

When generating/editing a tweet's image, show a split-view creative editor (inspired by the Pomelli "Edit creative" panel):

**Left side**: Live image preview with the generated marketing graphic
**Right side**: Edit controls:
- Header text (editable, with AI rewrite button)
- Color theme selector (brand colors as clickable circles)
- Description toggle
- Call to action text
- Logo toggle (AYN eye on/off)
- Regenerate / Download buttons

These controls will be passed as parameters to the image generation prompt, giving the admin control over the creative output.

## Part 3: Campaign Gallery View

Add a "Campaign" tab/view that shows all generated creatives in a horizontal scrollable gallery (like the Banza campaign screenshot):
- Cards showing the generated images with their tweet text overlay
- Status badges (draft/posted)
- Quick actions (post, edit, delete)
- Filter by content type and audience

## Part 4: Fix Image Generation Prompt

Update `twitter-generate-image` to properly enforce AYN branding by passing structured parameters:
- Background color from brand kit (default: white)
- Text content and size
- Whether to include the AYN eye watermark
- Accent color for highlights
- Layout style (centered, left-aligned, etc.)

## Technical Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/TwitterMarketingPanel.tsx` | Major edit | Add Brand Kit, Creative Editor, Campaign Gallery |
| `src/components/admin/marketing/BrandKit.tsx` | Create | Brand identity display component |
| `src/components/admin/marketing/CreativeEditor.tsx` | Create | Split-view image editor with controls |
| `src/components/admin/marketing/CampaignGallery.tsx` | Create | Horizontal gallery of generated creatives |
| `supabase/functions/twitter-generate-image/index.ts` | Edit | Accept style parameters, improve prompt |

## Detailed Component Design

### BrandKit.tsx
A collapsible Card showing:
- AYN logo (Brain icon in a dark rounded square)
- Font samples using the installed @fontsource packages
- Color circles with hex values (#0EA5E9, #000000, #FFFFFF, #6B7280, #10B981)
- Brand tagline

### CreativeEditor.tsx
A Dialog/Sheet that opens when clicking "Image" on a tweet:
- Left: Image preview (or placeholder if not yet generated)
- Right: Collapsible sections for Image, Header, Colors, Description, CTA, Logo
- Header text input with character count
- Color picker using brand palette circles
- Generate/Regenerate button
- Download button

The selected options (background color, header text, CTA text, logo on/off) are sent to the edge function as parameters alongside the tweet text.

### CampaignGallery.tsx
A horizontal scroll container showing all posts that have images:
- Rounded card for each creative
- Image fills the card
- Tweet text overlaid at bottom
- Status badge corner

### Edge Function Updates
`twitter-generate-image` will accept additional optional parameters:
- `background_color`: "white" | "dark" | "blue" (default: "white")
- `header_text`: optional override text (defaults to tweet_text)
- `accent_color`: hex color (default: "#0EA5E9")
- `include_logo`: boolean (default: true)
- `cta_text`: optional call-to-action text

These get injected into the image generation prompt for more controlled output.

## UI Layout

The TwitterMarketingPanel will be restructured with tabs:

```text
+------------------------------------------+
|  Twitter Marketing                        |
|  [Creative Studio] [Campaign] [All Posts] |
+------------------------------------------+
|                                           |
|  Creative Studio tab:                     |
|  +-- Brand Kit (collapsible) -----------+ |
|  | Logo | Fonts | Colors | Tagline      | |
|  +--------------------------------------+ |
|  +-- Generate Tweet --------------------+ |
|  | Content Type | Audience | [Generate] | |
|  +--------------------------------------+ |
|  +-- Tweet List with Image Controls ----+ |
|  | Tweet card + [Image] button          | |
|  | Opens CreativeEditor dialog          | |
|  +--------------------------------------+ |
|                                           |
|  Campaign tab:                            |
|  +-- Horizontal gallery of creatives ---+ |
|  | [img1] [img2] [img3] [img4]          | |
|  +--------------------------------------+ |
+------------------------------------------+
```
