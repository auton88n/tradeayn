
# Fix History Card: Eye Behavior, Fit, and Scroll Arrow

## Problems
1. When history opens, the eye stays full size instead of shrinking like it does for responses
2. The history content can get cut off
3. The scroll-down arrow needs to be visible when there's overflow

## Changes

### 1. CenterStageLayout.tsx -- Make eye shrink when history is open
Add `transcriptOpen` to all the eye animation conditions so the eye behaves identically whether showing a response or history:

- Line 731: `(hasVisibleResponses || isTransitioningToChat)` becomes `(hasVisibleResponses || isTransitioningToChat || transcriptOpen)`
- Line 736 (scale): same addition
- Line 737 (marginBottom): same addition  
- Line 738 (y): same addition

This makes the eye shrink and shift up when history opens, exactly like it does for responses.

### 2. ResponseCard.tsx -- Fix history content fitting
- Change `max-h-[50vh]` on the history scroll container (line 346) to use a dynamic max-height that accounts for the header, similar to how the response content area works: `max-h-[40vh] sm:max-h-[50vh]`
- Add `min-h-[200px]` so short histories don't look awkwardly small

### 3. ResponseCard.tsx -- Always show scroll-down arrow when scrollable
The scroll-down button (line 387) currently only shows when `showHistoryScrollDown` is true (requires 100px scroll gap). Lower the threshold to 50px and ensure the arrow is always clearly visible with proper styling. The ChevronDown arrow is already implemented but the threshold is too high -- reduce it so users always see the arrow when there's content below.
