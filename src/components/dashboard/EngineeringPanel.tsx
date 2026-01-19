import React, { Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, Layers, Building, Square, Maximize2, ParkingCircle, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAYNEmotion, EngineeringToolType } from '@/contexts/AYNEmotionContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load calculators for performance
const BeamCalculator = lazy(() => import('@/components/engineering/BeamCalculator').then(m => ({ default: m.BeamCalculator })));
const FoundationCalculator = lazy(() => import('@/components/engineering/FoundationCalculator').then(m => ({ default: m.FoundationCalculator })));
const ColumnCalculator = lazy(() => import('@/components/engineering/ColumnCalculator').then(m => ({ default: m.default })));
const SlabCalculator = lazy(() => import('@/components/engineering/SlabCalculator').then(m => ({ default: m.SlabCalculator })));
const RetainingWallCalculator = lazy(() => import('@/components/engineering/RetainingWallCalculator').then(m => ({ default: m.RetainingWallCalculator })));
const AdvancedParkingDesigner = lazy(() => import('@/components/engineering/parking/AdvancedParkingDesigner').then(m => ({ default: m.AdvancedParkingDesigner })));

// Tool metadata for display
const TOOL_INFO: Record<Exclude<EngineeringToolType, null>, { label: string; icon: React.ReactNode; color: string }> = {
  beam: { label: 'Beam Design', icon: <Layers className="w-5 h-5" />, color: 'text-blue-400' },
  foundation: { label: 'Foundation Analysis', icon: <Building className="w-5 h-5" />, color: 'text-emerald-400' },
  column: { label: 'Column Design', icon: <Square className="w-5 h-5" />, color: 'text-purple-400' },
  slab: { label: 'Slab Design', icon: <Maximize2 className="w-5 h-5" />, color: 'text-orange-400' },
  retaining_wall: { label: 'Retaining Wall', icon: <Layers className="w-5 h-5" />, color: 'text-amber-400' },
  parking: { label: 'Parking Designer', icon: <ParkingCircle className="w-5 h-5" />, color: 'text-cyan-400' },
  grading: { label: 'AI Grading', icon: <Mountain className="w-5 h-5" />, color: 'text-green-400' },
};

// Loading skeleton for calculators
const CalculatorSkeleton = () => (
  <div className="p-4 space-y-4">
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);

interface EngineeringPanelProps {
  className?: string;
}

export const EngineeringPanel = ({ className }: EngineeringPanelProps) => {
  const { isEngineeringMode, activeEngineeringTool, setEngineeringMode } = useAYNEmotion();
  
  const handleClose = () => {
    setEngineeringMode(false);
  };
  
  const toolInfo = activeEngineeringTool ? TOOL_INFO[activeEngineeringTool] : null;
  
  // State for calculators
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [calculationResult, setCalculationResult] = React.useState<any>(null);
  
  const handleCalculationComplete = (result: any) => {
    setCalculationResult(result);
    setIsCalculating(false);
  };

  return (
    <AnimatePresence>
      {isEngineeringMode && (
        <motion.div
          initial={{ x: -550, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -550, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={cn(
            "w-[550px] max-w-[60vw] h-full",
            "relative z-10",
            "bg-background/95 backdrop-blur-xl",
            "border-r border-border/50",
            "flex flex-col",
            "shadow-2xl shadow-black/20",
            "overflow-hidden",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
                "border border-cyan-500/30"
              )}>
                <Calculator className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  {toolInfo && (
                    <span className={toolInfo.color}>{toolInfo.icon}</span>
                  )}
                  {toolInfo?.label || 'Engineering Tools'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Structural analysis & design
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Calculator Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-28">
            <Suspense fallback={<CalculatorSkeleton />}>
              {activeEngineeringTool === 'beam' && (
                <BeamCalculator
                  onCalculate={handleCalculationComplete}
                  isCalculating={isCalculating}
                  setIsCalculating={setIsCalculating}
                />
              )}
              {activeEngineeringTool === 'foundation' && (
                <FoundationCalculator
                  onCalculate={handleCalculationComplete}
                  isCalculating={isCalculating}
                  setIsCalculating={setIsCalculating}
                />
              )}
              {activeEngineeringTool === 'column' && (
                <ColumnCalculator
                  onCalculationComplete={handleCalculationComplete}
                  onBack={handleClose}
                />
              )}
              {activeEngineeringTool === 'slab' && (
                <SlabCalculator
                  onCalculate={handleCalculationComplete}
                  isCalculating={isCalculating}
                  setIsCalculating={setIsCalculating}
                />
              )}
              {activeEngineeringTool === 'retaining_wall' && (
                <RetainingWallCalculator
                  onCalculate={handleCalculationComplete}
                  isCalculating={isCalculating}
                  setIsCalculating={setIsCalculating}
                />
              )}
              {activeEngineeringTool === 'parking' && (
                <AdvancedParkingDesigner
                  onCalculate={handleCalculationComplete}
                  isCalculating={isCalculating}
                  setIsCalculating={setIsCalculating}
                />
              )}
              {activeEngineeringTool === 'grading' && (
                <div className="p-6 text-center text-muted-foreground">
                  <Mountain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>AI Grading Designer</p>
                  <p className="text-sm mt-2">Coming soon in this panel</p>
                </div>
              )}
              {!activeEngineeringTool && (
                <div className="p-6 text-center text-muted-foreground">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a tool from the sidebar</p>
                </div>
              )}
            </Suspense>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
