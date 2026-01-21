import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, XCircle, Clock, Zap, Shield } from 'lucide-react';

interface EndpointResult {
  passed: number;
  failed: number;
  skipped: number;
}

interface CrashTestResultsProps {
  summary?: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    crashRate: string;
    avgResponseTime: number;
    totalTime: number;
  };
  byEndpoint?: Record<string, EndpointResult>;
  byCategory?: Record<string, EndpointResult>;
  failures?: Array<{
    endpoint: string;
    category: string;
    httpStatus: number;
    error?: string;
    payload?: unknown;
  }>;
  isLoading?: boolean;
}

export const CrashTestResults: React.FC<CrashTestResultsProps> = ({
  summary,
  byEndpoint,
  byCategory,
  failures,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <span className="text-muted-foreground">Running crash tests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          No crash test results yet. Click "Run Crash Tests" to start.
        </CardContent>
      </Card>
    );
  }

  const passRate = summary.totalTests > 0 ? (summary.passed / summary.totalTests * 100) : 0;
  const isCrashFree = summary.failed === 0;

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'valid_request': '✅',
      'null_inputs': '🚫',
      'undefined_inputs': '❓',
      'empty_request': '📭',
      'wrong_types': '🔤',
      'negative_values': '➖',
      'extreme_large': '📈',
      'extreme_small': '📉',
      'special_characters': '🔣',
      'xss_injection': '💉',
      'sql_injection': '🗃️',
      'unicode_emoji': '🎭'
    };
    return icons[category] || '🧪';
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={`border-2 ${isCrashFree ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Reliability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${isCrashFree ? 'text-green-500' : 'text-red-500'}`}>
                {summary.crashRate}
              </div>
              <div className="text-sm text-muted-foreground">Crash Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{summary.totalTests}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{summary.passed}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{summary.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Avg: {summary.avgResponseTime}ms
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Total: {(summary.totalTime / 1000).toFixed(1)}s
            </span>
          </div>
        </CardContent>
      </Card>

      {/* By Endpoint */}
      {byEndpoint && Object.keys(byEndpoint).length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Results by Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(byEndpoint).map(([endpoint, result]) => {
                const total = result.passed + result.failed + result.skipped;
                const rate = total > 0 ? (result.passed / total * 100) : 0;
                
                return (
                  <div key={endpoint} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs">{endpoint}</span>
                      <div className="flex items-center gap-2">
                        {result.failed > 0 ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-muted-foreground">
                          {result.passed}/{total}
                        </span>
                      </div>
                    </div>
                    <Progress value={rate} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Category */}
      {byCategory && Object.keys(byCategory).length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Results by Test Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(byCategory).map(([category, result]) => {
                const total = result.passed + result.failed + result.skipped;
                const allPassed = result.failed === 0;
                
                return (
                  <div 
                    key={category} 
                    className={`p-3 rounded-lg border ${
                      allPassed 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getCategoryIcon(category)}</span>
                      <span className="text-xs font-medium truncate">
                        {category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={allPassed ? 'default' : 'destructive'} className="text-xs">
                        {result.passed}/{total}
                      </Badge>
                      {result.failed > 0 && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failures Detail */}
      {failures && failures.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-500 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Failed Tests ({failures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {failures.map((failure, idx) => (
                <div key={idx} className="p-2 bg-background/50 rounded border border-red-500/20 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs">{failure.endpoint}</span>
                    <Badge variant="destructive" className="text-xs">
                      HTTP {failure.httpStatus}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Category: {failure.category}
                  </div>
                  {failure.error && (
                    <div className="text-xs text-red-400 mt-1 truncate">
                      {failure.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CrashTestResults;
