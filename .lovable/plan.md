
# Fix: Cap Chat Input Height to Prevent Layout Shift

## Problem
The textarea auto-resizes up to 200px as you type long text, which pushes the card layout and shifts the eye position. The JavaScript in `handleTextareaChange` dynamically sets the height up to 200px.

## Solution
Cap the textarea at a smaller fixed max height (around 100px / ~4 lines) and rely on `overflow-y: auto` for scrolling beyond that. This keeps the input compact and the eye/card positions stable.

## Changes (ChatInput.tsx only)

### 1. Reduce max height in auto-resize logic
In three places where `Math.min(scrollHeight, 200)` appears, change to `Math.min(scrollHeight, 100)`:
- `handleTextareaChange` (line ~427)
- Prefill resize (line ~295)
- Manual `handleInputChange` (line ~313)

### 2. Update Textarea CSS class
Change `max-h-[200px]` to `max-h-[100px]` on the Textarea element (line ~602) to match the JS cap.

This keeps the input area compact (max ~4 lines visible) with internal scrolling for longer text, so the eye and card never move.
