import { create } from 'zustand';

interface LayoutShiftEntry {
  value: number;
  element: string;
  className: string;
  id: string;
  timestamp: number;
}

interface DebugStore {
  isDebugMode: boolean;
  setIsDebugMode: (value: boolean) => void;
  toggleDebugMode: () => void;

  // Layout shifts
  layoutShifts: LayoutShiftEntry[];
  addLayoutShift: (entry: PerformanceEntry) => void;
  clsScore: number;

  // Re-render tracking
  reRenderCounts: Map<string, number>;
  incrementRenderCount: (componentName: string) => void;
  resetRenderCounts: () => void;

  // Intersection Observer triggers
  intersectionTriggers: string[];
  addIntersectionTrigger: (elementId: string) => void;
  clearIntersectionTriggers: () => void;

  // FPS tracking
  fps: number;
  setFps: (value: number) => void;

  // Connection info
  isSlowConnection: boolean;
}

// Internal ref for render counts (avoids store updates on every render)
const _renderCounts = new Map<string, number>();

export const useDebugStore = create<DebugStore>((set, get) => ({
  isDebugMode: false,
  setIsDebugMode: (value) => set({ isDebugMode: value }),
  toggleDebugMode: () => set((s) => ({ isDebugMode: !s.isDebugMode })),

  layoutShifts: [],
  clsScore: 0,
  addLayoutShift: (entry: PerformanceEntry) => {
    const shiftEntry = entry as any;
    const sources = shiftEntry.sources || [];

    sources.forEach((source: any) => {
      const node = source.node;
      if (node && node instanceof HTMLElement) {
        const newEntry: LayoutShiftEntry = {
          value: shiftEntry.value,
          element: node.tagName.toLowerCase(),
          className: node.className?.split?.(' ')?.[0] || '',
          id: node.id || '',
          timestamp: Date.now(),
        };

        set((s) => ({
          layoutShifts: [...s.layoutShifts.slice(-19), newEntry],
          clsScore: s.clsScore + shiftEntry.value,
        }));

        // Visual highlight
        node.style.outline = '3px solid hsl(0, 100%, 50%)';
        node.style.outlineOffset = '-3px';
        setTimeout(() => {
          node.style.outline = '';
          node.style.outlineOffset = '';
        }, 2000);

        console.warn('[Layout Shift]', {
          value: shiftEntry.value.toFixed(4),
          element: node.tagName,
          className: node.className,
          id: node.id,
        });
      }
    });
  },

  reRenderCounts: new Map(),
  incrementRenderCount: (componentName: string) => {
    _renderCounts.set(componentName, (_renderCounts.get(componentName) || 0) + 1);
    // Don't update store state here — batched via interval below
  },
  resetRenderCounts: () => {
    _renderCounts.clear();
    set({ reRenderCounts: new Map() });
  },

  intersectionTriggers: [],
  addIntersectionTrigger: (elementId: string) => {
    set((s) => {
      if (s.intersectionTriggers.includes(elementId)) return s;
      return { intersectionTriggers: [...s.intersectionTriggers.slice(-9), elementId] };
    });
  },
  clearIntersectionTriggers: () => set({ intersectionTriggers: [] }),

  fps: 60,
  setFps: (value) => set({ fps: value }),

  isSlowConnection: false,
}));

// --- Side effects (run once on import) ---

// Batch render count updates every 500ms when debug mode is active
let _batchInterval: ReturnType<typeof setInterval> | null = null;
useDebugStore.subscribe((state, prev) => {
  if (state.isDebugMode && !prev.isDebugMode) {
    _batchInterval = setInterval(() => {
      useDebugStore.setState({ reRenderCounts: new Map(_renderCounts) });
    }, 500);
  } else if (!state.isDebugMode && prev.isDebugMode) {
    if (_batchInterval) clearInterval(_batchInterval);
    _batchInterval = null;
  }
});

// HMR guard to prevent duplicate listener registration
let _listenersAttached = false;

// Keyboard toggle (D key) — dev only
if (!import.meta.env.PROD && !_listenersAttached) {
  _listenersAttached = true;
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!e.key) return;
    const target = e.target as HTMLElement;
    if (
      e.key.toLowerCase() === 'd' &&
      !['INPUT', 'TEXTAREA'].includes(target.tagName) &&
      !target.isContentEditable
    ) {
      const newValue = !useDebugStore.getState().isDebugMode;
      useDebugStore.setState({ isDebugMode: newValue });
      console.log(`[Debug Mode] ${newValue ? 'ENABLED' : 'DISABLED'} — Press D to toggle`);
    }
  });
}

// Detect slow connection (with guard)
if (!_listenersAttached) {
  // Already guarded above, but connection listener needs its own check
}
const connection = (navigator as any).connection;
if (connection) {
  const checkConnection = () => {
    const slow =
      connection.effectiveType === '2g' ||
      connection.effectiveType === 'slow-2g' ||
      connection.saveData;
    useDebugStore.setState({ isSlowConnection: slow });
  };
  checkConnection();
  connection.addEventListener?.('change', checkConnection);
}
