

## Normalize Pasted Text in Chat Input

**Problem**: When you paste text from external sources (websites, documents, emails), it can carry foreign formatting like different font sizes, bold styles, or font families. Since the chat input uses a standard `<textarea>`, this shouldn't normally happen -- but if a `contentEditable` or rich element is involved, or if the paste includes styled text, it can look inconsistent.

**Solution**: Add a `paste` event handler to the chat `<textarea>` that intercepts pasted content and strips all formatting, inserting only plain text.

---

### Technical Details

**File: `src/components/dashboard/ChatInput.tsx`**

1. Add an `onPaste` handler to the `<textarea>` element that:
   - Calls `e.preventDefault()` to block the default paste behavior
   - Extracts plain text from the clipboard using `e.clipboardData.getData('text/plain')`
   - Inserts the plain text at the cursor position, preserving any existing text before/after the selection
   - Updates the input state with the cleaned text

This ensures that regardless of the source, pasted content always arrives as unstyled plain text matching the app's font (Inter, text-sm).

