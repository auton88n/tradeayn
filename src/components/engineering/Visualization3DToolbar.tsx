import React from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Box, 
  Activity, 
  Thermometer, 
  Ruler, 
  Scissors, 
  Camera, 
  Maximize2,
  RotateCcw,
  Eye,
  EyeOff,
  Grid3X3,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ViewMode = '2d' | '3d';
export type AnalysisMode = 'none' | 'stress' | 'deflection' | 'reinforcement';
export type ColorScheme = 'default' | 'stress' | 'depth';

interface Visualization3DToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  
  analysisMode?: AnalysisMode;
  onAnalysisModeChange?: (mode: AnalysisMode) => void;
  
  showDimensions?: boolean;
  onToggleDimensions?: () => void;
  
  showGrid?: boolean;
  onToggleGrid?: () => void;
  
  showReinforcement?: boolean;
  onToggleReinforcement?: () => void;
  
  autoRotate?: boolean;
  onToggleAutoRotate?: () => void;
  
  onResetView?: () => void;
  onScreenshot?: () => void;
  onFullscreen?: () => void;
  
  // Feature flags for different calculators
  showStressMode?: boolean;
  showDeflectionMode?: boolean;
  showMeasurement?: boolean;
  showSectionCut?: boolean;
  
  className?: string;
  compact?: boolean;
}

export const Visualization3DToolbar = ({
  viewMode,
  onViewModeChange,
  analysisMode = 'none',
  onAnalysisModeChange,
  showDimensions = true,
  onToggleDimensions,
  showGrid = true,
  onToggleGrid,
  showReinforcement = true,
  onToggleReinforcement,
  autoRotate = true,
  onToggleAutoRotate,
  onResetView,
  onScreenshot,
  onFullscreen,
  showStressMode = true,
  showDeflectionMode = true,
  showMeasurement = false,
  showSectionCut = false,
  className,
  compact = false
}: Visualization3DToolbarProps) => {
  
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        "absolute z-20 flex flex-col gap-2",
        compact ? "top-2 left-2" : "top-3 left-3",
        className
      )}>
        
        {/* View Mode Toggle (2D/3D) */}
        <div className="flex bg-background/90 backdrop-blur-sm rounded-lg overflow-hidden border border-border/50 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewModeChange('2d')}
                className={cn(
                  "px-2.5 py-2 flex items-center gap-1.5 text-xs font-medium transition-all",
                  viewMode === '2d' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                {!compact && "2D"}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>2D Cross-Section View</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewModeChange('3d')}
                className={cn(
                  "px-2.5 py-2 flex items-center gap-1.5 text-xs font-medium transition-all",
                  viewMode === '3d' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Box className="w-3.5 h-3.5" />
                {!compact && "3D"}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>3D Perspective View</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Analysis Mode Buttons (only show in 3D mode) */}
        {viewMode === '3d' && onAnalysisModeChange && (
          <div className="flex flex-col gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1.5 border border-border/50 shadow-lg">
            {showDeflectionMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onAnalysisModeChange(analysisMode === 'deflection' ? 'none' : 'deflection')}
                    className={cn(
                      "p-2 rounded-md flex items-center gap-1.5 text-xs transition-all",
                      analysisMode === 'deflection'
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    {!compact && <span>Deflection</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Show Deflection Animation</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {showStressMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onAnalysisModeChange(analysisMode === 'stress' ? 'none' : 'stress')}
                    className={cn(
                      "p-2 rounded-md flex items-center gap-1.5 text-xs transition-all",
                      analysisMode === 'stress'
                        ? "bg-red-500/20 text-red-400 border border-red-500/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Thermometer className="w-3.5 h-3.5" />
                    {!compact && <span>Stress</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Show Stress Distribution</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onToggleReinforcement && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleReinforcement}
                    className={cn(
                      "p-2 rounded-md flex items-center gap-1.5 text-xs transition-all",
                      showReinforcement
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                    {!compact && <span>Rebar</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Toggle Reinforcement Visibility</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* View Controls (only show in 3D mode) */}
        {viewMode === '3d' && (
          <div className="flex flex-col gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1.5 border border-border/50 shadow-lg">
            {onToggleDimensions && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleDimensions}
                    className={cn(
                      "p-2 rounded-md flex items-center gap-1.5 text-xs transition-all",
                      showDimensions
                        ? "bg-green-500/20 text-green-400 border border-green-500/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    {!compact && <span>Dims</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Toggle Dimension Labels</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onToggleGrid && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleGrid}
                    className={cn(
                      "p-2 rounded-md flex items-center gap-1.5 text-xs transition-all",
                      showGrid
                        ? "bg-primary/20 text-primary border border-primary/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                    {!compact && <span>Grid</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Toggle Grid</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onToggleAutoRotate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleAutoRotate}
                    className={cn(
                      "p-2 rounded-md flex items-center gap-1.5 text-xs transition-all",
                      autoRotate
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {!compact && <span>Rotate</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Toggle Auto-Rotation</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {(onResetView || onScreenshot || onFullscreen) && (
          <div className="flex flex-col gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1.5 border border-border/50 shadow-lg">
            {onResetView && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onResetView}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Reset Camera View</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onScreenshot && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onScreenshot}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Take Screenshot</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onFullscreen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onFullscreen}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Toggle Fullscreen</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Future: Measurement & Section Cut */}
        {(showMeasurement || showSectionCut) && (
          <div className="flex flex-col gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1.5 border border-border/50 shadow-lg opacity-50">
            {showMeasurement && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    disabled
                    className="p-2 rounded-md text-muted-foreground cursor-not-allowed"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Measurement Tool (Coming Soon)</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {showSectionCut && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    disabled
                    className="p-2 rounded-md text-muted-foreground cursor-not-allowed"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Section Cut (Coming Soon)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Visualization3DToolbar;
