import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

interface LayoutShiftEntry {
  value: number;
  element: string;
  className: string;
  id: string;
  timestamp: number;
}

interface DebugContextType {
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

const DebugContext = createContext<DebugContextType | null>(null);

export const useDebugContext = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebugContext must be used within a DebugProvider');
  }
  return context;
};

// Safe version that doesn't throw - for optional debugging
export const useDebugContextOptional = () => {
  return useContext(DebugContext);
};

interface DebugProviderProps {
  children: ReactNode;
}

export const DebugContextProvider = ({ children }: DebugProviderProps) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [layoutShifts, setLayoutShifts] = useState<LayoutShiftEntry[]>([]);
  const [clsScore, setClsScore] = useState(0);
  // Use ref for render counts to avoid triggering re-renders when counting
  const reRenderCountsRef = useRef<Map<string, number>>(new Map());
  const [reRenderCounts, setReRenderCounts] = useState<Map<string, number>>(new Map());
  const [intersectionTriggers, setIntersectionTriggers] = useState<string[]>([]);
  const [fps, setFps] = useState(60);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  
  // Batch update render counts periodically instead of on every render
  useEffect(() => {
    if (!isDebugMode) return;
    
    const interval = setInterval(() => {
      setReRenderCounts(new Map(reRenderCountsRef.current));
    }, 500); // Update display every 500ms
    
    return () => clearInterval(interval);
  }, [isDebugMode]);
  // Detect slow connection
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      const checkConnection = () => {
        const slow = connection.effectiveType === '2g' || 
                    connection.effectiveType === 'slow-2g' ||
                    connection.saveData;
        setIsSlowConnection(slow);
      };
      checkConnection();
      connection.addEventListener?.('change', checkConnection);
      return () => connection.removeEventListener?.('change', checkConnection);
    }
  }, []);

  // Keyboard toggle for debug mode (D key)
  useEffect(() => {
    if (import.meta.env.PROD) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger on 'D' key, not when typing in inputs
      // Guard against undefined e.key (can happen with some special keys)
      if (!e.key) return;
      const target = e.target as HTMLElement;
      if (e.key.toLowerCase() === 'd' && 
          !['INPUT', 'TEXTAREA'].includes(target.tagName) &&
          !target.isContentEditable) {
        setIsDebugMode(prev => {
          const newValue = !prev;
          console.log(`[Debug Mode] ${newValue ? 'ENABLED' : 'DISABLED'} - Press D to toggle`);
          return newValue;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => !prev);
  }, []);

  const addLayoutShift = useCallback((entry: PerformanceEntry) => {
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
          timestamp: Date.now()
        };
        
        setLayoutShifts(prev => [...prev.slice(-19), newEntry]); // Keep last 20
        setClsScore(prev => prev + shiftEntry.value);
        
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
          id: node.id
        });
      }
    });
  }, []);

  // Increment render count without triggering re-renders (uses ref)
  const incrementRenderCount = useCallback((componentName: string) => {
    reRenderCountsRef.current.set(
      componentName, 
      (reRenderCountsRef.current.get(componentName) || 0) + 1
    );
  }, []);

  const resetRenderCounts = useCallback(() => {
    reRenderCountsRef.current = new Map();
    setReRenderCounts(new Map());
  }, []);

  const addIntersectionTrigger = useCallback((elementId: string) => {
    setIntersectionTriggers(prev => {
      if (prev.includes(elementId)) return prev;
      return [...prev.slice(-9), elementId]; // Keep last 10
    });
  }, []);

  const clearIntersectionTriggers = useCallback(() => {
    setIntersectionTriggers([]);
  }, []);

  const value: DebugContextType = {
    isDebugMode,
    setIsDebugMode,
    toggleDebugMode,
    layoutShifts,
    addLayoutShift,
    clsScore,
    reRenderCounts,
    incrementRenderCount,
    resetRenderCounts,
    intersectionTriggers,
    addIntersectionTrigger,
    clearIntersectionTriggers,
    fps,
    setFps,
    isSlowConnection
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
};
