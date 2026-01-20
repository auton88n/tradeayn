import React from 'react';
import { Info, LucideIcon, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChecklistOption {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  checked: boolean;
}

interface ChecklistGroupProps {
  title: string;
  options: ChecklistOption[];
  onToggle: (id: string) => void;
  onToggleAll?: () => void;
  className?: string;
  showSelectAll?: boolean;
}

export const ChecklistGroup: React.FC<ChecklistGroupProps> = ({
  title,
  options,
  onToggle,
  onToggleAll,
  className,
  showSelectAll = true,
}) => {
  const selectedCount = options.filter(o => o.checked).length;
  const allSelected = selectedCount === options.length;

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted/30">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            allSelected 
              ? "bg-primary/10 text-primary" 
              : "bg-muted text-muted-foreground"
          )}>
            {selectedCount}/{options.length}
          </span>
          {showSelectAll && onToggleAll && (
            <button
              type="button"
              onClick={onToggleAll}
              className="text-xs text-primary hover:underline"
            >
              {allSelected ? 'Clear' : 'All'}
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="divide-y divide-border">
        <TooltipProvider delayDuration={300}>
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <label
                key={option.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={option.checked}
                  onCheckedChange={() => onToggle(option.id)}
                  className="shrink-0"
                />
                {Icon && (
                  <Icon 
                    className={cn("w-4 h-4 shrink-0", option.iconColor || "text-muted-foreground")} 
                  />
                )}
                <span className="text-sm font-medium flex-1">{option.label}</span>
                {option.description && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="shrink-0">
                        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[240px]">
                      <p className="text-xs">{option.description}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </label>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ChecklistGroup;
