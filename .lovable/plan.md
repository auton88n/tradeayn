

# Fix Emotions, Colors, and Add Sound to Like/Dislike

## What's Being Fixed

### 1. Emotion Color Refinement

The current emotion colors need better visual distinction and more natural feel:

| Emotion | Current Color | New Color | Why |
|---------|--------------|-----------|-----|
| calm | Muted cyan (hsl 193) | Soft sky blue (hsl 200, 60%, 55%) | More soothing, less washed out |
| happy | Orange-amber (hsl 36) | Warm golden (hsl 45, 95%, 60%) | Brighter, more joyful |
| excited | Pure red (hsl 0) | Vibrant magenta-pink (hsl 330, 85%, 60%) | Red feels like anger, pink feels excited |
| thinking | Deep indigo (hsl 239) | Electric blue-violet (hsl 250, 70%, 65%) | Softer, more "processing" feel |
| frustrated | Red-orange (hsl 6) | Burnt orange (hsl 20, 70%, 50%) | Distinct from "mad" |
| curious | Purple (hsl 282) | Teal-green (hsl 170, 60%, 50%) | More "exploring/discovery" feel |
| sad | Muted purple (hsl 271) | Deep blue (hsl 220, 40%, 50%) | Classic "blue" sadness |
| mad | Dark red (hsl 354) | Keep dark red | Already appropriate |
| bored | Slate gray (hsl 197) | Keep but slightly warmer | Fine as is |
| comfort | Rose pink (hsl 349) | Warm peach (hsl 25, 70%, 75%) | Softer, more comforting |
| supportive | Light orange (hsl 10) | Soft lavender (hsl 280, 45%, 75%) | More nurturing feel |

### 2. Sound for Each Emotion Color

The sound system already has sounds for every emotion, but the feedback buttons don't play the emotion-specific sound distinctly. Changes:

- **Like (thumbs up)**: Play a dedicated "positive feedback" sound -- a bright, cheerful double chime (distinct from general "happy" emotion), then transition eye to happy
- **Dislike (thumbs down)**: Play a dedicated "negative feedback" sound -- a gentle descending tone (empathetic, not punishing), then transition eye to sad

### 3. Dedicated Feedback Sounds in Sound Generator

Add two new sound types to the sound system:
- `feedback-positive`: Bright ascending two-note chime (higher pitch than happy emotion)
- `feedback-negative`: Soft descending two-note (lower, gentler than sad emotion)

## Files to Change

| File | Change |
|------|--------|
| `src/stores/emotionStore.ts` | Update all `EMOTION_CONFIGS` color values, glow colors, ring/glow classes |
| `src/lib/soundGenerator.ts` | Add `feedback-positive` and `feedback-negative` sound configs |
| `src/components/eye/ResponseCard.tsx` | Update `handleFeedback` to play feedback-specific sounds before emotion change |

## Technical Details

### ResponseCard.tsx - handleFeedback update
```typescript
const handleFeedback = async (type: "up" | "down") => {
  const newFeedback = feedback === type ? null : type;
  setFeedback(newFeedback);
  if (newFeedback) {
    // Play feedback-specific sound first
    soundContext.playSound(type === "up" ? "feedback-positive" : "feedback-negative");
    // Then transition eye emotion
    orchestrateEmotionChange(type === "up" ? "happy" : "sad", { skipSound: true });
    // ... rest of save logic
  }
};
```

### Sound Generator - New feedback sounds
- `feedback-positive`: Two bright ascending notes (E5 to A5), quick and satisfying
- `feedback-negative`: Two soft descending notes (D4 to Bb3), gentle and empathetic

### Emotion Store - Updated colors
All 11 emotion configs get refreshed HSL values with matching glow colors and Tailwind ring/glow classes for visual consistency.

