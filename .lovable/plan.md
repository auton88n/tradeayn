

# Fix: Batch State Updates + Replace Particle Burst with CSS Pulse

## Problem

In `CenterStageLayout.tsx`, the absorption timeout (lines 459-476 and 519-541) fires 6+ separate state updates in one tick, each causing a re-render. The `ParticleBurst` component also creates/destroys 21+ DOM elements during the animation frame, adding expensive DOM churn.

## Changes

### 1. Replace ParticleBurst with CSS absorb pulse (CenterStageLayout.tsx)

Remove the `ParticleBurst` component and its state (`showParticleBurst`, `burstPosition`, `setBurstPosition`) entirely. Replace with a simple CSS scale pulse on the eye container:

- Add an `isAbsorbPulsing` boolean state (single state, no position object needed)
- When absorption fires, set `isAbsorbPulsing = true`, reset after 300ms
- On the eye `motion.div`, apply a CSS transform pulse via a conditional class: `transition-transform duration-300` with `scale-105` when pulsing
- This is pure GPU composite work -- zero DOM creation/destruction

### 2. Batch state updates in absorption timeout (CenterStageLayout.tsx)

In both the message send (line 459) and suggestion click (line 520) timeouts:

- Use `ReactDOM.flushSync` is not needed -- instead, combine into fewer updates:
  - Call `triggerBlink()` (already fast, single set)
  - Call `triggerAbsorption()` (single set)
  - Defer `orchestrateEmotionChange('thinking')` into a `requestAnimationFrame()` so it runs on the next frame, not competing with the absorption visuals
  - Group `setIsResponding(true)` and `setIsAbsorbPulsing(true)` together (React 18 auto-batches these in timeouts)
- Remove `setBurstPosition` and `setShowParticleBurst` calls entirely (replaced by the CSS pulse)

### 3. Remove ParticleBurst import and render (CenterStageLayout.tsx)

- Remove the `ParticleBurst` import
- Remove the `<ParticleBurst>` JSX block (lines 818-823)
- Remove `burstPosition` and `showParticleBurst` state declarations (lines 212-213)
- Clean up dependency arrays

## Technical Detail

```text
Before (6+ state updates, 21+ DOM elements created):
  triggerBlink()              -> re-render
  triggerAbsorption()         -> re-render
  orchestrateEmotionChange()  -> re-render + emotion store update
  setIsResponding(true)       -> re-render
  setBurstPosition(pos)       -> re-render
  setShowParticleBurst(true)  -> re-render + 21 motion.divs mount

After (3 updates, auto-batched, zero DOM churn):
  triggerBlink()              |
  triggerAbsorption()         | auto-batched by React 18
  setIsResponding(true)       |
  setIsAbsorbPulsing(true)    |
  requestAnimationFrame(() => orchestrateEmotionChange('thinking'))  -> next frame
```

## Files to Change

| File | Change |
|------|--------|
| `CenterStageLayout.tsx` | Remove ParticleBurst; add CSS absorb pulse; defer orchestrateEmotionChange to rAF; remove burst state |

`ParticleBurst.tsx` can be kept in the codebase (unused) or deleted -- no functional impact either way.
