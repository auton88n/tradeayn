import React from 'react';
import { cn } from '@/lib/utils';

export interface ResultRowProps {
  label: string;
  value: string | number;
  unit?: string;
  formula?: string;
  codeRef?: string;
  highlight?: boolean;
  className?: string;
}

export const ResultRow: React.FC<ResultRowProps> = ({
  label,
  value,
  unit,
  formula,
  codeRef,
  highlight = false,
  className,
}) => {
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : value;

  return (
    <div className={cn(
      "flex items-start justify-between py-1.5 gap-4",
      highlight && "bg-muted/50 -mx-3 px-3 rounded",
      className
    )}>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        {formula && (
          <span className="text-xs text-muted-foreground/70 block font-mono">{formula}</span>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <span className={cn(
          "text-sm font-medium",
          highlight && "text-primary"
        )}>
          {formattedValue}
          {unit && <span className="text-muted-foreground ml-1">{unit}</span>}
        </span>
        {codeRef && (
          <span className="text-xs text-muted-foreground/60 block">[{codeRef}]</span>
        )}
      </div>
    </div>
  );
};

export default ResultRow;
