
# Performance Debugging Toolkit Implementation

## Overview

This plan implements a comprehensive performance debugging system to identify the exact sources of flickering, layout shifts, and performance issues. The toolkit will be accessible via a keyboard shortcut (D key) and will provide real-time visual feedback on performance problems.

---

## What Will Be Built

### 1. Core Debug Context/Hook
A centralized `useDebugMode` hook and context that manages the debug state globally across the app.

### 2. Layout Shift Observer
Uses the PerformanceObserver API to detect and log Cumulative Layout Shift (CLS) events, with visual highlighting of shifting elements.

### 3. Component Re-render Tracker  
Instruments key components to log re-renders and identify unnecessary updates during scroll/interaction.

### 4. Visual Debug Overlay
A floating overlay showing:
- FPS counter
- Layout shift score
- Re-render count
- Currently animated elements
- Intersection Observer triggers

### 5. Element Highlighting System
Visual borders/overlays on:
- 🔴 Red borders: Elements causing layout shifts
- 🔵 Blue borders: Lazy-loaded elements
- 🟢 Green borders: Currently animating elements
- 🟡 Yellow borders: Intersection Observer triggers

---

## Files to Create

### `src/contexts/DebugContext.tsx`
Central debug state management with:
- `isDebugMode: boolean`
- `layoutShifts: LayoutShiftEntry[]`
- `reRenderCounts: Map<string, number>`
- `intersectionTriggers: Element[]`
- Keyboard listener for 'D' key toggle

### `src/hooks/useDebugMode.ts`  
Hook to consume debug context and provide helper functions.

### `src/hooks/useLayoutShiftObserver.ts`
PerformanceObserver hook that:
- Monitors `layout-shift` entry type
- Logs element that shifted with value
- Adds temporary red border to shifting elements
- Accumulates CLS score

### `src/hooks/useRenderLogger.ts`
Hook to track component re-renders:
- Counts renders per component
- Logs to console in debug mode
- Optionally includes props diff

### `src/components/debug/DebugOverlay.tsx`
Floating panel showing:
- Current FPS
- CLS score
- Re-render counts by component
- Active animations count
- Connection quality indicator

### `src/components/debug/DebugProvider.tsx`
Provider component wrapping the app with debug context and observers.

---

## Files to Modify

### `src/App.tsx`
- Wrap app with `DebugProvider`
- Conditionally render `DebugOverlay`

### `src/components/ui/lazy-load.tsx`
- Add blue debug border when debug mode active
- Log when Intersection Observer triggers
- Add entry to debug context when element becomes visible

### `src/hooks/useScrollAnimation.ts`
- Log Intersection Observer triggers in debug mode
- Add yellow highlight to observed elements

### `src/components/eye/EmotionalEye.tsx`
- Add render count logging in debug mode
- Add green animation indicator border

### `src/components/Hero.tsx`
- Add render count logging
- Track animation frame counts

### `src/components/LandingPage.tsx`
- Instrument ScrollReveal with debug logging
- Track major component re-renders

---

## Technical Implementation Details

### Layout Shift Detection
```typescript
// src/hooks/useLayoutShiftObserver.ts
const useLayoutShiftObserver = () => {
  const { isDebugMode, addLayoutShift } = useDebugMode();
  
  useEffect(() => {
    if (!isDebugMode || !('PerformanceObserver' in window)) return;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
          const sources = (entry as any).sources || [];
          sources.forEach((source: any) => {
            const node = source.node;
            if (node && node instanceof HTMLElement) {
              // Add red border
              node.style.outline = '3px solid red';
              node.style.outlineOffset = '-3px';
              setTimeout(() => {
                node.style.outline = '';
                node.style.outlineOffset = '';
              }, 2000);
              
              console.warn('[Layout Shift]', {
                value: entry.value,
                element: node,
                tagName: node.tagName,
                className: node.className,
                id: node.id
              });
            }
          });
          addLayoutShift(entry);
        }
      }
    });
    
    observer.observe({ type: 'layout-shift', buffered: true });
    return () => observer.disconnect();
  }, [isDebugMode]);
};
```

### Debug Overlay UI
```text
┌─────────────────────────────┐
│ 🔧 DEBUG MODE               │
├─────────────────────────────┤
│ FPS: 60                     │
│ CLS: 0.023                  │
│ Re-renders: 12              │
├─────────────────────────────┤
│ Top Re-renders:             │
│  • EmotionalEye: 8          │
│  • LazyLoad: 3              │
│  • ScrollReveal: 1          │
├─────────────────────────────┤
│ Recent Shifts: 2            │
│  • div.service-card         │
│  • img.hero-bg              │
└─────────────────────────────┘
```

### Keyboard Toggle
```typescript
// In DebugProvider
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only trigger on 'D' key, not when typing in inputs
    if (e.key.toLowerCase() === 'd' && 
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      setIsDebugMode(prev => !prev);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Connection Quality Detection
```typescript
// Detect slow connections to provide context
const connection = (navigator as any).connection;
const isSlowConnection = connection && 
  (connection.effectiveType === '2g' || 
   connection.effectiveType === 'slow-2g' ||
   connection.saveData);
```

---

## Visual Indicators Summary

| Element Type | Border Color | When Shown |
|--------------|--------------|------------|
| Layout shift source | 🔴 Red (3px solid) | For 2 seconds after shift |
| Lazy-loaded content | 🔵 Blue (2px dashed) | While loading |
| Animating elements | 🟢 Green (2px solid) | During animation |
| IO observed elements | 🟡 Yellow (2px dotted) | When intersection triggers |

---

## Implementation Order

1. **Create DebugContext and Provider** - Foundation for all debug features
2. **Add Layout Shift Observer** - Most critical for identifying flicker sources
3. **Add Debug Overlay UI** - Visual feedback panel
4. **Instrument LazyLoad** - Track lazy loading behavior
5. **Instrument ScrollAnimation** - Track Intersection Observer triggers
6. **Add Re-render Logging** - Identify unnecessary re-renders
7. **Wire up keyboard toggle** - Enable easy on/off switching

---

## Expected Outcomes

After implementation, pressing 'D' will:
1. Show a floating debug panel with real-time metrics
2. Highlight any element causing layout shifts with a red border
3. Show blue borders on lazy-loaded elements
4. Log all Intersection Observer triggers to console
5. Show re-render counts per component
6. Make it immediately obvious what's causing flickering

This will identify the exact sources without affecting the normal user experience (debug mode is off by default).
