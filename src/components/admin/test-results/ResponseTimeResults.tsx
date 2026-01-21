import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Timer, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface PercentileStats {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
}

interface IntentResult {
  ttftStats: PercentileStats;
  totalStats: PercentileStats;
  sloCompliance: { ttft: number; total: number };
  results: Array<{
    intent: string;
    testName: string;
    ttft_ms: number;
    totalTime_ms: number;
    success: boolean;
    error?: string;
  }>;
}

interface ResponseTimeResultsProps {
  summary?: {
    totalTests: number;
    successRate: string;
    avgTTFT: string;
    avgTotal: string;
    p95Total: string;
    overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  };
  byIntent?: Record<string, IntentResult>;
  sloTargets?: Record<string, { ttft: number; total: number }>;
  isLoading?: boolean;
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

const getRatingBadge = (rating: string) => {
  switch (rating) {
    case 'excellent': return 'default';
    case 'good': return 'secondary';
    case 'needs_improvement': return 'outline';
    case 'poor': return 'destructive';
    default: return 'outline';
  }
};

export const ResponseTimeResults: React.FC<ResponseTimeResultsProps> = ({
  summary,
  byIntent,
  sloTargets,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Timer className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Running response time tests...</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary || !byIntent) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No response time data yet</p>
          <p className="text-xs mt-1">Run the Response Time Test to benchmark AYN</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Response Time Summary
            <Badge variant={getRatingBadge(summary.overallRating) as "default" | "secondary" | "destructive" | "outline"}>
              {summary.overallRating.replace('_', ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <p className="text-lg font-bold">{summary.successRate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg TTFT</p>
              <p className="text-lg font-bold">{summary.avgTTFT}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Total</p>
              <p className="text-lg font-bold">{summary.avgTotal}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">P95 Total</p>
              <p className="text-lg font-bold">{summary.p95Total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tests Run</p>
              <p className="text-lg font-bold">{summary.totalTests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intent Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(byIntent).map(([intent, data]) => {
          const slo = sloTargets?.[intent] || { ttft: 2000, total: 5000 };
          const ttftCompliance = data.sloCompliance.ttft;
          const totalCompliance = data.sloCompliance.total;
          
          return (
            <Card key={intent}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="capitalize">{intent}</span>
                  {totalCompliance >= 90 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : totalCompliance >= 70 ? (
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>TTFT (target: {slo.ttft}ms)</span>
                    <span>{data.ttftStats.avg.toFixed(0)}ms avg</span>
                  </div>
                  <Progress value={ttftCompliance} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{ttftCompliance.toFixed(0)}% within SLO</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Total (target: {slo.total}ms)</span>
                    <span>{data.totalStats.avg.toFixed(0)}ms avg</span>
                  </div>
                  <Progress value={totalCompliance} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{totalCompliance.toFixed(0)}% within SLO</p>
                </div>
                
                <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span>P50:</span>
                    <span>{data.totalStats.p50.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>P95:</span>
                    <span>{data.totalStats.p95.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>P99:</span>
                    <span>{data.totalStats.p99.toFixed(0)}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ResponseTimeResults;
