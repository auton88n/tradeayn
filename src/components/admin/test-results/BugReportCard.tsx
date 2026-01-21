import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTestExport } from '@/hooks/useTestExport';

interface BugReport {
  endpoint: string;
  bugType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedFix: string;
}

interface BugReportCardProps {
  bug: BugReport;
}

export function BugReportCard({ bug }: BugReportCardProps) {
  const { copyBugReport } = useTestExport();

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          container: 'border-red-500/30 bg-red-500/5',
          badge: 'bg-red-500 text-white border-red-500',
          icon: 'text-red-500'
        };
      case 'high':
        return {
          container: 'border-orange-500/30 bg-orange-500/5',
          badge: 'bg-orange-500 text-white border-orange-500',
          icon: 'text-orange-500'
        };
      case 'medium':
        return {
          container: 'border-yellow-500/30 bg-yellow-500/5',
          badge: 'bg-yellow-500 text-white border-yellow-500',
          icon: 'text-yellow-500'
        };
      case 'low':
        return {
          container: 'border-blue-500/30 bg-blue-500/5',
          badge: 'bg-blue-500 text-white border-blue-500',
          icon: 'text-blue-500'
        };
      default:
        return {
          container: 'border-muted bg-muted/50',
          badge: 'bg-muted text-muted-foreground',
          icon: 'text-muted-foreground'
        };
    }
  };

  const styles = getSeverityStyles(bug.severity);

  return (
    <div className={`p-3 rounded-lg border ${styles.container}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${styles.icon}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm truncate">{bug.endpoint}</span>
              <Badge className={`${styles.badge} text-[10px] px-1.5 py-0 h-4`}>
                {bug.severity.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {bug.bugType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{bug.description}</p>
            <div className="mt-2 p-2 rounded bg-background/50 border border-dashed">
              <p className="text-xs">
                <span className="font-medium text-green-600">Suggested Fix: </span>
                {bug.suggestedFix}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyBugReport(bug)}
          className="h-7 w-7 p-0 shrink-0"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default BugReportCard;
