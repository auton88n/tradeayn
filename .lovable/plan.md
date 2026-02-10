

# Fix Image Generation: White Background + Smaller Text

## Change

Update the image prompt in `supabase/functions/twitter-generate-image/index.ts` to use a **clean white background** with smaller, elegant text and proper AYN branding.

## Updated Prompt

Replace the current `imagePrompt` (lines ~37-49) with a refined version that specifies:

- **White/light background** -- clean, minimal, professional
- **Smaller text** -- tweet text at moderate size (~30% of image), not oversized
- **AYN eye symbol** -- subtle branding element in a corner
- **Accent colors**: electric blue (#0EA5E9) for highlights, dark text for readability
- **Engineering aesthetic**: subtle light gray grid lines, geometric patterns in background
- **Professional typography**: clean sans-serif, well-spaced, elegant layout

## File

| File | Change |
|------|--------|
| `supabase/functions/twitter-generate-image/index.ts` | Update `imagePrompt` string (~lines 37-49) |

## Technical Detail

The prompt will change from requesting a "dark navy/black background" to a white/light background with dark text and blue accents, keeping the engineering grid aesthetic but in a lighter palette.

