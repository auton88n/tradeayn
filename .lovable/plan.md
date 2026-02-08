
## Fix Paste Cursor Position in Dashboard ChatInput

**Problem**: When pasting text into the dashboard chat input, the cursor jumps to the beginning instead of staying at the end of the pasted content. The existing `onPaste` handler tries to fix this with `setTimeout(..., 0)`, but React's re-render from `setInputMessage` happens after the timeout, resetting the cursor.

**Fix**: Use a `useEffect` to reposition the cursor after React has re-rendered with the new value.

---

### Changes

**`src/components/dashboard/ChatInput.tsx`**

1. Add a `pendingCursorRef` (useRef) to store the desired cursor position after a paste
2. In the `onPaste` handler, set this ref to `start + text.length` instead of using `setTimeout`
3. Add a `useEffect` that watches `inputMessage` -- when it changes and `pendingCursorRef` has a value, set `selectionStart`/`selectionEnd` to that position and clear the ref

This ensures the cursor is repositioned after React finishes rendering the updated text, not before.
