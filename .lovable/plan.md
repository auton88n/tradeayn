

# Creative Studio Power Upgrade: Smarter AYN + URL Brand DNA + Better UX

## Overview

Three major upgrades to make the Creative Studio genuinely powerful:

1. **Editable everything** -- Brand Kit becomes fully editable (colors, fonts, tagline)
2. **URL-based Brand DNA extraction** -- Give AYN a website URL and it analyzes the site to extract brand identity (colors, fonts, style, tone) and uses that to create marketing visuals
3. **Smarter AYN personality** -- Upgraded system prompt that makes AYN think like a real marketer and sales expert, not just an image generator
4. **Chat auto-scroll fix** -- Ensure chat always scrolls to bottom when new messages arrive

## Changes

### 1. Editable Brand Kit (`BrandKit.tsx`)

Add edit mode to the Brand Kit so you can change:
- Brand colors (click a swatch to open a color picker / hex input)
- Font selections
- Tagline text
- Brand traits/values

Store edits in component state (and optionally in localStorage for persistence). Pass the current brand kit values down to the Creative Editor so AYN knows your actual brand when generating.

### 2. New Edge Function: `twitter-brand-scan` 

A new edge function that takes a URL and:
1. Calls Firecrawl's scrape API with `formats: ['branding', 'markdown', 'screenshot']` to extract the website's brand identity
2. Returns structured brand DNA: colors, fonts, typography, logo URL, tone of voice, key messaging
3. AYN then uses this data to create marketing visuals that match the scanned brand

Since Firecrawl isn't connected yet, the plan will prompt you to connect the Firecrawl connector. Alternatively, we can use a simpler approach: use the AI gateway to analyze a screenshot of the website (via SCREENSHOTONE_API_KEY which is already configured).

**Recommended approach**: Use ScreenshotOne to capture the website, then send the screenshot to Gemini vision to extract brand DNA (colors, typography, style, messaging). This avoids needing a new connector.

Flow:
1. User pastes a URL in the Creative Studio chat: "scan https://example.com and create something matching their brand"
2. AYN calls the `twitter-brand-scan` function
3. The function screenshots the website, sends to Gemini for brand analysis
4. Returns brand DNA (colors, fonts, tone, key visuals)
5. AYN uses this data in its next image generation prompt

### 3. Upgraded System Prompt (`twitter-creative-chat`)

Transform AYN from a simple image generator into a marketing and sales expert:

- **Marketing strategist**: Understands audience targeting, hook psychology, CTA optimization
- **Sales copywriter**: Knows AIDA framework, PAS framework, social proof techniques  
- **Brand consultant**: Can analyze competitors, suggest positioning, recommend visual strategies
- **Design director**: Strong opinions on composition, color theory, typography hierarchy

New capabilities in the prompt:
- When user shares a URL, detect `[SCAN_URL]` intent and call brand scan
- Suggest marketing angles based on the tweet content
- Recommend optimal image styles for different platforms (Twitter vs Instagram)
- Provide A/B testing suggestions for creatives

### 4. Chat Auto-Scroll Fix (`CreativeEditor.tsx`)

The current scroll uses `scrollRef.current.scrollTop = scrollRef.current.scrollHeight` but `scrollRef` points to a div inside `ScrollArea`, not the scroll viewport. Fix:
- Use `scrollRef` on the inner content div and call `scrollIntoView({ behavior: 'smooth' })` on a sentinel div at the bottom
- Add a small delay to account for DOM updates

### 5. URL Input in Creative Editor

Add a "Scan URL" button/chip and a URL input field in the chat interface. When a user types or pastes a URL, AYN detects it and offers to scan the brand. Quick chip added: "Scan a website".

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/twitter-brand-scan/index.ts` | Screenshot + AI vision brand analysis |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/marketing/BrandKit.tsx` | Add edit mode for colors, fonts, tagline |
| `src/components/admin/marketing/CreativeEditor.tsx` | Auto-scroll fix, URL scan chip, pass brand kit context |
| `supabase/functions/twitter-creative-chat/index.ts` | Upgraded marketer/sales system prompt, URL scan detection |
| `src/components/admin/TwitterMarketingPanel.tsx` | Pass brand kit state to CreativeEditor |
| `supabase/config.toml` | Register new edge function |

### Brand Scan Edge Function Architecture

```text
User pastes URL
      |
      v
twitter-brand-scan function
      |
      +-- 1. Call ScreenshotOne API (screenshot of the website)
      |
      +-- 2. Send screenshot to Gemini vision:
      |       "Analyze this website screenshot and extract:
      |        - Primary/secondary/accent colors (hex)
      |        - Typography style (serif, sans-serif, mono)
      |        - Overall aesthetic (minimal, bold, playful, corporate)
      |        - Key messaging/taglines visible
      |        - Brand personality traits"
      |
      +-- 3. Return structured brand DNA JSON
```

### Upgraded AYN System Prompt (Key Additions)

AYN will now know:
- **AIDA framework** (Attention, Interest, Desire, Action) for CTA optimization
- **Color psychology** (blue = trust, red = urgency, green = growth)
- **Platform-specific best practices** (Twitter: bold text, high contrast; Instagram: lifestyle, aspirational)
- **Audience profiling** integration with the existing psychology intelligence
- **Competitor analysis** when given a URL to scan
- **Hook writing** -- first 7 words matter most

### Auto-Scroll Fix

```typescript
// Add a sentinel div at the bottom of messages
const bottomRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  // Small delay for DOM update + animation
  const timer = setTimeout(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
  return () => clearTimeout(timer);
}, [messages, isLoading]);

// In JSX, after the loading indicator:
<div ref={bottomRef} />
```

### Editable Brand Kit State

```typescript
interface BrandKitState {
  colors: { name: string; hex: string }[];
  fonts: { name: string; usage: string }[];
  tagline: string;
  traits: string[];
}
```

Colors will be editable via clicking a swatch to reveal an inline hex input. Fonts will have a dropdown selector. The tagline and traits are editable text fields. All changes persist to localStorage under `ayn-brand-kit`.

