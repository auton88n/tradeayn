import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Check, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type BuildingCodeId } from '@/lib/buildingCodes';
import { type CalculatorType } from '../workspace/CalculatorSidebar';
import { toast } from 'sonner';

import { BeamResultsSection, generateBeamClipboardText } from './BeamResultsSection';
import { ColumnResultsSection, generateColumnClipboardText } from './ColumnResultsSection';
import { SlabResultsSection, generateSlabClipboardText } from './SlabResultsSection';
import { FoundationResultsSection, generateFoundationClipboardText } from './FoundationResultsSection';
import { RetainingWallResultsSection, generateRetainingWallClipboardText } from './RetainingWallResultsSection';

interface DetailedResultsPanelProps {
  calculatorType: CalculatorType;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  buildingCode: BuildingCodeId;
  defaultExpanded?: boolean;
  className?: string;
}

export const DetailedResultsPanel: React.FC<DetailedResultsPanelProps> = ({
  calculatorType,
  inputs,
  outputs,
  buildingCode,
  defaultExpanded = true,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  // Skip parking and grading - they have their own outputs
  if (calculatorType === 'parking' || calculatorType === 'grading' || !calculatorType) {
    return null;
  }

  // Determine if design is adequate based on outputs
  const isAdequate = outputs.isAdequate !== false && 
    (outputs.utilizationRatio === undefined || outputs.utilizationRatio <= 1);

  const handleCopy = async () => {
    let clipboardText = '';
    
    switch (calculatorType) {
      case 'beam':
        clipboardText = generateBeamClipboardText(inputs, outputs, buildingCode);
        break;
      case 'column':
        clipboardText = generateColumnClipboardText(inputs, outputs, buildingCode);
        break;
      case 'slab':
        clipboardText = generateSlabClipboardText(inputs, outputs, buildingCode);
        break;
      case 'foundation':
        clipboardText = generateFoundationClipboardText(inputs, outputs, buildingCode);
        break;
      case 'retaining_wall':
        clipboardText = generateRetainingWallClipboardText(inputs, outputs, buildingCode);
        break;
      default:
        clipboardText = JSON.stringify({ inputs, outputs }, null, 2);
    }

    try {
      await navigator.clipboard.writeText(clipboardText);
      setCopied(true);
      toast.success('Results copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy results');
    }
  };

  const renderResultsSection = () => {
    switch (calculatorType) {
      case 'beam':
        return <BeamResultsSection inputs={inputs} outputs={outputs} buildingCode={buildingCode} />;
      case 'column':
        return <ColumnResultsSection inputs={inputs} outputs={outputs} buildingCode={buildingCode} />;
      case 'slab':
        return <SlabResultsSection inputs={inputs} outputs={outputs} buildingCode={buildingCode} />;
      case 'foundation':
        return <FoundationResultsSection inputs={inputs} outputs={outputs} buildingCode={buildingCode} />;
      case 'retaining_wall':
        return <RetainingWallResultsSection inputs={inputs} outputs={outputs} buildingCode={buildingCode} />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (calculatorType) {
      case 'beam': return 'Beam Design Results';
      case 'column': return 'Column Design Results';
      case 'slab': return 'Slab Design Results';
      case 'foundation': return 'Foundation Design Results';
      case 'retaining_wall': return 'Retaining Wall Results';
      default: return 'Design Results';
    }
  };

  return (
    <Card className={cn("border border-border/50 overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold">{getTitle()}</h3>
            <p className="text-xs text-muted-foreground">
              {buildingCode === 'CSA' ? 'CSA A23.3-24' : 'ACI 318-25'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant={isAdequate ? 'default' : 'destructive'}
            className="text-xs font-semibold"
          >
            {isAdequate ? 'DESIGN ADEQUATE' : 'DESIGN INADEQUATE'}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <CardContent className="pt-0 pb-4 px-4">
              {/* Copy Button */}
              <div className="flex justify-end mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Results
                    </>
                  )}
                </Button>
              </div>

              {/* Results Section */}
              <div className="bg-muted/30 rounded-lg p-4">
                {renderResultsSection()}
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Results require verification by a licensed Professional Engineer (PE/P.Eng)
              </p>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default DetailedResultsPanel;
