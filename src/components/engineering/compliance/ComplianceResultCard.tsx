import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplianceResult } from './utils/complianceEngine';

interface Props {
  result: ComplianceResult;
}

export const ComplianceResultCard: React.FC<Props> = ({ result }) => {
  const icon = result.status === 'pass' 
    ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
    : result.status === 'fail'
    ? <XCircle className="w-5 h-5 text-red-500 shrink-0" />
    : <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      result.status === 'pass' && "border-green-500/20 bg-green-500/5",
      result.status === 'fail' && "border-red-500/20 bg-red-500/5",
      result.status === 'warning' && "border-yellow-500/20 bg-yellow-500/5",
    )}>
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">{result.requirement_clause}</span>
          <span className="text-sm font-medium">{result.requirement_name}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {result.room_name} — {result.user_value !== null ? `${result.user_value} ${result.unit}` : 'N/A'} 
          {' '}(required: {result.required_value})
        </p>
        {result.status === 'fail' && result.fix_suggestion && (
          <p className="text-xs text-red-400 mt-1">→ {result.fix_suggestion}</p>
        )}
      </div>
    </div>
  );
};
