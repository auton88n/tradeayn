import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Camera,
  Monitor,
  Smartphone
} from 'lucide-react';

interface VisualTestSummary {
  totalPages: number;
  totalScreenshots?: number;
  passed: number;
  warnings: number;
  failed: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues?: number;
  avgLoadTime?: string;
  avgAnalysisTime?: string;
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
            <Camera className="h-4 w-4 text-indigo-500" />
            Visual AI Tester
          </CardTitle>
          {summary && (
            <Badge variant={getRatingBadge(summary.overallRating)}>
              {getRatingEmoji(summary.overallRating)} {summary.healthScore}%
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">GPT-4 Vision + Screenshots</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <span className="mt-2 text-sm text-muted-foreground">Capturing screenshots...</span>
            <span className="text-xs text-muted-foreground">Analyzing with GPT-4 Vision</span>
          </div>
        ) : summary ? (
          <>
            {/* Health Score */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Visual Health</span>
                <span className={getRatingColor(summary.overallRating)}>
                  {summary.overallRating.replace('_', ' ')}
                </span>
              </div>
              <Progress value={summary.healthScore} className="h-2" />
            </div>
            
            {/* Screenshot Stats */}
            {summary.totalScreenshots && (
              <div className="flex items-center justify-center gap-4 py-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-1 text-xs">
                  <Monitor className="h-3 w-3 text-muted-foreground" />
                  <span>Desktop</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Smartphone className="h-3 w-3 text-muted-foreground" />
                  <span>Mobile</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {summary.totalScreenshots} shots
                </Badge>
              </div>
            )}
            
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
                <span>Total Issues Found</span>
                <span className="font-medium">{summary.totalIssues}</span>
              </div>
              {summary.criticalIssues > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Critical</span>
                  <span className="font-medium">{summary.criticalIssues}</span>
                </div>
              )}
              {summary.highIssues && summary.highIssues > 0 && (
                <div className="flex justify-between text-orange-500">
                  <span>High Priority</span>
                  <span className="font-medium">{summary.highIssues}</span>
                </div>
              )}
              {summary.avgAnalysisTime && (
                <div className="flex justify-between">
                  <span>Avg Analysis Time</span>
                  <span className="font-medium">{summary.avgAnalysisTime}</span>
                </div>
              )}
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
            <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-1">No visual tests run yet</p>
            <p className="text-xs text-muted-foreground mb-3">
              Captures real screenshots & analyzes with AI
            </p>
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
