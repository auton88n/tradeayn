

## Redesign AYN Trading Coach to Match Engineering Bottom Chat Style

### Overview
Replace the current floating popup ChartCoachChat with a **bottom-anchored input bar** that expands upward to show messages -- matching the engineering page's `EngineeringBottomChat` design.

---

### Changes

#### 1. Rewrite `src/components/dashboard/ChartCoachChat.tsx`

Replace the floating bubble + popup with a bottom-fixed bar:

**Collapsed state**: A floating Brain button (bottom-right) with message count badge -- same as engineering.

**Expanded state** (default): A bottom-fixed bar spanning the page width with:
- **Messages area** (expandable upward): rounded panel above the input bar with header ("AYN Coach" + Brain icon), ScrollArea (h-[280px]), message bubbles with react-markdown, and "AYN is thinking..." loading indicator. Shows/hides based on `isExpanded` state.
- **Input bar**: Textarea with animated rotating placeholders, send button that appears when text is entered, and a row of action buttons below:
  - Quick action chips (the 5 coaching questions) shown as small buttons
  - Clear chat button
  - Minimize button (collapses to floating Brain icon)

**Key behaviors** (borrowed from engineering):
- Auto-expand when first message arrives
- Smart auto-scroll (only scrolls to bottom when user is near bottom)
- Keyboard shortcuts: Esc to collapse, / to reopen
- Textarea auto-resize (up to 120px)
- Rotating placeholder text (trading-specific)
- Amber/orange accent color theme retained

**Placeholders** (rotating):
```
"Should I take this trade?"
"What's my biggest risk here?"
"Help me stay disciplined..."
"Explain the chart patterns..."
"Am I being emotional about this?"
```

#### 2. Update `src/pages/ChartAnalyzerPage.tsx`

- Pass `result` prop as before
- No structural changes needed -- the component still renders as a sibling

---

### Technical Details

**New ChartCoachChat structure:**
```text
// Collapsed: floating Brain button (bottom-right)
if (isCollapsed) return <FloatingBrainButton />

// Expanded: bottom-fixed bar
<div fixed bottom-0 left-0 right-0 z-50 p-4 pb-6>
  <div max-w-2xl mx-auto>
    
    // Messages panel (slides up when isExpanded && messages.length > 0)
    <AnimatePresence>
      {isExpanded && messages.length > 0 && (
        <div rounded-2xl bg-background/95 backdrop-blur border shadow>
          Header: "AYN Coach" + Clear + Close
          ScrollArea h-[280px]: message bubbles
          Loading indicator
        </div>
      )}
    </AnimatePresence>

    // Input container
    <div rounded-2xl bg-background/95 backdrop-blur border shadow>
      Row 1: Textarea + Send button
      Row 2: Quick action chips + Minimize button
    </div>
  </div>
</div>
```

**Security**: All three layers (input validation, response sanitization, emotion detection) remain in the `useChartCoach` hook -- no changes needed there.

---

### Files Summary

| File | Change |
|------|--------|
| `src/components/dashboard/ChartCoachChat.tsx` | Full rewrite to bottom-bar style matching engineering chat |

Single file change. No hook or edge function modifications needed.

