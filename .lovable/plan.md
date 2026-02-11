

# Fix Chat Message Ordering (User/AYN disorder)

## Problem

When you send a message, AYN's reply sometimes appears **before** your message in the chat history. This happens because:

- Your message and AYN's streaming placeholder are both created with `new Date()` within milliseconds of each other
- The sort function only compares timestamps, so when two messages have the same (or very close) timestamp, the order becomes random
- This is especially noticeable with fast responses

## Solution

Use the **array insertion order** as a tiebreaker when timestamps are equal. Messages are already added to the array in the correct order (user first, then AYN), so when timestamps match, preserving the original array position guarantees correct ordering.

## Files to Change

| File | Change |
|------|--------|
| `src/components/eye/ResponseCard.tsx` | Update `sortedMessages` sort to use array index as tiebreaker |
| `src/components/dashboard/ChatHistoryCollapsible.tsx` | Same fix for its `sortedMessages` sort |

## Technical Detail

In both files, the sort comparator changes from:

```typescript
.sort((a, b) => timeA - timeB)
```

to:

```typescript
// Preserve original array order when timestamps match
const indexed = messages.map((m, i) => ({ m, i }));
indexed.sort((a, b) => {
  const diff = timeA - timeB;
  return diff !== 0 ? diff : a.i - b.i;
});
return indexed.map(x => x.m);
```

This is a stable sort that respects the insertion order when timestamps collide -- which is always correct since user messages are always added before AYN's response in the code.
