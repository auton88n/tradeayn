import React from 'react';
import { motion } from 'framer-motion';
import { 
  Columns3, 
  Building2, 
  Box, 
  Calculator, 
  Mountain, 
  ChevronLeft,
  ChevronRight,
  HardHat,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BuildingCodeSelector } from '@/components/engineering/BuildingCodeSelector';
import { type BuildingCodeId, type NBCCVersion } from '@/lib/buildingCodes';

export type CalculatorType = 'beam' | 'foundation' | 'column' | 'slab' | 'retaining_wall' | 'grading' | 'compliance' | null;

interface CalculatorOption {
  id: CalculatorType;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  gradient: string;
  available: boolean;
  isPage?: boolean;
  path?: string;
}

const calculatorOptions: CalculatorOption[] = [
  {
    id: 'grading',
    title: 'AI Grading Designer',
    shortTitle: 'Grading',
    icon: Mountain,
    gradient: 'from-emerald-500 to-teal-500',
    available: true,
  },
  {
    id: 'beam',
    title: 'Beam Design',
    shortTitle: 'Beam',
    icon: Columns3,
    gradient: 'from-blue-500 to-cyan-500',
    available: true,
  },
  {
    id: 'foundation',
    title: 'Foundation Design',
    shortTitle: 'Foundation',
    icon: Building2,
    gradient: 'from-amber-500 to-orange-500',
    available: true,
  },
  {
    id: 'column',
    title: 'Column Design',
    shortTitle: 'Column',
    icon: Box,
    gradient: 'from-purple-500 to-pink-500',
    available: true,
  },
  {
    id: 'slab',
    title: 'Slab Design',
    shortTitle: 'Slab',
    icon: Calculator,
    gradient: 'from-green-500 to-emerald-500',
    available: true,
  },
  {
    id: 'retaining_wall',
    title: 'Retaining Wall',
    shortTitle: 'Wall',
    icon: Building2,
    gradient: 'from-rose-500 to-orange-500',
    available: true,
  },
];

interface CalculatorSidebarProps {
  selectedCalculator: CalculatorType;
  onSelectCalculator: (calc: CalculatorType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: (path: string) => void;
  selectedBuildingCode: BuildingCodeId;
  onBuildingCodeChange: (code: BuildingCodeId) => void;
  nbccVersion: NBCCVersion;
  onNbccVersionChange: (version: NBCCVersion) => void;
}

export const CalculatorSidebar: React.FC<CalculatorSidebarProps> = ({
  selectedCalculator,
  onSelectCalculator,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
  selectedBuildingCode,
  onBuildingCodeChange,
  nbccVersion,
  onNbccVersionChange,
}) => {
  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="h-full border-r border-border/50 bg-card/50 backdrop-blur-sm flex flex-col z-30 relative"
      >
        {/* Header */}
        <div className={cn(
          "p-4 border-b border-border/50 flex items-center",
          isCollapsed ? "justify-center" : "gap-3"
        )}>
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <HardHat className="w-5 h-5 text-primary" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="font-semibold text-sm">Engineering</h2>
              <p className="text-xs text-muted-foreground">Calculators</p>
            </motion.div>
          )}
        </div>

        {/* Building Code Selector */}
        <div className={cn("px-2 py-3 border-b border-border/50", isCollapsed && "px-1")}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <BuildingCodeSelector
                    selectedCode={selectedBuildingCode}
                    onCodeChange={onBuildingCodeChange}
                    nbccVersion={nbccVersion}
                    onNbccVersionChange={onNbccVersionChange}
                    isCollapsed={true}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Building Code: {selectedBuildingCode}
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Design Standard
              </p>
              <BuildingCodeSelector
                selectedCode={selectedBuildingCode}
                onCodeChange={onBuildingCodeChange}
                nbccVersion={nbccVersion}
                onNbccVersionChange={onNbccVersionChange}
                isCollapsed={false}
              />
            </>
          )}
        </div>

        {/* Calculator List */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {calculatorOptions.map((calc) => {
            const isSelected = selectedCalculator === calc.id;
            const Icon = calc.icon;

            const button = (
              <button
                key={calc.id}
                onClick={() => {
                  if (calc.isPage && calc.path && onNavigate) {
                    onNavigate(calc.path);
                  } else {
                    onSelectCalculator(calc.id);
                  }
                }}
                disabled={!calc.available}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  isCollapsed && "justify-center px-2",
                  isSelected
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                  !calc.available && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  isSelected
                    ? `bg-gradient-to-br ${calc.gradient} text-white shadow-lg`
                    : "bg-muted/50"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium truncate">{calc.shortTitle}</p>
                    {calc.isPage && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> AI-Powered
                      </span>
                    )}
                  </motion.div>
                )}
              </button>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={calc.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {calc.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={cn("w-full", isCollapsed && "justify-center")}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};
