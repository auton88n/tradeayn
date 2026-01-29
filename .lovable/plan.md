

# Chat Transcript Improvements

## Issues to Fix

1. **Remove confusing date headers** - The "Today" and "Yesterday" labels are distracting and add clutter
2. **Fix stuck scrolling** - The sticky date headers are interfering with smooth scrolling
3. **Add confirmation dialog** - Prevent accidental clearing of chat history

## What the Clear Button Does

Good news: The Clear button is properly connected! When clicked, it:
- Starts a new chat session (`chatSession.startNewChat()`)
- Clears all messages from the current view (`messagesHook.setMessages([])`)

So clearing the transcript does actually clear your current chat and start fresh.

## Changes

### 1. Remove Date Grouping
- Remove the "Today", "Yesterday", and date headers completely
- Display messages in a simple chronological list
- This eliminates visual clutter and the scrolling issue

### 2. Add Clear Confirmation Dialog
Add an AlertDialog that appears when clicking "Clear" asking:
> **Clear chat history?**
> This will clear all messages and start a new chat. This action cannot be undone.
> 
> [Cancel] [Clear]

---

## Technical Details

### File: `src/components/transcript/TranscriptSidebar.tsx`

**Remove date grouping:**
- Remove `groupMessagesByDate` function and `formatDateHeader` function
- Remove `isToday`, `isYesterday`, `isSameDay` imports from date-fns
- Render `filteredMessages` directly without grouping
- Remove the sticky date header elements

**Add confirmation dialog:**
- Import AlertDialog components from `@/components/ui/alert-dialog`
- Add state: `const [showClearConfirm, setShowClearConfirm] = useState(false)`
- Wrap Clear button to open dialog instead of calling `onClear` directly
- Add AlertDialog with Cancel and Confirm actions

**Fix scrolling:**
- Removing sticky headers will resolve the scroll interference
- Keep the existing scroll logic which is otherwise well-implemented

