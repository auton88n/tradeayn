
# Performance Optimization Plan: Chat Input, Transcript, and Landing Page

## Problems Identified

### 1. Chat Input Typing Lag
**Root Cause:** Every keystroke triggers multiple operations:
- `setIsUserTyping(true)` - state update in AYNEmotionContext
- `setIsAttentive(true)` - state update in AYNEmotionContext  
- `updateActivity()` - state update in AYNEmotionContext
- `onTypingContentChange?.(inputMessage)` - propagates to parent (though currently disabled)
- Two timeout setup/cleanup operations
- Language detection (debounced at 200ms)

**Solution:** Remove context state updates during typing. The eye doesn't need to react to every keystroke - only when the user stops typing briefly.

### 2. Transcript Scrolling Lag
**Root Cause:** 
- The `hover:-translate-y-0.5` CSS class on every message causes layout recalculations during scroll
- `MessageFormatter` component may trigger expensive re-renders
- Group hover effects (`opacity-0 group-hover:opacity-100`) force repaints

**Solution:** Add CSS containment to message bubbles and remove per-message hover transforms that trigger during scroll.

### 3. Landing Page Scroll Performance Degradation
**Root Cause:**
- Multiple `ScrollReveal` components create IntersectionObservers
- Each LazyLoad component creates another IntersectionObserver
- Service cards use `motion.div` with `whileHover` which registers event listeners
- Many observers competing for attention causes scroll jank after initial fast render

**Solution:** 
- Add CSS `will-change: transform` to animated elements before they animate
- Use CSS containment on service cards
- Reduce observer count by batching LazyLoad components

---

## Implementation Details

### Step 1: Optimize Chat Input Typing (ChatInput.tsx)

Remove the expensive context calls during typing. Only trigger them once when user starts/stops typing:

```typescript
// Current (lines 232-275): Updates context on EVERY keystroke
useEffect(() => {
  if (inputMessage.trim()) {
    setIsUserTyping(true);      // Called every keystroke
    setIsAttentive(true);       // Called every keystroke
    updateActivity();            // Called every keystroke
    ...
  }
}, [inputMessage, ...]);

// New: Only update context on START/STOP typing transitions
useEffect(() => {
  const hasContent = inputMessage.trim().length > 0;
  
  // Only notify when STARTING to type (first character)
  if (hasContent && !wasTypingRef.current) {
    setIsUserTyping(true);
    setIsAttentive(true);
    updateActivity();
    wasTypingRef.current = true;
  }
  
  // Stop typing timeout
  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  
  typingTimeoutRef.current = setTimeout(() => {
    setIsUserTyping(false);
    wasTypingRef.current = false;
  }, 1000);
  
  // Language detection (keep as-is with 200ms debounce)
  ...
}, [inputMessage]);
```

This reduces context updates from ~10 per second to 1-2 per typing session.

### Step 2: Optimize Transcript Message Scrolling (TranscriptMessage.tsx)

Remove the hover transform that causes layout shifts during scroll:

```typescript
// Current (line 91):
"hover:-translate-y-0.5",

// Remove this line entirely - it causes layout recalculation during scroll
```

Add CSS containment to prevent scroll-triggered repaints:

```typescript
// Add to the message bubble className:
"contain-content",
```

### Step 3: Optimize Landing Page Scroll (LandingPage.tsx)

Add `will-change` and containment to service cards to hint GPU acceleration:

```typescript
// Service card motion.div (line 577):
// Current:
<motion.div className="bg-neutral-50 ... overflow-visible"

// Add CSS containment class:
<motion.div className="bg-neutral-50 ... overflow-visible contain-layout"
```

Also add to index.css:

```css
.contain-layout {
  contain: layout style;
}

.contain-content {
  contain: content;
}
```

### Step 4: Optimize ScrollReveal Observers

The current implementation creates many individual observers. Add cleanup optimization:

```typescript
// useScrollAnimation.ts - Add disconnect on visibility (already done with triggerOnce)
// No changes needed - the current implementation is correct
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/ChatInput.tsx` | Use ref to track typing state, only call context on start/stop |
| `src/components/transcript/TranscriptMessage.tsx` | Remove `hover:-translate-y-0.5`, add CSS containment |
| `src/components/LandingPage.tsx` | Add `contain-layout` to service cards |
| `src/index.css` | Add `.contain-layout` and `.contain-content` utility classes |

---

## Expected Performance Improvements

| Issue | Before | After |
|-------|--------|-------|
| Chat input context updates | ~10/second | 2/session |
| Transcript scroll repaints | On every hover | None during scroll |
| Landing scroll observers | Active throughout | Disconnect after trigger |

---

## Technical Summary

1. **ChatInput**: Add `wasTypingRef` to track typing state transitions, call `setIsUserTyping`/`setIsAttentive`/`updateActivity` only on first keystroke, not every keystroke.

2. **TranscriptMessage**: Remove the `hover:-translate-y-0.5` transform that triggers layout recalculation during scroll. Add CSS containment.

3. **LandingPage**: Add CSS containment classes to service cards to isolate layout calculations and reduce scroll jank.

4. **CSS Utilities**: Add new containment utility classes for reuse across the app.
