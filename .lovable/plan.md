

# Corrected: AYN Marketing Bot -- Brand and Design Rules

## What Was Wrong in the Previous Plan

1. **Brand colors wrong**: Said "Primary Blue #0EA5E9" as AYN's identity color. **Correction**: AYN's brand is **black and white**. The blue is just an accent, not the identity.
2. **Image text too long**: Said "5-10 words max on visuals". **Correction**: **3-4 words MAX** on any generated image. Ultra-short, punchy, impossible to miss.
3. **Icon wrong**: Said "AYN eye icon watermark". **Correction**: AYN uses whatever logo/icon the admin provides via Telegram (brain icon, custom logo, etc.) -- not a hardcoded eye. The bot should accept a logo image from the admin and use it.
4. **"Color theory, typography hierarchy, visual weight" and "Competitive positioning"**: These were listed as brand elements. **Correction**: These are AYN's **skills/knowledge**, not brand attributes. AYN knows these disciplines and applies them -- they're not part of the brand kit itself.

## Corrected Brand DNA (Baked Into the Bot)

```text
AYN BRAND IDENTITY:
- Colors: BLACK (#000000) and WHITE (#FFFFFF). That's it. Clean, bold, monochrome.
- Blue (#0EA5E9) is an ACCENT only -- used sparingly for highlights, not as brand identity
- Typography: Inter (primary), JetBrains Mono (technical), Playfair Display (accent headlines)
- Tagline: "i see, i understand, i help"
- Personality traits: Perceptive, Friendly, Intelligent
- Logo: provided by admin via Telegram (brain, custom icon, etc.) -- stored and reused
- Visual style: MINIMAL. Black/white dominance, bold typography, max negative space
- Identity: "AYN, built by the AYN Team" -- NEVER mention Google, Lovable, Gemini, or any provider
```

## Corrected Image Generation Rules

```text
IMAGE RULES (NON-NEGOTIABLE):
- MAX 3-4 WORDS on any image. Not 5. Not 10. THREE TO FOUR.
- Examples of good overlay text: "AI builds faster" / "Ship or die" / "Zero to deploy"
- Black and white dominant. Blue accent ONLY for one highlighted word or element.
- The text IS the design. Huge, bold, centered.
- Logo/watermark: use whatever the admin has provided, bottom-right corner, subtle
- Every image should look like a premium black-and-white print ad with one pop of blue
```

## Corrected Bot Knowledge (Skills, Not Brand)

AYN knows and applies these as **expertise**, not brand elements:
- **Color theory**: contrast, complementary colors, visual hierarchy
- **Typography hierarchy**: font weight, size ratios, kerning for impact
- **Visual weight**: where the eye goes first, focal points, balance
- **Competitive positioning**: analyzing competitors, finding gaps, differentiation angles
- **Human psychology**: Cialdini, AIDA, PAS, loss aversion, FOMO, social proof
- **X/Twitter strategy**: hooks (first 7 words), threads, engagement psychology, timing

## Technical Changes

### File: `supabase/functions/ayn-marketing-webhook/index.ts` (NEW)

The system prompt will embed the corrected brand DNA above and the corrected image rules. Key differences from previous plan:

1. **Brand section** uses black/white as primary, blue as accent only
2. **Image generation prompts** enforce 3-4 word limit, black/white dominance
3. **Logo handling**: bot accepts a logo image via `/setlogo` command, stores it in Supabase storage, and references it in all image generation prompts
4. **Identity guard**: hard block on revealing AI providers

### File: `supabase/functions/ayn-telegram-webhook/commands.ts`

Add admin oversight commands (same as before):
- `cmdMarketingReport` -- shows creator's drafts, quality scores
- `cmdApprovePost` / `cmdRejectPost` -- approve/reject from admin bot

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

Wire the new admin actions and update prompt to include them.

### File: `supabase/functions/twitter-brand-scan/index.ts`

Fix the base64 overflow bug (chunked approach).

### File: `supabase/functions/twitter-creative-chat/index.ts`

Update the image generation section to enforce 3-4 word max and black/white dominant design.

### File: `supabase/functions/twitter-generate-image/index.ts`

Update the image prompt builder to default to black/white with blue accent, and enforce the 3-4 word text limit.

### Database Migration

- Add `marketing_chat` and `marketing_ayn` to `ayn_mind_type_check` constraint
- Add `created_by_name` column to `twitter_posts`

### Secrets Needed

- `TELEGRAM_MARKETING_BOT_TOKEN` -- new bot from @BotFather
- `TELEGRAM_MARKETING_CHAT_ID` -- creator's Telegram chat ID

## Result

AYN Marketing Bot with the **correct** brand identity (black/white, not blue), **correct** image rules (3-4 words max), and real social media expertise baked in as knowledge -- not confused with brand elements.
