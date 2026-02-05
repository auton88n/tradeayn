
# Replace Chat History Sidebar with Collapsible Panel

## Overview

Replace the current full-screen slide-in `TranscriptSidebar` with a collapsible chat history panel that appears **above** the ChatInput. The ChatInput remains always visible; only the chat history expands/collapses.

---

## Current Architecture

```text
+------------------------------------------+
|              Main Content                |
|           (AYN Eye + Response)           |
+------------------------------------------+
|           [ChatInput - always visible]   |
+------------------------------------------+

+ TranscriptSidebar (fixed overlay, 420px, slides from right)
```

---

## New Architecture

```text
+------------------------------------------+
|              Main Content                |
|           (AYN Eye + Response)           |
+------------------------------------------+
| [Chat History Collapsible]  <- NEW       |
|   +-- Header: "Chat History" + badge     |
|   +-- Collapsed: just header (38px)      |
|   +-- Expanded: scrollable messages      |
+------------------------------------------+
|           [ChatInput - always visible]   |
+------------------------------------------+
```

---

## Technical Implementation

### 1. Create New Component: `ChatHistoryCollapsible.tsx`

**Location:** `src/components/dashboard/ChatHistoryCollapsible.tsx`

**Props:**
- `messages: Message[]` - chat messages to display
- `isOpen: boolean` - collapsed/expanded state
- `onToggle: () => void` - toggle handler
- `onClear?: () => void` - clear chat handler

**Structure:**
```tsx
<div className="rounded-xl border border-border overflow-hidden bg-card">
  <Collapsible open={isOpen} onOpenChange={onToggle}>
    <CollapsibleTrigger>
      <!-- Header with icon, title, message count, chevron -->
    </CollapsibleTrigger>
    
    <CollapsibleContent>
      <ScrollArea className="h-64">
        <!-- Messages using TranscriptMessage component -->
      </ScrollArea>
      
      <!-- Footer: Copy All, Clear buttons -->
    </CollapsibleContent>
  </Collapsible>
</div>
```

**Features:**
- Uses existing `TranscriptMessage` component for consistent message styling
- Animated chevron rotation on expand/collapse (Framer Motion)
- Badge showing message count
- Footer with "Copy All" and "Clear" actions
- Height capped at 256px (h-64) with scroll
- Smooth expand/collapse animation from Radix Collapsible

---

### 2. Update `CenterStageLayout.tsx`

**Changes:**
1. Import the new `ChatHistoryCollapsible` component
2. Add new props to receive messages and transcript state
3. Render the collapsible panel between the content area and ChatInput

**New props needed:**
```tsx
transcriptMessages: Message[];
transcriptOpen: boolean;
onTranscriptToggle: () => void;
onTranscriptClear: () => void;
```

**Placement in layout:**
```tsx
<div className="input-container">
  {/* NEW: Collapsible history panel */}
  <ChatHistoryCollapsible
    messages={transcriptMessages}
    isOpen={transcriptOpen}
    onToggle={onTranscriptToggle}
    onClear={onTranscriptClear}
  />
  
  {/* Existing: Chat input */}
  <ChatInput ... />
</div>
```

---

### 3. Update `DashboardContainer.tsx`

**Changes:**
1. Remove the `<TranscriptSidebar>` component entirely
2. Pass messages and transcript state down to `CenterStageLayout`
3. Keep the mobile header button - it will now toggle the collapsible panel
4. Remove the floating toggle button (no longer needed with inline collapsible)

---

### 4. Clean Up: Remove TranscriptSidebar Usage

**Files affected:**
- `src/components/dashboard/DashboardContainer.tsx` - remove import and usage
- Keep `src/components/transcript/TranscriptSidebar.tsx` file (may be used elsewhere or for reference)
- Keep `src/components/transcript/TranscriptMessage.tsx` - reused by new component

---

## Visual Design

### Collapsed State
```text
+--------------------------------------------------+
| [MessageSquare icon] Chat History (5)    [v]     |
+--------------------------------------------------+
```
- Single row, ~44px height
- Left: Icon + "Chat History" label + message count badge
- Right: Chevron pointing down

### Expanded State
```text
+--------------------------------------------------+
| [MessageSquare icon] Chat History (5)    [^]     |
+--------------------------------------------------+
|                                                  |
| [User bubble - right aligned]                    |
|                                                  |
|        [AYN bubble - left aligned]               |
|                                                  |
| [Scrollable area - max 256px]                    |
|                                                  |
+--------------------------------------------------+
| [Copy All]                      [Clear]          |
+--------------------------------------------------+
```

---

## Animation Details

Using Framer Motion for smooth transitions:
- Chevron rotation: 180 degrees on toggle
- Content height: Radix Collapsible handles the height animation automatically
- Message appearance: fade + slide-up (same as current TranscriptMessage)

---

## Summary of File Changes

| File | Action |
|------|--------|
| `src/components/dashboard/ChatHistoryCollapsible.tsx` | **Create** - new collapsible component |
| `src/components/dashboard/CenterStageLayout.tsx` | **Modify** - add collapsible above ChatInput |
| `src/components/dashboard/DashboardContainer.tsx` | **Modify** - remove TranscriptSidebar, pass props to CenterStageLayout |

---

## Benefits

1. **No overlay/backdrop** - Content remains visible and interactive
2. **Always accessible** - Toggle is right above the chat input
3. **Consistent pattern** - Matches the Engineering workspace AI panel
4. **Space efficient** - Collapsed state takes minimal space (~44px)
5. **Mobile friendly** - Works well on all screen sizes
