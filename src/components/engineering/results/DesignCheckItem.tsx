import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DesignCheck {
  name: string;
  passed: boolean;
  codeReference?: string;
  value?: string;
  warning?: boolean;
}

export interface DesignCheckItemProps {
  check: DesignCheck;
  className?: string;
}

export const DesignCheckItem: React.FC<DesignCheckItemProps> = ({ check, className }) => {
  const Icon = check.warning ? AlertTriangle : (check.passed ? CheckCircle2 : XCircle);
  const colorClass = check.warning 
    ? 'text-yellow-500' 
    : (check.passed ? 'text-green-500' : 'text-red-500');

  return (
    <div className={cn(
      "flex items-center gap-2.5 py-1.5 text-sm",
      className
    )}>
      <Icon className={cn("w-4 h-4 flex-shrink-0", colorClass)} />
      <span className="flex-1">{check.name}</span>
      {check.value && (
        <span className="text-muted-foreground text-xs">{check.value}</span>
      )}
      {check.codeReference && (
        <span className="text-xs text-muted-foreground/60 font-mono">[{check.codeReference}]</span>
      )}
    </div>
  );
};

export default DesignCheckItem;
