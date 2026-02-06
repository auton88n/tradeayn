
# Add "Reply" Button Next to Copy in Chat Messages

## What This Does
Adds a reply button (arrow icon) next to the existing copy button on each message. Clicking it will prefill the chat input with the message content so you can quickly reference or respond to it.

## Technical Changes

### 1. TranscriptMessage.tsx -- Add reply button and callback

- Add an optional `onReply` prop to `TranscriptMessageProps`
- Import `Reply` (or `CornerDownLeft`) icon from lucide-react
- Render a reply button next to the copy button in the action row (non-compact mode only)
- Clicking it calls `onReply(content)` with the message text

The action buttons row changes from a single copy button to a flex row with both copy and reply:

```
Before:  [Copy]
After:   [Copy] [Reply]
```

### 2. ChatInput.tsx -- Pass onReply to TranscriptMessage and prefill input

- Pass an `onReply` callback to each `<TranscriptMessage>` that sets the input value to the replied message content (or a quoted version like `> original message`)
- When reply is clicked, the chat input gets prefilled and focused so the user can immediately type their follow-up

### 3. ChatHistoryCollapsible.tsx and TranscriptSidebar.tsx -- Pass onReply (optional)

These also render `<TranscriptMessage>`. The prop is optional so they won't break, but if desired they can also wire up reply.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/transcript/TranscriptMessage.tsx` | Add optional `onReply` prop; render reply button next to copy |
| `src/components/dashboard/ChatInput.tsx` | Pass `onReply` handler that prefills the input with the message content |
