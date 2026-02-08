

# Fix Bubble Scroll, Font Consistency, and History Card Scroll

## 3 Issues to Fix

### 1. Remove scroll from individual message bubbles
**File:** `src/components/transcript/TranscriptMessage.tsx` (lines 116-118)

Currently each bubble has its own internal scrollbar (`max-h-[30vh] overflow-y-auto`). This is wrong in compact/history mode -- the parent history card should handle all scrolling, not individual bubbles.

**Change:** In compact mode, remove `max-h` and `overflow-y-auto` so bubbles expand to full content height. Keep the scroll only for non-compact (live chat) mode.

```
BEFORE:
compact
  ? "max-h-[30vh] overflow-y-auto overscroll-contain"
  : "max-h-[40vh] overflow-y-auto overscroll-contain"

AFTER:
compact
  ? ""
  : "max-h-[40vh] overflow-y-auto overscroll-contain"
```

### 2. Unify font sizes
**File:** `src/components/transcript/TranscriptMessage.tsx`

Several text elements have redundant conditional sizing that resolves to the same value. Clean them up to a single consistent `text-sm` for message content across both modes:

- Line 91: `compact ? "text-sm" : "text-sm"` -- simplify to just `"text-sm"`
- Line 94: `compact ? "text-xs" : "text-xs"` -- simplify to just `"text-xs"`  
- Line 115: `compact ? "text-sm" : "text-sm"` -- simplify to just `"text-sm"`

These are already the same size but the redundant conditionals are confusing. This ensures all message text renders at `text-sm` (14px) consistently.

### 3. Fix history card scroll
**File:** `src/components/dashboard/ChatHistoryCollapsible.tsx` (lines 144-149)

The scroll container uses a hardcoded `maxHeight: "55vh"` inline style which can conflict with the outer card's `maxHeight: "70vh"`. Replace with flex-based layout so the message area fills the remaining space and scrolls naturally:

- Line 144: Add `overflow-hidden` to the wrapper
- Line 148-149: Remove the inline `maxHeight: "55vh"` style, use `flex-1 min-h-0` classes instead so the scroll area fills all available space within the card's 70vh constraint

```
BEFORE (line 144):
<div className="relative flex-1 min-h-0">

AFTER:
<div className="relative flex-1 min-h-0 overflow-hidden">

BEFORE (lines 148-149):
className="overflow-y-auto overscroll-contain py-1 space-y-0"
style={{ maxHeight: "55vh" }}

AFTER:
className="absolute inset-0 overflow-y-auto overscroll-contain py-1 space-y-0"
(no inline style)
```

Using `absolute inset-0` fills the parent container exactly, ensuring the scroll area matches the available space without hardcoded values.

## Summary
- **1 file** for bubble scroll + font: `TranscriptMessage.tsx` (3 small edits)
- **1 file** for history scroll: `ChatHistoryCollapsible.tsx` (2 small edits)
