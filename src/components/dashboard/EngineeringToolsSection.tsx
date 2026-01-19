import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Calculator, Columns, Grid3X3, Mountain, Car, Layers, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAYNEmotion, EngineeringToolType } from '@/contexts/AYNEmotionContext';

const engineeringTools = [
  { id: 'beam' as EngineeringToolType, label: 'Beam Design', icon: Columns, color: 'text-blue-400' },
  { id: 'foundation' as EngineeringToolType, label: 'Foundation', icon: Grid3X3, color: 'text-amber-400' },
  { id: 'column' as EngineeringToolType, label: 'Column', icon: Layers, color: 'text-purple-400' },
  { id: 'slab' as EngineeringToolType, label: 'Slab', icon: Grid3X3, color: 'text-green-400' },
  { id: 'retaining_wall' as EngineeringToolType, label: 'Retaining Wall', icon: Mountain, color: 'text-orange-400' },
  { id: 'parking' as EngineeringToolType, label: 'Parking Designer', icon: Car, color: 'text-cyan-400' },
];

interface EngineeringToolsSectionProps {
  className?: string;
}

export const EngineeringToolsSection = ({ className }: EngineeringToolsSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setEngineeringMode, isEngineeringMode, activeEngineeringTool } = useAYNEmotion();

  const handleToolClick = (toolId: EngineeringToolType) => {
    if (isEngineeringMode && activeEngineeringTool === toolId) {
      // Toggle off if clicking the same tool
      setEngineeringMode(false);
    } else {
      setEngineeringMode(true, toolId);
    }
  };

  return (
    <div className={cn("px-4 pb-3", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full h-11 rounded-xl gap-2.5 relative overflow-hidden group justify-between",
              "bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-indigo-600/20",
              "hover:from-cyan-600/30 hover:via-blue-600/30 hover:to-indigo-600/30",
              "border border-cyan-500/30",
              "text-foreground font-medium",
              "transition-all duration-300 ease-out"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Engineering Tools</span>
              {isEngineeringMode && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-1"
              >
                {engineeringTools.map((tool, index) => {
                  const Icon = tool.icon;
                  const isActive = isEngineeringMode && activeEngineeringTool === tool.id;
                  
                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToolClick(tool.id)}
                        className={cn(
                          "w-full justify-start h-9 rounded-lg gap-2 pl-8",
                          "hover:bg-muted/60 transition-all duration-200",
                          isActive && "bg-cyan-500/20 border border-cyan-500/40"
                        )}
                      >
                        <Icon className={cn("w-3.5 h-3.5", tool.color)} />
                        <span className="text-sm">{tool.label}</span>
                        {isActive && (
                          <Sparkles className="w-3 h-3 ml-auto text-cyan-400 animate-pulse" />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
