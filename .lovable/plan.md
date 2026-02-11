

# Add Voice Support and Image Sending to AYN Marketing Bot

## What's Changing

Two upgrades to the marketing Telegram bot:

### 1. Voice Message Understanding
The marketing bot currently rejects voice messages with "send me text or photos." We'll add a `handleVoice` function (mirroring the admin bot's existing voice handler) so the social media creator can speak ideas, feedback, or requests instead of typing.

### 2. Image Generation + Telegram Delivery (Already Partially Working)
The image generation and Telegram sending already works via `handleImageGeneration()` which calls `sendPhoto`. No changes needed here -- it already generates images with Gemini and sends them as photos in the marketing Telegram chat. We'll verify it's solid and ensure the voice handler can also trigger image generation if the creator asks via voice.

---

## Technical Details

### File: `supabase/functions/ayn-marketing-webhook/index.ts`

**Add voice/audio handler (new function):**
- Add a `handleCreatorVoice` function that:
  1. Downloads the voice file from Telegram API (`getFile` + fetch binary)
  2. Converts to base64 using the existing `arrayBufferToBase64` helper
  3. Sends to Gemini (`google/gemini-3-flash-preview`) with the marketing persona context for transcription + response
  4. Checks if the AI response contains `[GENERATE_IMAGE]` -- if so, triggers image generation flow
  5. Saves the exchange to `ayn_mind` as `marketing_chat` / `marketing_ayn`
  6. Enforces 5-minute max duration limit

**Update message routing (lines 141-151):**
- Add a voice/audio check before the text-only gate:
```text
if (message.voice || message.audio) {
  -> handleCreatorVoice(...)
  -> return
}
```
- Update the fallback message from "send me text or photos" to "send me text, photos, or voice messages"

**Voice handler flow:**
```text
Voice message received
  |
  Download audio from Telegram
  |
  Convert to base64
  |
  Send to Gemini with marketing persona
  "Transcribe and respond as the marketing brain"
  |
  Check response for [GENERATE_IMAGE]
  |   YES --> trigger handleImageGeneration()
  |   NO  --> send text reply
  |
  Save to ayn_mind (marketing_chat + marketing_ayn)
  |
  Trigger pruneMarketingHistory() (non-blocking)
```

### No database changes needed
The existing `ayn_mind` table already supports all required types.

### Deployment
Redeploy `ayn-marketing-webhook` edge function after changes.
