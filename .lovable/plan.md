
## Fix Textarea Auto-Scroll to Cursor

**Problem**: The chat input textarea has a fixed height of 44px. When you type or paste text that exceeds the visible area, the textarea doesn't scroll down to keep the cursor visible -- you have to scroll manually.

**Root Cause**: The `handleTextareaChange` function has an empty block where auto-resize logic was supposed to be. The textarea never grows, and no `scrollTop` adjustment is made to follow the cursor.

---

### Fix

**`src/components/dashboard/ChatInput.tsx`**

Two improvements:

1. **Auto-grow the textarea** up to a max height (e.g., 150px), so short messages show fully without scrolling:
   - In `handleTextareaChange`, reset `textarea.style.height = 'auto'`, then set it to `Math.min(textarea.scrollHeight, 150) + 'px'`
   - This makes the input grow as you type and shrink when you delete

2. **Auto-scroll to cursor after paste**: In the `useEffect` that repositions the cursor (the `pendingCursorRef` effect), also call `textarea.scrollTop = textarea.scrollHeight` to ensure the view follows the cursor after a paste

3. **Reset height on send**: When a message is sent, reset the textarea height back to the default 44px

This ensures the cursor is always visible whether you're typing line by line or pasting a large block of text.
