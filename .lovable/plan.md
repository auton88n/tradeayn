
# Merge History into the ResponseCard

## What Changes
Instead of a separate HistoryCard component, the existing ResponseCard will gain a "history mode". When the user clicks "History", the same card switches its content area from showing the AI response to showing the full chat transcript. No new card appears -- the same card, same styling, same position.

## How It Works
1. The ResponseCard receives new props: `transcriptOpen`, `transcriptMessages`, `isTyping`, `onTranscriptClose`, `onTranscriptClear`
2. When `transcriptOpen` is true, the content area renders transcript messages (using TranscriptMessage) instead of the markdown response
3. The header shows "Clear" and "Close" buttons (replacing the dismiss X) when in history mode
4. The action bar (Copy, thumbs, expand) hides when in history mode since it's not relevant to transcript view
5. The card always renders (either response content or history) -- no separate component needed

## Technical Changes

### 1. ResponseCard.tsx -- Add history mode
- Add new props: `transcriptOpen`, `transcriptMessages`, `isTyping`, `onHistoryClose`, `onHistoryClear`
- When `transcriptOpen` is true:
  - Header shows "AYN" label + Clear button + Close (X) button (calls `onHistoryClose`)
  - Content area renders sorted `TranscriptMessage` components with typing indicator
  - Action bar (Copy, thumbs, expand, design) is hidden
  - The early return for empty content is skipped (history has its own content)
- When `transcriptOpen` is false: everything works exactly as before (no behavior change)
- Import `TranscriptMessage` and `AlertDialog` components
- Add scroll-to-bottom button for history mode
- Add clear confirmation AlertDialog

### 2. CenterStageLayout.tsx -- Remove HistoryCard, pass history props to ResponseCard
- Remove the separate HistoryCard rendering block (lines 786-802)
- Remove the HistoryCard import
- Pass history-related props to the existing ResponseCard: `transcriptOpen`, `transcriptMessages={messages}`, `isTyping={showThinking}`, `onHistoryClose`, `onHistoryClear`
- Ensure the ResponseCard renders when either `responseBubbles.length > 0` OR `transcriptOpen` is true (update the condition on line 763)

### 3. Delete HistoryCard.tsx
- Remove `src/components/eye/HistoryCard.tsx` entirely since it's no longer needed
