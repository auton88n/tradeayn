import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitCompare, 
  X, 
  Plus, 
  Trash2,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CalculationHistoryItem } from '@/hooks/useEngineeringHistory';

interface CalculationComparisonProps {
  calculations: CalculationHistoryItem[];
  onClose: () => void;
}

interface ComparisonSlot {
  id: string | null;
  calculation: CalculationHistoryItem | null;
}

export const CalculationComparison = ({ 
  calculations, 
  onClose 
}: CalculationComparisonProps) => {
  const [slots, setSlots] = useState<ComparisonSlot[]>([
    { id: null, calculation: null },
    { id: null, calculation: null }
  ]);
  const [showSelector, setShowSelector] = useState<number | null>(null);

  const selectCalculation = (slotIndex: number, calc: CalculationHistoryItem) => {
    setSlots(prev => prev.map((slot, i) => 
      i === slotIndex ? { id: calc.id, calculation: calc } : slot
    ));
    setShowSelector(null);
  };

  const clearSlot = (slotIndex: number) => {
    setSlots(prev => prev.map((slot, i) => 
      i === slotIndex ? { id: null, calculation: null } : slot
    ));
  };

  const addSlot = () => {
    if (slots.length < 4) {
      setSlots(prev => [...prev, { id: null, calculation: null }]);
    }
  };

  const removeSlot = (index: number) => {
    if (slots.length > 2) {
      setSlots(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getComparisonMetrics = () => {
    const filledSlots = slots.filter(s => s.calculation !== null);
    if (filledSlots.length < 2) return null;

    const metrics: { key: string; label: string; values: (number | string)[]; unit: string; better: 'lower' | 'higher' | 'neutral' }[] = [];
    
    const calc1 = filledSlots[0].calculation!;
    const calc2 = filledSlots[1].calculation!;

    // Only compare same type calculations
    if (calc1.calculation_type !== calc2.calculation_type) {
      return { error: 'Different calculation types cannot be compared' };
    }

    const type = calc1.calculation_type;

    if (type === 'beam') {
      metrics.push(
        { key: 'concreteVolume', label: 'Concrete Volume', values: filledSlots.map(s => s.calculation!.outputs.concreteVolume || 0), unit: 'm³', better: 'lower' },
        { key: 'steelWeight', label: 'Steel Weight', values: filledSlots.map(s => s.calculation!.outputs.steelWeight || 0), unit: 'kg', better: 'lower' },
        { key: 'width', label: 'Beam Width', values: filledSlots.map(s => s.calculation!.outputs.width || s.calculation!.outputs.beamWidth || 0), unit: 'mm', better: 'neutral' },
        { key: 'depth', label: 'Beam Depth', values: filledSlots.map(s => s.calculation!.outputs.depth || s.calculation!.outputs.beamDepth || 0), unit: 'mm', better: 'neutral' },
        { key: 'numberOfBars', label: 'Main Bars', values: filledSlots.map(s => s.calculation!.outputs.numberOfBars || 0), unit: '', better: 'lower' },
      );
    } else if (type === 'foundation') {
      metrics.push(
        { key: 'concreteVolume', label: 'Concrete Volume', values: filledSlots.map(s => s.calculation!.outputs.concreteVolume || 0), unit: 'm³', better: 'lower' },
        { key: 'steelWeight', label: 'Steel Weight', values: filledSlots.map(s => s.calculation!.outputs.steelWeight || 0), unit: 'kg', better: 'lower' },
        { key: 'area', label: 'Foundation Area', values: filledSlots.map(s => s.calculation!.outputs.area || 0), unit: 'm²', better: 'neutral' },
        { key: 'depth', label: 'Foundation Depth', values: filledSlots.map(s => s.calculation!.outputs.depth || 0), unit: 'mm', better: 'neutral' },
        { key: 'bearingPressure', label: 'Bearing Pressure', values: filledSlots.map(s => s.calculation!.outputs.bearingPressure || 0), unit: 'kPa', better: 'lower' },
      );
    } else if (type === 'column') {
      metrics.push(
        { key: 'concreteVolume', label: 'Concrete Volume', values: filledSlots.map(s => s.calculation!.outputs.concreteVolume || 0), unit: 'm³', better: 'lower' },
        { key: 'steelWeight', label: 'Steel Weight', values: filledSlots.map(s => s.calculation!.outputs.steelWeight || 0), unit: 'kg', better: 'lower' },
        { key: 'width', label: 'Column Width', values: filledSlots.map(s => s.calculation!.outputs.width || s.calculation!.inputs.width || 0), unit: 'mm', better: 'neutral' },
        { key: 'requiredSteelArea', label: 'Required Steel', values: filledSlots.map(s => s.calculation!.outputs.requiredSteelArea || 0), unit: 'mm²', better: 'lower' },
      );
    } else if (type === 'slab') {
      metrics.push(
        { key: 'concreteVolume', label: 'Concrete Volume', values: filledSlots.map(s => s.calculation!.outputs.concreteVolume || 0), unit: 'm³', better: 'lower' },
        { key: 'steelWeight', label: 'Steel Weight', values: filledSlots.map(s => s.calculation!.outputs.steelWeight || 0), unit: 'kg', better: 'lower' },
        { key: 'thickness', label: 'Slab Thickness', values: filledSlots.map(s => s.calculation!.outputs.thickness || 0), unit: 'mm', better: 'neutral' },
      );
    } else if (type === 'retaining_wall') {
      metrics.push(
        { key: 'concreteVolume', label: 'Concrete Volume', values: filledSlots.map(s => s.calculation!.outputs.concreteVolume || 0), unit: 'm³', better: 'lower' },
        { key: 'steelWeight', label: 'Steel Weight', values: filledSlots.map(s => s.calculation!.outputs.steelWeight || 0), unit: 'kg', better: 'lower' },
        { key: 'safetyFactor', label: 'Safety Factor', values: filledSlots.map(s => s.calculation!.outputs.safetyFactor || 0), unit: '', better: 'higher' },
      );
    } else if (type === 'parking') {
      metrics.push(
        { key: 'totalSpaces', label: 'Total Spaces', values: filledSlots.map(s => s.calculation!.outputs.totalSpaces || 0), unit: '', better: 'higher' },
        { key: 'accessibleSpaces', label: 'Accessible Spaces', values: filledSlots.map(s => s.calculation!.outputs.accessibleSpaces || 0), unit: '', better: 'neutral' },
        { key: 'evSpaces', label: 'EV Spaces', values: filledSlots.map(s => s.calculation!.outputs.evSpaces || 0), unit: '', better: 'higher' },
        { key: 'efficiency', label: 'Space Efficiency', values: filledSlots.map(s => s.calculation!.outputs.efficiency || 0), unit: '%', better: 'higher' },
      );
    }

    return { metrics, type };
  };

  const comparison = getComparisonMetrics();

  const getDifferenceIndicator = (values: (number | string)[], better: 'lower' | 'higher' | 'neutral', index: number) => {
    if (values.length < 2 || index === 0) return null;
    
    const val = Number(values[index]);
    const baseVal = Number(values[0]);
    
    if (isNaN(val) || isNaN(baseVal) || baseVal === 0) return null;
    
    const diff = ((val - baseVal) / baseVal) * 100;
    
    if (Math.abs(diff) < 0.5) {
      return <span className="text-muted-foreground text-xs flex items-center gap-1"><Minus className="w-3 h-3" /> Same</span>;
    }
    
    const isGood = better === 'neutral' ? null : 
      (better === 'lower' && diff < 0) || (better === 'higher' && diff > 0);
    
    if (diff > 0) {
      return (
        <span className={cn("text-xs flex items-center gap-1", isGood === true ? "text-green-500" : isGood === false ? "text-red-500" : "text-muted-foreground")}>
          <TrendingUp className="w-3 h-3" /> +{diff.toFixed(1)}%
        </span>
      );
    } else {
      return (
        <span className={cn("text-xs flex items-center gap-1", isGood === true ? "text-green-500" : isGood === false ? "text-red-500" : "text-muted-foreground")}>
          <TrendingDown className="w-3 h-3" /> {diff.toFixed(1)}%
        </span>
      );
    }
  };

  const filledSlotsCount = slots.filter(s => s.calculation).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-2xl border border-border shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Compare Calculations</h2>
            <span className="text-sm text-muted-foreground">
              ({filledSlotsCount} of {slots.length} selected)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {slots.length < 4 && (
              <Button variant="outline" size="sm" onClick={addSlot} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Add Option
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {/* Comparison Slots */}
          <div className={cn(
            "grid gap-4 mb-6",
            slots.length === 2 && "grid-cols-2",
            slots.length === 3 && "grid-cols-3",
            slots.length === 4 && "grid-cols-4"
          )}>
            {slots.map((slot, index) => (
              <div key={index} className="relative">
                <div className={cn(
                  "rounded-xl border-2 transition-colors min-h-[180px]",
                  slot.calculation 
                    ? "border-primary/50 bg-primary/5" 
                    : "border-dashed border-border hover:border-primary/30"
                )}>
                  {slot.calculation ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs text-muted-foreground">Option {index + 1}</span>
                          <h4 className="font-semibold capitalize">{slot.calculation.calculation_type}</h4>
                        </div>
                        <button
                          onClick={() => clearSlot(index)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{new Date(slot.calculation.created_at).toLocaleDateString()}</span>
                        </div>
                        {slot.calculation.inputs.span && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Span:</span>
                            <span>{slot.calculation.inputs.span}m</span>
                          </div>
                        )}
                        {(slot.calculation.inputs.deadLoad || slot.calculation.inputs.columnLoad) && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Load:</span>
                            <span>{slot.calculation.inputs.deadLoad || slot.calculation.inputs.columnLoad} kN</span>
                          </div>
                        )}
                      </div>
                      
                      {index === 0 && filledSlotsCount > 1 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <span className="text-xs text-primary font-medium">Base Reference</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSelector(index)}
                      className="w-full h-full min-h-[180px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-sm">Select Calculation</span>
                    </button>
                  )}
                </div>
                
                {slots.length > 2 && (
                  <button
                    onClick={() => removeSlot(index)}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Selector Dropdown */}
          <AnimatePresence>
            {showSelector !== null && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-muted/50 rounded-xl border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Select a calculation for Option {showSelector + 1}</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowSelector(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid gap-2 max-h-[200px] overflow-auto">
                  {calculations
                    .filter(c => !slots.some(s => s.id === c.id))
                    .map(calc => (
                      <button
                        key={calc.id}
                        onClick={() => selectCalculation(showSelector, calc)}
                        className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors text-left"
                      >
                        <div>
                          <span className="font-medium capitalize">{calc.calculation_type}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {new Date(calc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {calc.inputs.span && `Span: ${calc.inputs.span}m`}
                          {calc.inputs.columnLoad && `Load: ${calc.inputs.columnLoad}kN`}
                        </div>
                      </button>
                    ))}
                  {calculations.filter(c => !slots.some(s => s.id === c.id)).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No more calculations available to compare
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comparison Results */}
          {comparison && 'metrics' in comparison && comparison.metrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/30 rounded-xl border border-border overflow-hidden"
            >
              <div className="p-4 border-b border-border bg-muted/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Comparison Results
                  <span className="text-sm font-normal text-muted-foreground capitalize">
                    ({comparison.type} calculations)
                  </span>
                </h3>
              </div>
              
              <div className="divide-y divide-border">
                {comparison.metrics.map((metric, mIndex) => (
                  <div key={metric.key} className="grid grid-cols-[200px_1fr] items-center">
                    <div className="p-4 bg-muted/30 font-medium text-sm">
                      {metric.label}
                      <span className="text-muted-foreground ml-1">({metric.unit})</span>
                    </div>
                    <div className={cn(
                      "grid gap-4 p-4",
                      slots.length === 2 && "grid-cols-2",
                      slots.length === 3 && "grid-cols-3",
                      slots.length === 4 && "grid-cols-4"
                    )}>
                      {slots.map((slot, sIndex) => (
                        <div key={sIndex} className="text-center">
                          {slot.calculation ? (
                            <div>
                              <span className="font-mono font-semibold">
                                {typeof metric.values[sIndex] === 'number' 
                                  ? (metric.values[sIndex] as number).toFixed(2) 
                                  : metric.values[sIndex]}
                              </span>
                              <div className="mt-1">
                                {getDifferenceIndicator(metric.values, metric.better, sIndex)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {comparison && 'error' in comparison && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-amber-700 dark:text-amber-300">{comparison.error}</p>
            </div>
          )}

          {filledSlotsCount < 2 && (
            <div className="text-center py-8 text-muted-foreground">
              <GitCompare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select at least 2 calculations to compare</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
