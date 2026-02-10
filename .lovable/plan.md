
# Branded Marketing Image Generation + Prompt Cleanup

## Summary

Two changes:
1. **Trim the marketing psychology prompt** -- it's ~100 lines long. Condense it to keep the same intelligence but be more token-efficient.
2. **Add AI brand image generation** -- when a tweet is generated, AYN can also create a professional branded marketing image with text overlay using Google Gemini image generation (already available via the Lovable AI Gateway).

## Part 1: Condense the Marketing Prompt

The current `MARKETING_PSYCHOLOGY_PROMPT` in `twitter-auto-market` is ~98 lines. It will be condensed to ~40 lines while preserving all the key intelligence:
- Merge the "who is AYN" section into a compact list
- Combine Cialdini's principles into a concise reference table
- Keep the rules but remove redundant explanations
- Keep the JSON output format unchanged

No behavior changes -- same quality output, fewer tokens, faster responses.

## Part 2: Branded Image Generation

Add a "Generate Image" capability to each tweet draft. When clicked, it calls Gemini's image generation model to create a professional branded marketing graphic featuring:
- The tweet text styled as a visual quote/poster
- AYN branding (logo reference, brand colors)
- Professional social media dimensions (1080x1080 for Instagram/X)
- Clean typography on stylized backgrounds

### How It Works

```text
User clicks "Generate Image" on a draft tweet
        |
        v
Edge function: twitter-generate-image
        |
        v
Calls Lovable AI Gateway with google/gemini-2.5-flash-image
Prompt: "Create a professional branded social media post..."
        |
        v
Returns base64 image -> uploads to Supabase Storage (generated-images bucket)
        |
        v
Saves image URL to twitter_posts.image_url column
        |
        v
Displays in the admin panel alongside the tweet text
```

### Technical Changes

| File | Action |
|------|--------|
| `supabase/functions/twitter-auto-market/index.ts` | Edit -- condense prompt to ~40 lines |
| `supabase/functions/twitter-generate-image/index.ts` | Create -- new edge function for brand image generation |
| `src/components/admin/TwitterMarketingPanel.tsx` | Edit -- add "Generate Image" button, image preview |
| Database migration | Add `image_url` column to `twitter_posts` table |
| `supabase/config.toml` | Add new function entry |

### Edge Function: `twitter-generate-image`

- Receives: `{ post_id, tweet_text }`
- Calls `google/gemini-2.5-flash-image` via Lovable AI Gateway with a prompt like:
  > "Create a professional 1080x1080 social media marketing image for an AI engineering platform called AYN. The image should feature this text: [tweet text]. Use a dark modern aesthetic with accent colors. Include subtle engineering/tech visual elements. The text should be bold, readable, and centered. Brand name 'AYN' should appear subtly."
- Uploads the returned base64 image to the `generated-images` Supabase Storage bucket
- Updates the `twitter_posts` row with the image URL

### UI Updates (TwitterMarketingPanel)

- Add an "Image" button next to each draft tweet (camera icon)
- When an image exists, show a thumbnail preview in the tweet card
- Clicking the thumbnail opens a larger preview
- Image can be downloaded or regenerated

### Database

- Add `image_url TEXT` column to `twitter_posts` table
