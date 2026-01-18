import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  FileDown, 
  FileText,
  GitCompare, 
  History, 
  RotateCcw,
  Loader2,
  Save,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BottomToolbarProps {
  onCalculate: () => void;
  onExportDXF?: () => void;
  onExportPDF?: () => void;
  onCompare: () => void;
  onHistory: () => void;
  onReset?: () => void;
  onSave?: () => void;
  isCalculating: boolean;
  hasResults: boolean;
  canCompare: boolean;
  calculatorType: string | null;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onCalculate,
  onExportDXF,
  onExportPDF,
  onCompare,
  onHistory,
  onReset,
  onSave,
  isCalculating,
  hasResults,
  canCompare,
  calculatorType,
}) => {
  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Actions - Primary */}
            <div className="flex items-center gap-2">
              <Button
                onClick={onCalculate}
                disabled={isCalculating || !calculatorType}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                size="lg"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Calculate
                  </>
                )}
              </Button>

              {onReset && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onReset}
                      disabled={isCalculating}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset Form</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Center Actions - Export */}
            <div className="flex items-center gap-2">
              {hasResults && (
                <>
                  {onExportDXF && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onExportDXF}
                          className="gap-2"
                        >
                          <FileDown className="w-4 h-4" />
                          <span className="hidden sm:inline">DXF</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export CAD Drawing</TooltipContent>
                    </Tooltip>
                  )}

                  {onExportPDF && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onExportPDF}
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="hidden sm:inline">PDF</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export Report</TooltipContent>
                    </Tooltip>
                  )}

                  {onSave && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onSave}
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span className="hidden sm:inline">Save</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save to Portfolio</TooltipContent>
                    </Tooltip>
                  )}

                  <Separator orientation="vertical" className="h-6 hidden sm:block" />
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCompare}
                    disabled={!canCompare}
                    className="gap-2"
                  >
                    <GitCompare className="w-4 h-4" />
                    <span className="hidden sm:inline">Compare</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canCompare ? 'Compare Calculations' : 'Need 2+ calculations'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onHistory}
                    className="gap-2"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">History</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View History</TooltipContent>
              </Tooltip>
            </div>

            {/* Right - Status */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                hasResults
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  hasResults ? "bg-emerald-500" : "bg-muted-foreground/50"
                )} />
                {hasResults ? 'Results Ready' : 'Ready'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};
