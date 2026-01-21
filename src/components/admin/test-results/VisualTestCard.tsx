import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, CheckCircle, AlertTriangle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface VisualTestSummary {
  totalPages: number;
  passed: number;
  warnings: number;
  failed: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  avgLoadTime: string;
  healthScore: number;
  overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
}

interface VisualTestCardProps {
  summary?: VisualTestSummary;
  isLoading?: boolean;
  onRun?: () => void;
  lastRun?: Date;
}

const getRatingColor = (rating: string) => {
  switch (rating) {
    case 'excellent': return 'text-green-500';
    case 'good': return 'text-blue-500';
    case 'needs_improvement': return 'text-yellow-500';
    case 'poor': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
};

const getRatingBadge = (rating: string): "default" | "secondary" | "outline" | "destructive" => {
  switch (rating) {
    case 'excellent': return 'default';
    case 'good': return 'secondary';
    case 'needs_improvement': return 'outline';
    case 'poor': return 'destructive';
    default: return 'outline';
  }
};

const getRatingEmoji = (rating: string) => {
  switch (rating) {
    case 'excellent': return '✨';
    case 'good': return '👍';
    case 'needs_improvement': return '⚠️';
    case 'poor': return '🔴';
    default: return '❓';
  }
};

export const VisualTestCard: React.FC<VisualTestCardProps> = ({
  summary,
  isLoading,
  onRun,
  lastRun
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-indigo-500" />
            Visual Health
          </CardTitle>
          {summary && (
            <Badge variant={getRatingBadge(summary.overallRating)}>
              {getRatingEmoji(summary.overallRating)} {summary.healthScore}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <span className="ml-2 text-sm text-muted-foreground">Scanning pages...</span>
          </div>
        ) : summary ? (
          <>
            {/* Health Score */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Health Score</span>
                <span className={getRatingColor(summary.overallRating)}>
                  {summary.overallRating.replace('_', ' ')}
                </span>
              </div>
              <Progress value={summary.healthScore} className="h-2" />
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-500/10 rounded">
                <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{summary.passed}</p>
                <p className="text-[10px] text-muted-foreground">Passed</p>
              </div>
              <div className="p-2 bg-yellow-500/10 rounded">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{summary.warnings}</p>
                <p className="text-[10px] text-muted-foreground">Warnings</p>
              </div>
              <div className="p-2 bg-red-500/10 rounded">
                <XCircle className="h-4 w-4 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{summary.failed}</p>
                <p className="text-[10px] text-muted-foreground">Failed</p>
              </div>
            </div>
            
            {/* Issues Summary */}
            <div className="text-xs space-y-1 border-t pt-2">
              <div className="flex justify-between">
                <span>Total Issues</span>
                <span className="font-medium">{summary.totalIssues}</span>
              </div>
              {summary.criticalIssues > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Critical</span>
                  <span className="font-medium">{summary.criticalIssues}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Avg Load Time</span>
                <span className="font-medium">{summary.avgLoadTime}</span>
              </div>
            </div>
            
            {/* Run Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2" 
              onClick={onRun}
              disabled={isLoading}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-run Visual Test
            </Button>
            
            {lastRun && (
              <p className="text-[10px] text-muted-foreground text-center">
                Last run: {lastRun.toLocaleTimeString()}
              </p>
            )}
          </>
        ) : (
          <div className="py-4 text-center">
            <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">No visual tests run yet</p>
            <Button 
              variant="default" 
              size="sm" 
              onClick={onRun}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Eye className="h-3 w-3 mr-1" />
              Run Visual Test
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisualTestCard;
