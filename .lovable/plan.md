

# Fix History/Transcript Card — Comprehensive Upgrade

## Summary
The history card inside ResponseCard needs several fixes: better sizing, a working scroll-to-bottom arrow, proper markdown rendering matching the main chat, message action buttons (copy/reply), improved user message styling, header with message count, and bottom padding so nothing is cut off.

## Changes

### 1. Fix Card Sizing and Scroll (ResponseCard.tsx)
- Increase history container max-height from `max-h-[40vh] sm:max-h-[50vh]` to `max-h-[50vh] sm:max-h-[60vh]`
- Add `pb-6` padding at the bottom of the message list so the last message isn't clipped by the card edge
- Ensure `overflow-y-auto overflow-x-hidden` is correctly applied (already present, just verify)

### 2. Fix Scroll-to-Bottom Arrow (ResponseCard.tsx)
- The scroll-down button currently checks threshold of 50px. The issue is that `showHistoryScrollDown` is only updated on scroll events and a delayed initial check. Fix by:
  - Adding a `ResizeObserver` on the history scroll container to continuously check if content overflows
  - Updating `showHistoryScrollDown` whenever the container resizes (new messages added)
  - Styling the button more prominently: slightly larger, with a subtle shadow, positioned at `bottom-4 right-4` instead of centered

### 3. Use MessageFormatter for Transcript Messages (TranscriptMessage.tsx)
- The `MessageFormatter` component is already imported and used for non-streaming messages -- this is correct
- Add the same prose styling classes used in the main ResponseCard (`[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3`) to the transcript message content wrapper
- This ensures code blocks, tables, headers, lists, and blockquotes render identically to the main chat

### 4. Message Action Buttons (TranscriptMessage.tsx + ResponseCard.tsx)
- The `TranscriptMessage` already has Copy and Reply buttons that show on hover when `compact={false}`
- In `ResponseCard.tsx`, pass an `onReply` callback to each `TranscriptMessage` so the Reply button appears
- The `onReply` prop will be added to the ResponseCard interface and forwarded from CenterStageLayout

### 5. User Message Styling (TranscriptMessage.tsx)
- Change user message bubble from `bg-primary text-primary-foreground` to a subtler style: `bg-muted/70 text-foreground` to match a cleaner, minimal look
- Keep user messages right-aligned with `flex-row-reverse`
- Use a softer border radius without the `rounded-br-sm` cutout

### 6. Header Improvements (ResponseCard.tsx)
- Add message count next to "AYN" label: show `{sortedMessages.length} messages` in muted text
- Keep Clear and Close buttons as they are

### 7. Bottom Padding Fix (ResponseCard.tsx)
- Add `pb-4` to the inner content div of the history scroll area to prevent the last message from being cut off by the card border

## Technical Details

### Files Modified
1. **src/components/eye/ResponseCard.tsx** -- History container sizing, scroll arrow fix with ResizeObserver, header message count, bottom padding, pass onReply to TranscriptMessage
2. **src/components/transcript/TranscriptMessage.tsx** -- Add prose styling for markdown rendering parity, update user bubble styling to be subtler
3. **src/components/dashboard/CenterStageLayout.tsx** -- Pass onReply handler to ResponseCard (minor wiring)

### No New Dependencies
All changes use existing components (MessageFormatter, TranscriptMessage) and existing styling patterns.

