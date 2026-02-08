

# Migrate to Zustand Stores (Phase 1: debugStore)

## Overview

Replace the React Context-based state management for Debug, Sound, and Emotion with Zustand stores. Zustand's selector-based subscriptions prevent cascading re-renders -- components only re-render when the specific slice of state they subscribe to changes.

This plan covers **Phase 1 only: debugStore**. Sound and Emotion stores will follow in separate prompts after verification.

## Current State Analysis

- **DebugContext**: Defined in `src/contexts/DebugContext.tsx` but the `DebugContextProvider` is **never mounted** -- `DebugProvider` in App.tsx is a passthrough. All 8 consumers use `useDebugContextOptional()` which always returns `null`. The debug system is effectively dead code being safely ignored.
- **Zustand**: Not currently installed.
- **Consumers**: 8 files import from DebugContext (Hero, LazyLoad, DebugOverlay, LandingPage, EmotionalEye, useDebugMode, useRenderLogger, useScrollAnimation, useLayoutShiftObserver).

## Changes

### 1. Install Zustand

Add `zustand` as a dependency.

### 2. New file: `src/stores/debugStore.ts`

Create a Zustand store that mirrors the `DebugContextType` interface:

- `isDebugMode`, `toggleDebugMode`, `setIsDebugMode`
- `layoutShifts`, `addLayoutShift`, `clsScore`
- `reRenderCounts`, `incrementRenderCount`, `resetRenderCounts`
- `intersectionTriggers`, `addIntersectionTrigger`, `clearIntersectionTriggers`
- `fps`, `setFps`
- `isSlowConnection`

The store will include the keyboard toggle (D key) and connection detection logic as side effects initialized on first import. The batch update interval for render counts will use `subscribe` + `setInterval` pattern.

### 3. Update: `src/hooks/useDebugMode.ts`

Replace re-exports of context hooks with store selectors:

```typescript
export const useDebugMode = () => useDebugStore();
export const useDebugModeOptional = () => useDebugStore();
export const useDebugRender = (name: string) => {
  const isDebugMode = useDebugStore(s => s.isDebugMode);
  if (isDebugMode) useDebugStore.getState().incrementRenderCount(name);
};
```

### 4. Update all 8 consumer files

Replace `useDebugContextOptional()` imports with `useDebugStore` selectors. Each component only subscribes to the specific fields it needs:

| File | Current | New |
|------|---------|-----|
| `Hero.tsx` | `useDebugContextOptional()` stored in ref | `useDebugStore` in ref (same pattern) |
| `lazy-load.tsx` | `useDebugContextOptional()` stored in ref | `useDebugStore` in ref |
| `LandingPage.tsx` | `useDebugContextOptional()` stored in ref | `useDebugStore` in ref |
| `EmotionalEye.tsx` | `useDebugContextOptional()` | Selective: `useDebugStore(s => s.isDebugMode)` |
| `DebugOverlay.tsx` | `useDebugContext()` (throws) | `useDebugStore()` (full store) |
| `useRenderLogger.ts` | `useDebugContextOptional()` | `useDebugStore(s => s.isDebugMode)` |
| `useScrollAnimation.ts` | `useDebugContextOptional()` stored in ref | `useDebugStore` in ref |
| `useLayoutShiftObserver.ts` | `useDebugContextOptional()` | `useDebugStore(s => s.addLayoutShift)` |

### 5. Remove: `DebugProvider` from App.tsx

Remove the `<DebugProvider>` wrapper and its import. Zustand stores don't need providers.

### 6. Clean up old files

- Remove `src/components/debug/DebugProvider.tsx` (passthrough, no longer needed)
- Keep `src/contexts/DebugContext.tsx` temporarily but mark as deprecated -- will be removed once all consumers are verified working

## Why debugStore first

- Lowest risk: the context provider isn't even mounted, so all consumers already handle `null`
- Fewest real consumers: most use the optional hook pattern
- No database sync (unlike SoundContext)
- No complex timer/ref logic interleaved with React state (unlike EmotionContext)

## Files changed

| File | Change |
|------|--------|
| `package.json` | Add `zustand` dependency |
| `src/stores/debugStore.ts` | New Zustand store |
| `src/hooks/useDebugMode.ts` | Rewrite to use store |
| `src/components/debug/DebugProvider.tsx` | Delete |
| `src/App.tsx` | Remove DebugProvider import and wrapper |
| `src/components/landing/Hero.tsx` | Switch to debugStore |
| `src/components/ui/lazy-load.tsx` | Switch to debugStore |
| `src/components/LandingPage.tsx` | Switch to debugStore |
| `src/components/eye/EmotionalEye.tsx` | Switch to debugStore |
| `src/components/debug/DebugOverlay.tsx` | Switch to debugStore |
| `src/hooks/useRenderLogger.ts` | Switch to debugStore |
| `src/hooks/useScrollAnimation.ts` | Switch to debugStore |
| `src/hooks/useLayoutShiftObserver.ts` | Switch to debugStore |

