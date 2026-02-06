
# Fix ResponseCard Text Alignment, History Button Style, and History Panel Performance

## Three Issues to Fix

### 1. ResponseCard text alignment (ResponseCard.tsx)
The text inside the response card appears centered/spaced oddly instead of starting from the left for English (or right for Arabic). This is because the content area inherits centering from parent containers but lacks an explicit text alignment.

**Fix**: Add `text-start` to the content container so text naturally aligns left for English and right for Arabic.

**File**: `src/components/eye/ResponseCard.tsx`
- Line 355-361: Add `text-start` to the content area class list

### 2. History button needs to look clickable (ChatInput.tsx)
The History toggle currently looks like plain text with an icon -- not obviously a button. It needs visual cues like a background, border, or hover effect to signal interactivity.

**Fix**: Add a visible background (`bg-muted/50`), border (`border border-border`), and slightly more padding to make it clearly look like a button users can click.

**File**: `src/components/dashboard/ChatInput.tsx`
- Line 713: Update the History button styling from plain text to a visible pill/button with background and border

### 3. History panel feels laggy when opening (ChatInput.tsx)
The spring animation on the history panel (`damping: 25, stiffness: 300`) combined with `height: 'auto'` causes a visually laggy feel. Switching to a faster, simpler tween transition will make it feel snappier.

**Fix**: Replace the spring animation with a quicker tween (`duration: 0.15, ease: "easeOut"`) for the history panel open/close.

**File**: `src/components/dashboard/ChatInput.tsx`
- Lines 452-456: Replace spring transition with a fast tween transition

## Technical Summary

| Issue | File | Lines | Change |
|-------|------|-------|--------|
| Text alignment | ResponseCard.tsx | 355-361 | Add `text-start` to content container |
| History button style | ChatInput.tsx | 713 | Add `bg-muted/50 border border-border` and more padding |
| History lag | ChatInput.tsx | 452-456 | Replace spring with `duration: 0.15, ease: "easeOut"` tween |
