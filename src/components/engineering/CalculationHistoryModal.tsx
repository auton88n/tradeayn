import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, Building2, Box, Mountain, Trash2, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEngineeringHistory, CalculationHistoryItem } from '@/hooks/useEngineeringHistory';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalculationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  onLoadCalculation?: (calculation: CalculationHistoryItem) => void;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  beam: { icon: Calculator, color: 'from-blue-500 to-cyan-500', label: 'Beam Design' },
  foundation: { icon: Building2, color: 'from-amber-500 to-orange-500', label: 'Foundation Design' },
  column: { icon: Box, color: 'from-purple-500 to-pink-500', label: 'Column Design' },
  grading: { icon: Mountain, color: 'from-emerald-500 to-teal-500', label: 'Grading Design' },
};

export const CalculationHistoryModal: React.FC<CalculationHistoryModalProps> = ({
  isOpen,
  onClose,
  userId,
  onLoadCalculation,
}) => {
  const { calculationHistory, isLoading, fetchHistory, deleteCalculation } = useEngineeringHistory(userId);

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory();
    }
  }, [isOpen, userId, fetchHistory]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteCalculation(id);
  };

  const getTypeInfo = (type: string) => {
    return typeConfig[type] || { icon: Calculator, color: 'from-gray-500 to-gray-600', label: type };
  };

  const formatInputs = (inputs: Record<string, any>, type: string) => {
    switch (type) {
      case 'beam':
        return `${inputs.span}m span, ${inputs.deadLoad}+${inputs.liveLoad} kN/m`;
      case 'foundation':
        return `${inputs.columnLoad} kN load, ${inputs.soilType || 'standard'} soil`;
      case 'column':
        return `${inputs.axialLoad} kN, ${inputs.columnWidth}x${inputs.columnDepth}mm`;
      case 'grading':
        return `${inputs.pointCount || '?'} survey points`;
      default:
        return JSON.stringify(inputs).slice(0, 50);
    }
  };

  const formatOutputs = (outputs: Record<string, any>, type: string) => {
    switch (type) {
      case 'beam':
        return `${outputs.beamWidth}x${outputs.totalDepth}mm`;
      case 'foundation':
        return `${outputs.length}x${outputs.width}m, ${outputs.depth}mm`;
      case 'column':
        return `${outputs.requiredSteelArea?.toFixed(0) || '?'}mm² steel`;
      case 'grading':
        return `Cut: ${outputs.totalCutVolume?.toLocaleString() || '?'}m³`;
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Calculation History</h2>
                <p className="text-sm text-muted-foreground">
                  {calculationHistory.length} saved calculations
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="h-[60vh]">
            <div className="p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : calculationHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No calculations saved yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Your beam, foundation, and column calculations will appear here
                  </p>
                </div>
              ) : (
                calculationHistory.map((calc) => {
                  const typeInfo = getTypeInfo(calc.calculation_type);
                  const Icon = typeInfo.icon;
                  
                  return (
                    <motion.div
                      key={calc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "group relative p-4 rounded-xl border border-border bg-card/50",
                        "hover:bg-card hover:border-primary/30 transition-all cursor-pointer"
                      )}
                      onClick={() => onLoadCalculation?.(calc)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          `bg-gradient-to-br ${typeInfo.color}`
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{typeInfo.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(calc.created_at), 'MMM d, yyyy · HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatInputs(calc.inputs, calc.calculation_type)}
                          </p>
                          <p className="text-sm font-medium text-primary mt-1">
                            {formatOutputs(calc.outputs, calc.calculation_type)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => handleDelete(e, calc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
