
# Fix Mobile/Tablet Responsiveness and Message-to-Eye Animation

## What's Being Fixed

When you send a message on mobile or tablet, the bubble should fly directly to the exact center of the eye. Currently there are two issues:

1. **Mobile keyboard offset**: When you tap "Send" on mobile, the virtual keyboard is still visible, which pushes the eye upward. The bubble's end position is calculated with the keyboard-shifted layout, but the keyboard then dismisses mid-animation, causing the bubble to miss the eye center.

2. **Scaled eye targeting**: When the eye is scaled down (after a response is visible), the bubble still needs to target the visual center of the scaled element precisely.

## Changes

### 1. CenterStageLayout.tsx -- Fix eye targeting on mobile

**Problem**: `getEyePosition()` reads `getBoundingClientRect()` at send time, but on mobile the keyboard shifts everything. The keyboard starts closing after send, so the eye moves during the bubble flight.

**Fix**: On mobile, blur the textarea before reading eye position. This triggers keyboard dismissal first, then read the eye position after a short delay to get the true position. Also ensure the eye position accounts for any ongoing scale animation.

In `handleSendWithAnimation` (around line 405):
- On mobile: blur the input first, then use `requestAnimationFrame` to read eye position after keyboard starts closing
- Add a small delay (50ms) before starting the animation on mobile to let the layout settle

### 2. UserMessageBubble.tsx -- Ensure precise center targeting

**Problem**: The bubble calculates its own center offset using `useLayoutEffect` to measure dimensions, but the initial `useState` defaults (140x44) are used on the first render frame before measurement completes.

**Fix**: Use a ref-based measurement that runs synchronously before the animation starts, and add `will-change: transform` for smoother GPU-accelerated animation on mobile.

### 3. FlyingSuggestionBubble.tsx -- Same fix for suggestions

Apply the same measurement fix as UserMessageBubble for consistency on tablet/mobile.

### 4. Hero.tsx -- Add tablet-specific card positions

**Problem**: Tablets (768px-1024px) use the desktop card positions which can look too spread out on smaller tablets.

**Fix**: Add an intermediate card position set for tablets (using a width check in `getCardPositions`).

## Technical Details

### File: src/components/dashboard/CenterStageLayout.tsx

In `handleSendWithAnimation`, wrap the position reading in a mobile-aware flow:

```typescript
const handleSendWithAnimation = useCallback(
  async (content: string, file?: File | null) => {
    if (isUploading || (!content.trim() && !file)) return;

    // ... existing setup code ...

    // On mobile, blur input first to dismiss keyboard before reading positions
    if (isMobile) {
      const activeEl = document.activeElement as HTMLElement;
      activeEl?.blur?.();
    }

    // Small delay on mobile to let keyboard dismiss and layout settle
    const animationDelay = isMobile ? 60 : 0;

    // Send message IMMEDIATELY (don't wait for animation)
    onSendMessage(content, file);

    setTimeout(() => {
      const inputPos = getInputPosition();
      const eyePos = getEyePosition();
      startMessageAnimation(content, inputPos, eyePos);

      setTimeout(() => {
        // ... existing absorption/blink/particle code ...
        // Re-read eye position for particle burst (layout may have settled)
        const freshEyePos = getEyePosition();
        setBurstPosition(freshEyePos);
        // ...
      }, 400);
    }, animationDelay);
  },
  [/* deps */]
);
```

### File: src/components/eye/UserMessageBubble.tsx

Update to use more reliable initial dimensions and add mobile GPU hints:

```typescript
// Use 0,0 defaults so first frame uses actual measured position
const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

// Add will-change for GPU acceleration on mobile
style={{
  left: 0,
  top: 0,
  transformOrigin: 'center center',
  willChange: 'transform, opacity',
}}
```

### File: src/components/eye/FlyingSuggestionBubble.tsx

Same dimension fix as UserMessageBubble.

### File: src/components/landing/Hero.tsx

Add tablet breakpoint for card positions:

```typescript
const getCardPositions = () => {
  if (isMobile) {
    // existing mobile positions
  }
  // Tablet: 768px - 1024px
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    return {
      topLeft: { x: -120, y: -80 },
      middleLeft: { x: -160, y: 0 },
      bottomLeft: { x: -120, y: 80 },
      topRight: { x: 120, y: -80 },
      middleRight: { x: 160, y: 0 },
      bottomRight: { x: 120, y: 80 }
    };
  }
  // Desktop positions (existing)
  return { /* existing */ };
};
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/CenterStageLayout.tsx` | Blur input on mobile before reading eye position; add small delay for keyboard dismissal |
| `src/components/eye/UserMessageBubble.tsx` | Fix initial dimension defaults; add `will-change` for mobile GPU |
| `src/components/eye/FlyingSuggestionBubble.tsx` | Same dimension fix as UserMessageBubble |
| `src/components/landing/Hero.tsx` | Add tablet-specific card positions (768px-1024px) |

## Expected Result

- Messages will fly precisely to the eye center on all devices (mobile, tablet, desktop)
- The virtual keyboard on mobile won't cause the bubble to miss the eye
- Hero cards on tablets will have proportional spacing instead of using desktop-sized offsets
- Smoother animations on mobile with proper GPU hints
