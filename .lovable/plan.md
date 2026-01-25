
# Enhanced Emotion Sound Design

## Overview

Create distinctive, emotionally-resonant sounds for each of AYN's 11 emotions using multi-oscillator synthesis. Each emotion will have a unique audio signature that **feels** like that emotion.

---

## Sound Design Philosophy

### Current Problem
All emotion sounds use single oscillators with basic configurations - they sound robotic and indistinguishable.

### Solution
Use **layered oscillators**, **harmonics**, and **musical intervals** to create sounds that aurally represent each emotion's feeling:

- **Happy**: Major third interval (uplifting)
- **Sad**: Minor second (melancholic)
- **Excited**: Rapid ascending arpeggio
- **Thinking**: Subtle pulsing harmonics
- **Curious**: Rising question-like inflection

---

## New Sound Configurations

### Happy - Warm, Uplifting Chime
Two notes forming a major third, like a gentle smile.
```
Note 1: C5 (523 Hz) → Note 2: E5 (659 Hz)
Type: Sine with soft attack
Duration: 0.25s total
```

### Sad - Descending Minor
Soft falling notes that convey empathy.
```
Note 1: D4 (294 Hz) → Note 2: Db4 (277 Hz)
Type: Sine, slow attack
Duration: 0.5s, long decay
```

### Excited - Quick Triple Rise
Three rapid ascending notes bursting with energy.
```
C5 → E5 → G5 (major arpeggio)
Type: Bright sine
Duration: 0.15s per note, overlapping
```

### Thinking - Pulsing Harmonics
Subtle oscillation suggesting active thought.
```
Base: 349 Hz with LFO modulation
Type: Triangle with vibrato
Duration: 0.3s
```

### Curious - Question Inflection
Rising pitch that mimics the tone of a question.
```
Start: 350 Hz → End: 500 Hz (pitch bend)
Type: Sine with detune
Duration: 0.25s
```

### Frustrated - Tense Dissonance
Minor second interval creating subtle tension.
```
A3 (220 Hz) + Bb3 (233 Hz) simultaneous
Type: Triangle, short
Duration: 0.18s
```

### Mad - Sharp Intensity
Bold, intense burst with harmonic distortion.
```
Low E2 (82 Hz) with square overtones
Type: Square filtered
Duration: 0.12s, hard attack
```

### Bored - Yawn-like Descent
Slow, drawn-out falling tone.
```
200 Hz → 150 Hz pitch slide
Type: Sine, very slow
Duration: 0.5s
```

### Calm - Flowing Harmony
Gentle, peaceful major chord.
```
C4 + E4 + G4 soft blend
Type: Pure sine
Duration: 0.35s, long attack
```

### Comfort - Warm Embrace
Rich, enveloping sound like a hug.
```
G3 (196 Hz) + D4 (294 Hz) perfect fifth
Type: Sine, soft
Duration: 0.4s
```

### Supportive - Encouraging Rise
Gently ascending melody that feels like encouragement.
```
C4 → D4 → E4 gentle steps
Type: Sine
Duration: 0.3s total
```

---

## Technical Implementation

### New Multi-Note Play Method

Add a `playEmotionChord` method to `SoundGenerator` that can:
1. Play multiple simultaneous notes (chords)
2. Play sequential notes (melodies/arpeggios)
3. Apply pitch bends for rising/falling effects

```typescript
// New method signature
playEmotionChord(notes: NoteConfig[]): void

interface NoteConfig {
  frequency: number;
  delay: number;      // Start time offset
  duration: number;
  gain: number;
  type: OscillatorType;
  pitchBend?: { end: number; duration: number };
}
```

### Updated Emotion Sound Configs

Replace simple `SoundConfig` with rich `EmotionSoundConfig`:

```typescript
interface EmotionSoundConfig {
  notes: NoteConfig[];
  masterGain: number;
  filterFreq?: number;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/soundGenerator.ts` | Add `EmotionSoundConfig`, new `playEmotionChord()` method, update `playEmotion()` to use multi-note synthesis |

---

## Expected Result

Each emotion will have an immediately recognizable, emotionally appropriate sound:
- Users will **feel** the emotion through audio
- Sounds will be pleasant and non-intrusive
- Clear differentiation between emotions
- Maintains the subtle, refined AYN aesthetic
