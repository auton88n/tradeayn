

## Fix Message Bubble Flight Centering

**Problem**: When you send a message, the bubble flies toward the eye but doesn't land centered on it. This happens because the CSS `translate(-50%, -50%)` (meant to center the bubble on the target point) gets overridden by framer-motion's transform system. The bubble lands offset by half its own width and height.

**Fix**: Adjust the end position coordinates in `getEyePosition()` and `getInputPosition()` to account for the bubble's dimensions, OR use framer-motion's built-in centering approach.

---

### Changes

**`src/components/eye/UserMessageBubble.tsx`**

- Remove the CSS `transform: 'translate(-50%, -50%)'` since framer-motion overrides it anyway
- Instead, use a wrapper ref to measure the bubble's dimensions, then offset `x`/`y` by half-width and half-height in the animation values
- This ensures the bubble visually centers on the eye across all screen sizes (desktop, tablet, mobile)

Specifically:
1. Add a ref to the bubble container and measure its width/height after mount
2. Subtract half the bubble's width from `endPosition.x` and half its height from `endPosition.y` in both `flyingAnimation` and `absorbingAnimation`
3. Do the same offset for `startPosition` in the `initial` prop so the bubble starts centered on the input area too

This is a single-file fix in `UserMessageBubble.tsx` -- no changes needed to `CenterStageLayout.tsx` since `getEyePosition()` already correctly returns the visual center of the eye element.

