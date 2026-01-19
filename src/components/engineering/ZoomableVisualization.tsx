import { useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  RotateCcw,
  Box,
  Square,
  Scan
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ZoomableVisualizationProps {
  children: ReactNode;
  title?: string;
  onViewModeChange?: (is3D: boolean) => void;
  is3D?: boolean;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
  showViewToggle?: boolean;
}

export const ZoomableVisualization = ({
  children,
  title = "3D Visualization",
  onViewModeChange,
  is3D = true,
  className,
  minZoom = 0.5,
  maxZoom = 3,
  showViewToggle = true,
}: ZoomableVisualizationProps) => {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, maxZoom));
  }, [maxZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, minZoom));
  }, [minZoom]);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const toggleViewMode = useCallback(() => {
    onViewModeChange?.(!is3D);
  }, [is3D, onViewModeChange]);

  return (
    <>
      {/* Main Visualization Container */}
      <motion.div
        layout
        className={cn(
          "relative rounded-xl overflow-hidden",
          "bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95",
          "border border-cyan-500/30",
          "shadow-[0_0_30px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]",
          isFullscreen && "fixed inset-4 z-50",
          className
        )}
      >
        {/* Futuristic Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Animated Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60 rounded-br-xl" />

        {/* Top Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2 bg-gradient-to-b from-slate-900/90 to-transparent">
          {/* Title & Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-medium text-cyan-300 uppercase tracking-wider">
                {is3D ? '3D' : '2D'} View
              </span>
            </div>
            {title && (
              <span className="text-xs text-slate-400 font-medium hidden sm:block">
                {title}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* View Toggle */}
            {showViewToggle && onViewModeChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleViewMode}
                className="h-7 px-2 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                {is3D ? <Square className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
                <span className="ml-1 text-[10px]">{is3D ? '2D' : '3D'}</span>
              </Button>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= minZoom}
                className="h-6 w-6 p-0 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-30"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              
              <div className="w-16 hidden sm:block">
                <Slider
                  value={[zoom]}
                  min={minZoom}
                  max={maxZoom}
                  step={0.1}
                  onValueChange={([v]) => setZoom(v)}
                  className="h-1"
                />
              </div>
              
              <span className="text-[10px] text-slate-400 font-mono w-8 text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= maxZoom}
                className="h-6 w-6 p-0 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-30"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Reset */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Visualization Content */}
        <div 
          className="w-full h-full pt-10"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out'
          }}
        >
          {children}
        </div>

        {/* Scan Lines Effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />

        {/* Bottom Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-gradient-to-t from-slate-900/90 to-transparent">
          <div className="flex items-center gap-2">
            <Scan className="w-3 h-3 text-cyan-500/50" />
            <span className="text-[9px] text-slate-500 font-mono uppercase">
              Interactive • Drag to Rotate
            </span>
          </div>
          <span className="text-[9px] text-slate-600 font-mono">
            Zoom: {zoom.toFixed(1)}x
          </span>
        </div>
      </motion.div>

      {/* Fullscreen Backdrop */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={toggleFullscreen}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ZoomableVisualization;
