import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { type GradingRegion, getAvailableRegions, getGradingStandards } from '@/lib/gradingStandards';

interface GradingRegionSelectorProps {
  selectedRegion: GradingRegion;
  onRegionChange: (region: GradingRegion) => void;
  className?: string;
  compact?: boolean;
}

export const GradingRegionSelector: React.FC<GradingRegionSelectorProps> = ({
  selectedRegion,
  onRegionChange,
  className = '',
  compact = false,
}) => {
  const regions = getAvailableRegions();
  const currentStandards = getGradingStandards(selectedRegion);
  const currentRegion = regions.find((r) => r.id === selectedRegion);

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`justify-between ${compact ? 'h-9 px-3' : 'w-full'}`}
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-base">{currentRegion?.flag}</span>
              <span className="font-medium">
                {compact ? currentRegion?.id : currentRegion?.name}
              </span>
              {!compact && (
                <span className="text-xs text-muted-foreground">
                  ({currentStandards.standardsSummary})
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px] bg-popover">
          {regions.map((region) => {
            const isSelected = region.id === selectedRegion;
            return (
              <DropdownMenuItem
                key={region.id}
                onClick={() => onRegionChange(region.id)}
                className={`flex flex-col items-start gap-0.5 py-3 cursor-pointer ${
                  isSelected ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-lg">{region.flag}</span>
                  <span className="font-medium flex-1">{region.name}</span>
                  {isSelected && (
                    <span className="text-primary text-xs font-medium">Active</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground ml-7">
                  {region.standards} Standards
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {!compact && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          {currentStandards.codeDisplayText}
        </p>
      )}
    </div>
  );
};
