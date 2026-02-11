

# Update Tutorial Illustrations with New Emotion Colors

## What's Changing

The tutorial's `EmotionsIllustration` and `EmpathyIllustration` components in `src/components/tutorial/TutorialIllustrations.tsx` still use the old emotion colors. They need to match the updated `EMOTION_CONFIGS` from the emotion store.

## Color Updates

| Emotion | Old Tutorial Color | New Color |
|---------|-------------------|-----------|
| Calm | `hsl(193, 38%, 47%)` | `hsl(200, 60%, 55%)` |
| Happy | `hsl(36, 100%, 65%)` | `hsl(45, 95%, 60%)` |
| Excited | `hsl(0, 100%, 67%)` | `hsl(330, 85%, 60%)` |
| Thinking | `hsl(239, 82%, 61%)` | `hsl(250, 70%, 65%)` |
| Curious | `hsl(282, 56%, 62%)` | `hsl(170, 60%, 50%)` |
| Comfort | `hsl(349, 49%, 69%)` | `hsl(25, 70%, 75%)` |
| Supportive | `hsl(10, 61%, 78%)` | `hsl(280, 45%, 75%)` |
| Frustrated | `hsl(6, 78%, 57%)` | `hsl(20, 70%, 50%)` |
| Sad | `hsl(271, 11%, 59%)` | `hsl(220, 40%, 50%)` |

Mad and Bored stay the same.

## File to Change

**`src/components/tutorial/TutorialIllustrations.tsx`** -- Update the color values in:
- `coreEmotions` array (lines 31-36)
- `empathyEmotions` array (lines 40-42)
- `negativeEmotions` array (lines 46-50)
- `EmpathyIllustration` component -- update the warm glow and label colors to reflect the new comfort (peach/amber) and supportive (lavender/purple) tones

