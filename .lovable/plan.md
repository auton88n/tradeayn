

# Fix Plan: "Oops! AYN hit a snag" Error During Message Send

## Problem Summary

Users (specifically "rzan") see an ErrorBoundary crash ("Oops! AYN hit a snag") when sending messages, even though:
- The message is sent and saved successfully
- The AI responds correctly (visible in chat history)

This indicates a React render error occurring during the UI animation phase, not the API/backend.

---

## Investigation Findings

| Component | Status |
|-----------|--------|
| Message API calls | Working (messages saved in DB) |
| AI responses | Working (responses saved correctly) |
| ErrorBoundary trigger | Catching a React render crash |
| Location of crash | During response bubble animation/rendering |

---

## Root Causes Identified

### 1. Missing `sessionId` Prop (Minor)
The `ResponseCard` in `CenterStageLayout.tsx` is missing the `sessionId` prop needed for feedback persistence.

### 2. Race Condition in Response Processing (Main Issue)
The response processing effect runs in a `setTimeout` callback, which can cause:
- Stale closure references to `lastMessage`
- Component state updates after unmount
- Animation triggers on undefined data

### 3. Potential Null Access During Streaming
Messages with `isTyping: true` may have incomplete data, and accessing properties like `content` or `attachment` before they're set could crash.

---

## Fix Implementation

### Fix 1: Pass sessionId to ResponseCard
Add the missing prop so feedback saves correctly.

**File:** `src/components/dashboard/CenterStageLayout.tsx`
```tsx
<ResponseCard 
  responses={responseBubbles} 
  isMobile={isMobile}
  onDismiss={clearResponseBubbles}
  variant="inline"
  showPointer={false}
  sessionId={currentSessionId}  // ADD THIS
/>
```

### Fix 2: Add Safety Guards to Response Processing
Wrap the response processing in try-catch and add null checks.

**File:** `src/components/dashboard/CenterStageLayout.tsx`
```tsx
// After blink, use backend emotion and emit bubbles
setTimeout(() => {
  try {
    // Safety check - ensure message still exists
    if (!lastMessage?.content) return;
    
    // ... existing code ...
    
  } catch (error) {
    console.error('[CenterStageLayout] Error processing response:', error);
  }
}, 50);
```

### Fix 3: Add Content Validation Before Bubble Emission
Ensure the content is valid before emitting.

**File:** `src/components/dashboard/CenterStageLayout.tsx`
```tsx
// Validate content before emitting
const response = (lastMessage.content || '').replace(/^[!?\s]+/, '').trim();
if (!response) return; // Don't emit empty bubbles

emitResponseBubble(response, bubbleType, attachment);
```

### Fix 4: Guard Against Unmounted State in Effect
Use a cleanup flag to prevent updates after unmount.

**File:** `src/components/dashboard/CenterStageLayout.tsx`
```tsx
useEffect(() => {
  let isMounted = true;
  
  // ... existing checks ...
  
  setTimeout(() => {
    if (!isMounted) return; // Prevent updates after unmount
    // ... rest of processing
  }, 50);
  
  return () => { isMounted = false; };
}, [/* deps */]);
```

---

## Technical Changes Summary

| File | Change |
|------|--------|
| `CenterStageLayout.tsx` | Pass `sessionId` to ResponseCard |
| `CenterStageLayout.tsx` | Add try-catch around response processing |
| `CenterStageLayout.tsx` | Add null/content validation checks |
| `CenterStageLayout.tsx` | Add unmount guard to effect |

---

## Testing Approach

After implementing fixes:
1. Send multiple messages rapidly
2. Switch between chats while a response is loading
3. Check that no ErrorBoundary errors appear
4. Verify messages still save correctly
5. Test with rzan's account specifically

