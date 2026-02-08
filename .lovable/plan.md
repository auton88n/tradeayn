
# Fix: Lock Chat Input to Fixed Height (No Expansion)

## Problem
Even with the 100px cap, the textarea still expands from 44px to 100px as you type long text, which pushes the entire card taller and shifts the eye downward.

## Solution
Remove auto-resize entirely. Keep the textarea at a fixed height (44px, single line) and let `overflow-y: auto` handle scrolling for long text. The input never grows, so the card and eye never move.

## Changes (ChatInput.tsx only)

### 1. Remove dynamic height setting from `handleTextareaChange`
Delete the `requestAnimationFrame` block that sets `textarea.style.height`. The textarea stays at its CSS height always.

### 2. Remove dynamic height from prefill resize (line ~290)
Delete the height recalculation after prefilling voice transcript.

### 3. Remove dynamic height from `handleInputChange` (line ~310)
Delete the auto-resize block in the voice transcript effect.

### 4. Update Textarea CSS class
Change `max-h-[100px]` to just use the fixed `min-h-[44px]` with no max-height growth. The textarea stays 44px tall and scrolls internally.

This means no matter how much text you type, the input box stays the same size and scrolls. The card never expands and the eye never moves.
