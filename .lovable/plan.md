

# Fix SSE Stream Parser for Reliable Token Delivery

## Problem

The `parseSSEStream` function in `src/hooks/useMessages.ts` (lines 46-99) parses each `data:` line immediately as it encounters a newline. If a TCP packet splits a JSON payload across two chunks, `JSON.parse` fails and the catch block treats the partial JSON as raw text, injecting garbled content into the AI response. This is especially problematic on unstable mobile connections.

## Change

**File: `src/hooks/useMessages.ts`** -- Replace the `parseSSEStream` function (lines 46-99).

The core fix introduces a `currentData` accumulator that collects `data:` lines and only processes them when a blank line signals the SSE event boundary is complete.

**Before (lines 54-95):**
```typescript
let buffer = '';

try {
  while (true) {
    // ... read chunk into buffer ...
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);  // fails on partial JSON
          // ...
        } catch {
          // treats broken JSON as raw text — garbled output
          fullContent += data;
          onChunk(data);
        }
      }
    }
  }
}
```

**After:**
```typescript
let buffer = '';
let currentData = '';

try {
  while (true) {
    // ... read chunk into buffer ...
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (line.startsWith('data: ')) {
        currentData += line.slice(6);
      } else if (line === '' && currentData) {
        // Blank line = event boundary, now safe to parse
        if (currentData === '[DONE]') {
          currentData = '';
          continue;
        }
        try {
          const parsed = JSON.parse(currentData);
          const content = parsed.choices?.[0]?.delta?.content
            || parsed.content || parsed.text;
          if (content) {
            fullContent += content;
            onChunk(content);
          }
        } catch {
          if (import.meta.env.DEV) {
            console.warn('[SSE] Failed to parse event:',
              currentData.slice(0, 100));
          }
        }
        currentData = '';
      }
    }
  }

  // Handle any remaining accumulated data after stream ends
  if (currentData) {
    try {
      const parsed = JSON.parse(currentData);
      const content = parsed.choices?.[0]?.delta?.content
        || parsed.content || parsed.text;
      if (content) {
        fullContent += content;
        onChunk(content);
      }
    } catch { /* final chunk incomplete */ }
  }
}
```

Key improvements:
- Accumulates `data:` lines in `currentData` instead of parsing immediately
- Only parses when a blank line confirms the SSE event is complete
- Removes the fallback that injected raw broken JSON as text
- Handles remaining data after stream ends
- Keeps existing `reader.releaseLock()` in the `finally` block

