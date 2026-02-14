

## Fix Command Center: Immediate Feedback, Auto-Scroll, and Scroll-to-Bottom Button

### Problem
1. When you send a message (like "look for companies in Halifax NS"), the chat waits for the full response before showing anything -- feels like it's broken or frozen.
2. The chat doesn't auto-scroll to the bottom when new messages arrive.
3. No way to quickly jump back to the bottom after scrolling up.

### Solution

#### 1. Immediate "Looking into it" feedback
When you send a message that triggers a long-running agent task, AYN will immediately show a temporary message like "On it -- looking into that now. I'll have results shortly." while the backend works. This replaces the current behavior of just showing a spinner with no text feedback.

#### 2. Fix auto-scroll
The current scroll code targets the wrong element. It needs to target the internal Radix ScrollArea viewport (`[data-radix-scroll-area-viewport]`) instead of the outer wrapper, matching the fix already applied to AdminAIAssistant.

#### 3. Add scroll-to-bottom arrow button
A floating down-arrow button appears when you scroll up, letting you jump back to the latest messages with one tap.

### Technical Details

**File: `src/components/admin/workforce/CommandCenterPanel.tsx`**

- **Auto-scroll fix (lines 247-251)**: Update the `useEffect` to query `[data-radix-scroll-area-viewport]` inside `scrollRef.current` and use multi-stage scrolling (immediate + RAF + setTimeout 150ms).

- **Scroll-to-bottom button**: Add state `showScrollButton` that tracks whether the user has scrolled up. Attach an `onScroll` listener to the viewport. Show a floating `ChevronDown` button anchored to the bottom-right of the scroll area that scrolls to bottom on click.

- **Immediate feedback message**: In `handleSend`, right after adding the user message and before the fetch call, insert a temporary assistant message: "On it -- looking into this now. I'll update you shortly." Then when the real response arrives, replace that temporary message with the actual response. If there's a timeout/error, the temporary message gets replaced with the error message instead.

- **Import**: Add `ArrowDown` from lucide-react.

