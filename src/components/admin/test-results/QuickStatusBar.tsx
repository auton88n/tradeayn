import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface QuickStatusBarProps {
  passing: number;
  warnings: number;
  critical: number;
  lastRun?: Date;
  engineeringGrade?: string;
  securityScore?: number;
}

const QuickStatusBar: React.FC<QuickStatusBarProps> = ({
  passing,
  warnings,
  critical,
  lastRun,
  engineeringGrade,
  securityScore
}) => {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTimeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border mb-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-muted-foreground">Status:</span>
        
        <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle className="h-3 w-3" />
          {passing} Passing
        </Badge>
        
        {warnings > 0 && (
          <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <AlertTriangle className="h-3 w-3" />
            {warnings} Warnings
          </Badge>
        )}
        
        {critical > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {critical} Critical
          </Badge>
        )}
      </div>

      <div className="h-4 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-3 text-sm">
        {lastRun && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(lastRun)}
          </span>
        )}
        
        {engineeringGrade && (
          <Badge className={`${getGradeColor(engineeringGrade)} text-white`}>
            Eng: {engineeringGrade}
          </Badge>
        )}
        
        {securityScore !== undefined && (
          <Badge variant={securityScore >= 90 ? 'default' : securityScore >= 70 ? 'secondary' : 'destructive'}>
            Sec: {securityScore}%
          </Badge>
        )}
      </div>
    </div>
  );
};

export default QuickStatusBar;
