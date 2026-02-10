import React from 'react';
import { motion } from 'framer-motion';
import { 
  Ruler, 
  ClipboardCheck, 
  Car,
  ChevronLeft,
  ChevronRight,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export type DesignToolType = 'drawings' | 'compliance' | null;

interface DesignToolOption {
  id: DesignToolType;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  gradient: string;
}

const designTools: DesignToolOption[] = [
  // {
  //   id: 'drawings',
  //   title: 'Architectural Drawings',
  //   shortTitle: 'Drawings',
  //   icon: Ruler,
  //   gradient: 'from-slate-600 to-gray-800',
  // },
  {
    id: 'compliance',
    title: 'Code Compliance Check',
    shortTitle: 'Compliance',
    icon: ClipboardCheck,
    gradient: 'from-teal-500 to-cyan-500',
  },
  // {
  //   id: 'parking',
  //   title: 'Car Parking Designer',
  //   shortTitle: 'Parking',
  //   icon: Car,
  //   gradient: 'from-indigo-500 to-violet-500',
  // },
];

interface DesignSidebarProps {
  selectedTool: DesignToolType;
  onSelectTool: (tool: DesignToolType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const DesignSidebar: React.FC<DesignSidebarProps> = ({
  selectedTool,
  onSelectTool,
  isCollapsed,
  onToggleCollapse,
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
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <Palette className="w-5 h-5 text-violet-500" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="font-semibold text-sm">Design Studio</h2>
              <p className="text-xs text-muted-foreground">Tools</p>
            </motion.div>
          )}
        </div>

        {/* Tool List */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {designTools.map((tool) => {
            const isSelected = selectedTool === tool.id;
            const Icon = tool.icon;

            const button = (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  isCollapsed && "justify-center px-2",
                  isSelected
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  isSelected
                    ? `bg-gradient-to-br ${tool.gradient} text-white shadow-lg`
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
                    <p className="text-sm font-medium truncate">{tool.shortTitle}</p>
                  </motion.div>
                )}
              </button>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {tool.title}
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
