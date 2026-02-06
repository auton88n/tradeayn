

# Full-Width Chat + History-Driven Response Mode

## Overview
Three connected changes to improve the chat experience:
1. Stretch ChatInput and history panel to full page width (no narrow card constraint)
2. When history is open: shrink eye to top, hide ResponseCard, show responses inline in history
3. When history is closed: normal AYN eye + ResponseCard behavior

---

## Technical Changes

### 1. Full-Width ChatInput (ChatInput.tsx)

The ChatInput outer container already uses `w-full`, but the inner card has `rounded-2xl` and `px-3 pb-3` padding that constrains it. We need to keep the card styling but ensure it stretches the full available width between sidebar boundaries (which are already handled by the fixed footer in CenterStageLayout).

No max-width constraint exists currently -- the card already fills the footer. This looks correct from the code. The visual constraint comes from the footer's `left`/`right` offsets for sidebar/transcript. Since the user wants full width, we just need to confirm the padding is minimal.

**Change**: Reduce `px-3` to `px-0` or `px-1` on the outer wrapper, and optionally reduce the card's rounded corners to `rounded-t-xl` (since it sits at the bottom edge).

### 2. Pass `transcriptOpen` State to Control Eye + ResponseCard (CenterStageLayout.tsx)

**Eye shrink when history open**: The eye already shrinks when `hasVisibleResponses` is true. We add a similar condition for `transcriptOpen`:
- When `transcriptOpen` is true: scale eye to 0.5 (small) and move it to the top with `justify-start pt-4`
- Hide/suppress ResponseCard emission when history is open

**Suppress ResponseCard when history open**: In the response processing effect (line ~583), check if `transcriptOpen` is true. If so, skip `emitResponseBubble()` -- the response will already appear in the history messages list since `transcriptMessages={messages}` is passed to ChatInput.

**Close ResponseCard when history opens**: When `transcriptOpen` changes to true, call `clearResponseBubbles()` to dismiss any existing floating card.

### 3. Auto-Scroll History on New Response (ChatInput.tsx)

The history auto-scroll already triggers on `transcriptMessages.length` change, so new AYN responses will automatically scroll into view in the history panel.

---

## File Changes

### `src/components/dashboard/CenterStageLayout.tsx`

| Area | Change |
|------|--------|
| Eye scale animation (line ~716) | Add `transcriptOpen` to shrink condition: scale to 0.5 when history is open |
| Eye stage layout (line ~693) | Add `transcriptOpen` to `justify-start pt-4` condition |
| Response processing effect (line ~583) | Skip `emitResponseBubble()` when `transcriptOpen` is true |
| Suggestion emission (line ~628) | Also skip suggestions when `transcriptOpen` is true |
| New useEffect | When `transcriptOpen` becomes true, call `clearResponseBubbles()` and `clearSuggestions()` |

### `src/components/dashboard/ChatInput.tsx`

| Area | Change |
|------|--------|
| Outer wrapper (line 431) | Change `px-3` to `px-0` for full-width stretch |
| Inner card (line 434) | Change `rounded-2xl` to `rounded-t-2xl` for bottom-anchored look |

---

## Behavior Summary

```text
History CLOSED (default):
+--------------------------------------------------+
|                                                  |
|                   [  AYN Eye  ]                  |
|                  (normal size)                   |
|                                                  |
|              [ ResponseCard here ]               |
|                                                  |
|    +------------------------------------------+  |
|    | [text input]                    [send]   |  |
|    | [+] [mic] [sound]  History 4   4/100 AYN |  |
|    +------------------------------------------+  |
+--------------------------------------------------+

History OPEN:
+--------------------------------------------------+
|          [AYN Eye]  (small, at top)              |
|                                                  |
|    +------------------------------------------+  |
|    | AYN Engineering            [Clear] [X]   |  |
|    |------------------------------------------|  |
|    | AYN 3:01 AM                              |  |
|    | [hey! I'm AYN...]                        |  |
|    |                     You 3:29 AM          |  |
|    |                         [hello]          |  |
|    | AYN 3:29 AM                              |  |
|    | [Hello! How can I help?]  <-- live here   |  |
|    |------------------------------------------|  |
|    | [text input]                    [send]   |  |
|    | [+] [mic] [sound]  History 4   4/100 AYN |  |
|    +------------------------------------------+  |
+--------------------------------------------------+
```

No ResponseCard floats near the eye when history is open -- responses flow directly into the history panel. Closing history restores normal behavior.

