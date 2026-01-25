import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Scale } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AVAILABLE_CODES, type BuildingCodeId } from '@/lib/buildingCodes';
import { cn } from '@/lib/utils';

interface BuildingCodeSelectorProps {
  selectedCode: BuildingCodeId;
  onCodeChange: (code: BuildingCodeId) => void;
  isCollapsed?: boolean;
}

export const BuildingCodeSelector: React.FC<BuildingCodeSelectorProps> = ({
  selectedCode,
  onCodeChange,
  isCollapsed = false,
}) => {
  const currentCode = AVAILABLE_CODES.find(c => c.id === selectedCode) || AVAILABLE_CODES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-between gap-2 bg-background/50 border-border/50 hover:bg-white/10",
            isCollapsed && "justify-center px-2"
          )}
        >
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            {!isCollapsed && (
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <span>{currentCode.flag}</span>
                <span>{currentCode.id}</span>
              </span>
            )}
          </div>
          {!isCollapsed && <ChevronDown className="w-3 h-3 opacity-50" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-64 bg-popover border border-border shadow-lg z-50"
        sideOffset={4}
      >
        <div className="px-3 py-2 border-b border-border/50">
          <p className="text-xs font-semibold text-foreground">Building Code</p>
          <p className="text-[10px] text-muted-foreground">Select design standard</p>
        </div>
        {AVAILABLE_CODES.map((code) => (
          <DropdownMenuItem
            key={code.id}
            onClick={() => onCodeChange(code.id)}
            className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/10 focus:bg-white/10"
          >
            <div className="text-xl">{code.flag}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{code.name}</p>
                {selectedCode === code.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </motion.div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {code.fullName} ({code.version})
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {code.loadCombination} • φ = {code.id === 'ACI' ? '0.90' : '0.65/0.85'}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
