

# Fix Double Sound and Laggy Message Animation

## Problems Identified

### 1. Double Sound Effect
Two sounds play in quick succession when sending a message:
- **`message-send`** plays immediately when clicking send (ChatInput)
- **`message-absorb`** plays 350ms later when the bubble reaches the eye (CenterStageLayout)

This creates a confusing "double tap" audio experience.

### 2. Laggy Card Animation
The timing between visual animation and sound/effects is misaligned:

| Event | Current Timing |
|-------|----------------|
| Flying animation starts | 0ms |
| Absorb sound + effects trigger | 350ms |
| Flying animation ends | 400ms |
| Visual status changes to "absorbing" | 500ms |
| Absorbing animation plays | 500-720ms |

The absorb sound plays **before** the card visually starts absorbing, creating a disconnect.

---

## Solution

### Sound Consolidation
Remove the `message-send` sound and only use `message-absorb` when the bubble reaches the eye. This creates a single, satisfying "gulp" effect when AYN receives the message.

### Animation Timing Alignment
Synchronize all events to the actual visual animation:

| Event | New Timing |
|-------|------------|
| Flying animation starts | 0ms |
| Flying animation ends | 400ms |
| Visual status → "absorbing" | 400ms |
| Absorb sound + effects trigger | 400ms |
| Absorbing animation plays | 400-620ms |

---

## Technical Changes

### File 1: `src/components/dashboard/ChatInput.tsx`
**Line ~284**: Remove the `message-send` sound call

```text
Before:
  playSound?.('message-send');

After:
  // Sound removed - consolidated to absorption in CenterStageLayout
```

### File 2: `src/hooks/useBubbleAnimation.ts`
**Lines 96-102**: Change timeout from 500ms to 400ms to match actual flying animation duration

```text
Before:
  setTimeout(() => { ... }, 500);

After:
  setTimeout(() => { ... }, 400);
```

### File 3: `src/components/dashboard/CenterStageLayout.tsx`
**Line 396**: Change effects timeout from 350ms to 400ms to synchronize with animation completion

```text
Before:
  setTimeout(() => { ... }, 350);

After:
  setTimeout(() => { ... }, 400);
```

---

## Expected Result

- **Single cohesive sound**: One satisfying "absorb" sound when the message enters AYN's eye
- **Smooth animation**: Card flies smoothly, then seamlessly transitions to absorption
- **Synchronized feedback**: Sound, visual effects (blink, particles), and animation all trigger together at 400ms

