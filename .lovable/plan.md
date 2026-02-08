

# Show History in ResponseCard Area (No Eye Fade)

## What Changes
When you tap "History", the chat history will appear in the center of the screen (where the ResponseCard normally shows), styled the same way. The eye stays completely normal -- no fading, no moving. The history card simply appears below it, just like AI responses do.

## Technical Changes

### 1. Remove eye opacity fade (`CenterStageLayout.tsx`)
- Remove `opacity: transcriptOpen ? 0 : 1` from the eye's animate prop (line 745)
- Remove the `opacity` transition config (line 751)
- The eye stays fully visible at all times

### 2. Add HistoryCard rendering in center stage (`CenterStageLayout.tsx`)
- After the ResponseCard `AnimatePresence` block (line 791), add a new block that renders a `HistoryCard` component when `transcriptOpen` is true
- Pass: `transcriptMessages`, `isTyping`, `onClose` (calls `onTranscriptToggle`), `onClear` (calls `onTranscriptClear`)
- Uses the same wrapper pattern as ResponseCard (centered, with max-height constraint)

### 3. Remove history panel from ChatInput (`ChatInput.tsx`)
- Remove the entire history panel section (lines 434-528): the `AnimatePresence` with the motion.div containing the header, messages area, typing indicator, and scroll button
- Remove related state/refs: `historyScrollRef`, `showScrollDown`, `handleHistoryScroll`, `scrollHistoryToBottom`, `seenMessageIdsRef`
- Keep the "History" toggle button -- it still triggers `onTranscriptToggle`

### 4. New component: `src/components/eye/HistoryCard.tsx`
- Styled identically to ResponseCard: same border, shadow, rounded corners, header with Brain icon
- Header shows "AYN" label with Clear and Close buttons
- Scrollable message area (`max-h-[50vh]`) rendering `TranscriptMessage` components
- Typing indicator (three bouncing dots) when AI is processing
- Scroll-to-bottom button when not at bottom
- No entry/exit animations -- just renders/unmounts instantly for zero lag

### 5. Stop clearing ResponseCard on history open (`CenterStageLayout.tsx`)
- Remove the `useEffect` that calls `clearResponseBubbles()` and `clearSuggestions()` when `transcriptOpen` changes (lines 676-682)
- The ResponseCard will naturally be hidden since it won't emit new bubbles while history is open (line 639 already handles this), but existing ones can stay

