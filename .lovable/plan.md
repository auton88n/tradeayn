

## Fix: Constrain Chat Bubble Widths for Better Readability

### Problem

Chat bubbles (especially AI responses) stretch too wide on larger screens, making long text hard to read. The `max-w-[85%]` combined with `prose max-w-none` removes all natural width limits, so text runs edge-to-edge across the bubble.

### Solution

Apply tighter max-width constraints and restore prose readability limits across the three bubble components:

### Technical Details

**1. ChartCoachChat.tsx (MessageBubble) -- line 62**

- Change assistant bubble from `max-w-[85%]` to `max-w-[85%] sm:max-w-[75%]` so on wider screens the bubble doesn't stretch as far
- On the MessageFormatter (line 69): change `max-w-none` to `max-w-prose` so text lines stay at a comfortable reading width (~65 characters)

**2. AYNSpeechBubble.tsx -- line 89**

- Already has `sm:max-w-[600px]` which is reasonable, but the inner content uses `max-w-none` (line 170)
- Change inner MessageFormatter class from `max-w-none` to `max-w-prose` for comfortable line length

**3. ResponseCard.tsx -- line 365**

- Currently `md:max-w-[600px] lg:max-w-[680px]` -- these are fine
- Verify inner content also uses `max-w-prose` instead of `max-w-none` if applicable

| File | Change |
|------|--------|
| `src/components/dashboard/ChartCoachChat.tsx` | Add `sm:max-w-[75%]` to bubble div, change `max-w-none` to `max-w-prose` on MessageFormatter |
| `src/components/eye/AYNSpeechBubble.tsx` | Change `max-w-none` to `max-w-prose` on MessageFormatter |

These changes ensure text wraps at a comfortable reading width (~65 characters) while the bubble itself can still shrink on smaller screens.

