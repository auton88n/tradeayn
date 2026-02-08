import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  passed: number;
  failed: number;
  warnings: number;
  total: number;
}

export const ComplianceSummaryBadge: React.FC<Props> = ({ passed, failed, warnings, total }) => {
  const allPassed = failed === 0;
  
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl border",
      allPassed ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"
    )}>
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
        allPassed ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
      )}>
        {Math.round((passed / Math.max(total, 1)) * 100)}%
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg">
          {allPassed ? 'All Checks Passed' : `${failed} Issue${failed !== 1 ? 's' : ''} Found`}
        </h3>
        <div className="flex items-center gap-4 mt-1 text-sm">
          <span className="flex items-center gap-1 text-green-500">
            <CheckCircle2 className="w-4 h-4" /> {passed} passed
          </span>
          {failed > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <XCircle className="w-4 h-4" /> {failed} failed
            </span>
          )}
          {warnings > 0 && (
            <span className="flex items-center gap-1 text-yellow-500">
              <AlertTriangle className="w-4 h-4" /> {warnings} warnings
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
