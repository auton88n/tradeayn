import { useEffect, useRef } from 'react';
import { useDebugStore } from '@/stores/debugStore';
import { X, Activity, Layers, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export const DebugOverlay = () => {
  const {
    isDebugMode,
    setIsDebugMode,
    clsScore,
    layoutShifts,
    reRenderCounts,
    fps,
    setFps,
    intersectionTriggers,
    isSlowConnection,
    resetRenderCounts,
    clearIntersectionTriggers
  } = useDebugStore();

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number | null>(null);

  // FPS counter
  useEffect(() => {
    if (!isDebugMode) return;

    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      
      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      rafIdRef.current = requestAnimationFrame(measureFPS);
    };

    rafIdRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isDebugMode, setFps]);

  if (!isDebugMode) return null;

  // Get top re-renders sorted by count
  const topReRenders = Array.from(reRenderCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalRenders = Array.from(reRenderCounts.values()).reduce((a, b) => a + b, 0);

  // Recent layout shifts
  const recentShifts = layoutShifts.slice(-3);

  // FPS color based on performance
  const fpsColor = fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';
  const clsColor = clsScore < 0.1 ? 'text-green-400' : clsScore < 0.25 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div 
      className="fixed bottom-4 right-4 z-[9999] bg-neutral-900/95 text-white rounded-lg shadow-2xl border border-neutral-700 text-xs font-mono backdrop-blur-sm"
      style={{ width: '280px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700 bg-neutral-800/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="font-semibold">DEBUG MODE</span>
        </div>
        <button 
          onClick={() => setIsDebugMode(false)}
          className="p-1 hover:bg-neutral-700 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Stats */}
      <div className="p-3 space-y-3">
        {/* Performance Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-neutral-400">FPS:</span>
              <span className={`ml-1 font-bold ${fpsColor}`}>{fps}</span>
            </div>
            <div>
              <span className="text-neutral-400">CLS:</span>
              <span className={`ml-1 font-bold ${clsColor}`}>{clsScore.toFixed(4)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isSlowConnection ? (
              <WifiOff className="w-3 h-3 text-red-400" />
            ) : (
              <Wifi className="w-3 h-3 text-green-400" />
            )}
          </div>
        </div>

        {/* Re-renders */}
        <div className="border-t border-neutral-700 pt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-blue-400" />
              <span className="text-neutral-400">Re-renders:</span>
              <span className="font-bold text-blue-400">{totalRenders}</span>
            </div>
            <button 
              onClick={resetRenderCounts}
              className="text-[10px] text-neutral-500 hover:text-neutral-300"
            >
              Reset
            </button>
          </div>
          {topReRenders.length > 0 && (
            <div className="space-y-0.5 pl-4">
              {topReRenders.map(([name, count]) => (
                <div key={name} className="flex justify-between text-neutral-400">
                  <span className="truncate max-w-[160px]">• {name}</span>
                  <span className="text-blue-300">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Layout Shifts */}
        {recentShifts.length > 0 && (
          <div className="border-t border-neutral-700 pt-2">
            <div className="flex items-center gap-1 mb-1">
              <Layers className="w-3 h-3 text-red-400" />
              <span className="text-neutral-400">Recent Shifts:</span>
              <span className="font-bold text-red-400">{layoutShifts.length}</span>
            </div>
            <div className="space-y-0.5 pl-4">
              {recentShifts.map((shift, i) => (
                <div key={i} className="text-neutral-400 truncate">
                  • {shift.element}
                  {shift.className && `.${shift.className}`}
                  {shift.id && `#${shift.id}`}
                  <span className="text-red-300 ml-1">({shift.value.toFixed(4)})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IO Triggers */}
        {intersectionTriggers.length > 0 && (
          <div className="border-t border-neutral-700 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-neutral-400">IO Triggers:</span>
              <button 
                onClick={clearIntersectionTriggers}
                className="text-[10px] text-neutral-500 hover:text-neutral-300"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {intersectionTriggers.slice(-5).map((trigger, i) => (
                <span 
                  key={i} 
                  className="px-1.5 py-0.5 bg-yellow-900/50 text-yellow-300 rounded text-[10px]"
                >
                  {trigger}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-neutral-700 text-[10px] text-neutral-500 bg-neutral-800/30 rounded-b-lg">
        Press <kbd className="px-1 bg-neutral-700 rounded">D</kbd> to toggle
      </div>
    </div>
  );
};
