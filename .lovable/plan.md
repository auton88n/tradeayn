
# Integrate Chat History Inside ChatInput Component

## Problem
The chat history panel is currently a separate component placed **above** the ChatInput, creating a visible gap between them. The user wants the history panel to be **inside** the ChatInput card container, matching the Engineering workspace pattern.

---

## Solution Overview

Move the chat history collapsible logic **into** the ChatInput component so that:
1. The expanded history appears at the top of the same card
2. The toggle button appears inside the input area
3. No gap between history and input

---

## Visual Design

**Collapsed State:**
```text
+---------------------------------------------------+
| [Text input area]                                 |
+---------------------------------------------------+
| [+] [Mic] [Speaker]  [History (5)]  [AYN]        |
+---------------------------------------------------+
```

**Expanded State:**
```text
+---------------------------------------------------+
| AYN Chat History                      [Clear] [X] |
+---------------------------------------------------+
| [User message - right aligned]                    |
|        [AYN message - left aligned]               |
| [Scrollable messages - max 256px]                 |
+---------------------------------------------------+
| [Text input area]                                 |
+---------------------------------------------------+
| [+] [Mic] [Speaker]  [History (5)]  [AYN]        |
+---------------------------------------------------+
```

---

## Technical Changes

### 1. Update ChatInput.tsx

**Add new props:**
```tsx
// Chat history props
transcriptMessages?: Message[];
transcriptOpen?: boolean;
onTranscriptToggle?: () => void;
onTranscriptClear?: () => void;
```

**Integrate history inside the card:**
- Add collapsible history section **at the top** of the main container (before the textarea row)
- Use `AnimatePresence` + `motion.div` for smooth expand/collapse animation
- Add a "History" toggle button in the **action bar row** (Row 2: where +, mic, speaker are)

**Structure:**
```tsx
<div className="relative bg-background/95 border rounded-2xl">
  {/* History collapsible at top */}
  <AnimatePresence>
    {transcriptOpen && transcriptMessages?.length > 0 && (
      <motion.div>
        {/* Header with Clear/Close */}
        {/* ScrollArea with messages */}
        {/* Border separator */}
      </motion.div>
    )}
  </AnimatePresence>
  
  {/* Row 1: Input area (existing) */}
  {/* Row 2: Action bar + History toggle (existing + add History) */}
</div>
```

### 2. Update CenterStageLayout.tsx

**Remove the external ChatHistoryCollapsible:**
- Delete the `<ChatHistoryCollapsible>` render between SystemNotificationBanner and ChatInput
- Pass history props directly to ChatInput

**Pass props to ChatInput:**
```tsx
<ChatInput
  // ... existing props
  transcriptMessages={messages}
  transcriptOpen={transcriptOpen}
  onTranscriptToggle={onTranscriptToggle}
  onTranscriptClear={onTranscriptClear}
/>
```

### 3. ChatHistoryCollapsible.tsx

This component will be **deleted** or kept for reference only, as the logic moves inside ChatInput.

---

## Implementation Details

**History Toggle Button (inside Row 2):**
```tsx
{transcriptMessages && transcriptMessages.length > 0 && onTranscriptToggle && (
  <Button
    variant="ghost"
    size="sm"
    onClick={onTranscriptToggle}
    className="gap-1.5"
  >
    <Clock className="h-4 w-4" />
    <span>History</span>
    <span className="text-xs bg-muted px-1.5 rounded-full">
      {transcriptMessages.length}
    </span>
  </Button>
)}
```

**Expanded History Section (at top of card):**
```tsx
<AnimatePresence>
  {transcriptOpen && transcriptMessages?.length > 0 && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Header with title + Clear/Close buttons */}
      {/* ScrollArea with max-height 256px */}
      {/* Border separator before input area */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/dashboard/ChatInput.tsx` | Add history props + integrate collapsible section |
| `src/components/dashboard/CenterStageLayout.tsx` | Remove external ChatHistoryCollapsible, pass props to ChatInput |

---

## Benefits

1. **No gap** - History is inside the same card as input
2. **Unified design** - Matches Engineering workspace pattern
3. **Cleaner architecture** - Single card component manages both history and input
4. **Smooth UX** - Expand/collapse animation within the same container
