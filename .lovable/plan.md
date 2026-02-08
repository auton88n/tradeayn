

# Replace Custom HTML Sanitizer with DOMPurify

## Problem

The current `src/lib/security.ts` uses regex-based sanitization (`sanitizeUserInput`, `escapeHtml`) which is bypassable. Regex cannot reliably parse HTML, so edge cases (nested tags, encoding tricks, etc.) can slip through.

## Solution

Replace the custom implementation with DOMPurify, a battle-tested sanitization library.

### Step 1: Install DOMPurify

Add `dompurify` and `@types/dompurify` as dependencies.

### Step 2: Rewrite `src/lib/security.ts`

Replace the entire file contents:

```typescript
import DOMPurify from 'dompurify';

/**
 * Sanitizes user input using DOMPurify to prevent XSS attacks.
 * Strips all HTML tags and dangerous content by default.
 */
export function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Sanitizes HTML content, allowing safe markup (bold, italic, links, etc.)
 * but removing dangerous elements like script tags and event handlers.
 */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input);
}

/**
 * Validates that text doesn't contain malicious patterns.
 * Uses DOMPurify to check if sanitization would change the input.
 */
export function isValidUserInput(input: string): boolean {
  return DOMPurify.sanitize(input) === input;
}
```

- `sanitizeUserInput` strips ALL HTML (plain text output) -- same intent as before, but robust
- `sanitizeHtml` is a new helper that allows safe markup (useful for rich content)
- `isValidUserInput` returns true only if DOMPurify finds nothing to strip
- `escapeHtml` is removed (DOMPurify handles this internally)

### Step 3: Update `src/components/shared/MessageFormatter.tsx`

No import changes needed -- it already imports `sanitizeUserInput` and `isValidUserInput` from `@/lib/security`, and those function signatures remain the same.

The only behavioral change: sanitization is now handled by DOMPurify instead of regex, making it more reliable.

### Files changed

| File | Change |
|------|--------|
| `package.json` | Add `dompurify` and `@types/dompurify` |
| `src/lib/security.ts` | Replace regex functions with DOMPurify-based implementations |

`MessageFormatter.tsx` requires **no changes** -- the imports and function signatures are unchanged.

