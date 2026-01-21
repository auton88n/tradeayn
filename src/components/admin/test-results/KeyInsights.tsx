import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, Info, TrendingUp, AlertCircle, Timer, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  id: string;
  test_suite: string;
  test_name: string;
  status: string;
  duration_ms: number | null;
  error_message?: string | null;
  created_at: string;
}

interface TestRun {
  id: string;
  run_name: string | null;
  total_tests: number | null;
  passed_tests: number | null;
  failed_tests: number | null;
  duration_ms?: number | null;
  created_at: string;
}

interface StressMetric {
  id: string;
  test_name: string;
  concurrent_users: number | null;
  avg_response_time_ms?: number | null;
  p95_response_time_ms?: number | null;
  error_rate: number | null;
  created_at: string;
}

interface KeyInsightsProps {
  testRuns?: TestRun[];
  testResults?: TestResult[];
  stressMetrics?: StressMetric[];
}

interface Insight {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  details: string[];
  metric?: string;
}

const KeyInsights = ({ testRuns = [], testResults = [], stressMetrics = [] }: KeyInsightsProps) => {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // No data state
    if (testResults.length === 0 && testRuns.length === 0) {
      return [
        { 
          type: 'warning', 
          title: 'No test data available yet',
          details: ['Run your first test suite to see insights', 'Use the "Run Tests" button above']
        },
      ];
    }
    
    // Latest run analysis with specific test names
    if (testRuns.length > 0) {
      const latestRun = testRuns[0];
      const passRate = latestRun.total_tests && latestRun.passed_tests 
        ? Math.round((latestRun.passed_tests / latestRun.total_tests) * 100)
        : 0;
      
      const timeAgo = formatDistanceToNow(new Date(latestRun.created_at), { addSuffix: true });
      
      if (passRate === 100) {
        insights.push({
          type: 'success',
          title: `All ${latestRun.total_tests} tests passing`,
          details: [`Last run: ${timeAgo}`, latestRun.run_name || 'Unnamed run'],
          metric: '100%'
        });
      } else if (passRate >= 80) {
        insights.push({
          type: 'warning',
          title: `${latestRun.failed_tests} tests need attention`,
          details: [`${passRate}% pass rate`, `Run: ${timeAgo}`],
          metric: `${passRate}%`
        });
      } else {
        insights.push({
          type: 'error',
          title: `Critical: ${latestRun.failed_tests} test failures`,
          details: [`Only ${passRate}% passing`, `Immediate action required`],
          metric: `${passRate}%`
        });
      }
    }

    // Specific failed tests with names and errors
    const failedTests = testResults.filter(r => r.status === 'failed');
    if (failedTests.length > 0) {
      const failedNames = failedTests.slice(0, 3).map(t => t.test_name);
      const hasMore = failedTests.length > 3;
      
      insights.push({
        type: 'error',
        title: `${failedTests.length} failing test${failedTests.length > 1 ? 's' : ''}`,
        details: [
          ...failedNames,
          ...(hasMore ? [`+${failedTests.length - 3} more failures`] : [])
        ],
        metric: failedTests.length.toString()
      });
    }

    // Slow tests detection
    const slowTests = testResults.filter(r => (r.duration_ms || 0) > 5000);
    if (slowTests.length > 0) {
      const slowestTest = slowTests.sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0))[0];
      insights.push({
        type: 'warning',
        title: `${slowTests.length} slow test${slowTests.length > 1 ? 's' : ''} detected`,
        details: [
          `Slowest: ${slowestTest.test_name}`,
          `Duration: ${((slowestTest.duration_ms || 0) / 1000).toFixed(1)}s`
        ],
        metric: `${slowTests.length}`
      });
    }

    // Stress test insights with specifics
    if (stressMetrics.length > 0) {
      const highErrorMetrics = stressMetrics.filter(m => (m.error_rate || 0) >= 0.05);
      if (highErrorMetrics.length > 0) {
        const worstMetric = highErrorMetrics.sort((a, b) => (b.error_rate || 0) - (a.error_rate || 0))[0];
        insights.push({
          type: 'warning',
          title: 'High error rate in load tests',
          details: [
            `${worstMetric.test_name}: ${((worstMetric.error_rate || 0) * 100).toFixed(1)}% errors`,
            `${worstMetric.concurrent_users} concurrent users`
          ],
          metric: `${((worstMetric.error_rate || 0) * 100).toFixed(0)}%`
        });
      }

      // P95 response time analysis
      const slowP95 = stressMetrics.filter(m => (m.p95_response_time_ms || 0) > 2000);
      if (slowP95.length > 0) {
        const slowest = slowP95.sort((a, b) => (b.p95_response_time_ms || 0) - (a.p95_response_time_ms || 0))[0];
        insights.push({
          type: 'info',
          title: 'Response time optimization needed',
          details: [
            `${slowest.test_name}: ${((slowest.p95_response_time_ms || 0) / 1000).toFixed(1)}s P95`,
            'Consider caching or query optimization'
          ],
          metric: `${((slowest.p95_response_time_ms || 0) / 1000).toFixed(1)}s`
        });
      }
    }

    // Test coverage insight
    const uniqueSuites = [...new Set(testResults.map(r => r.test_suite))];
    if (uniqueSuites.length > 0 && insights.length < 5) {
      const totalTests = testResults.length;
      insights.push({
        type: 'info',
        title: `${uniqueSuites.length} test suites active`,
        details: [
          `${totalTests} total tests across suites`,
          uniqueSuites.slice(0, 3).join(', ') + (uniqueSuites.length > 3 ? '...' : '')
        ],
        metric: uniqueSuites.length.toString()
      });
    }

    // No recent tests warning
    if (testRuns.length > 0) {
      const latestRunDate = new Date(testRuns[0].created_at);
      const hoursSinceRun = (Date.now() - latestRunDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceRun > 24) {
        insights.push({
          type: 'warning',
          title: 'Tests may be stale',
          details: [
            `Last run: ${formatDistanceToNow(latestRunDate, { addSuffix: true })}`,
            'Consider running tests to verify current state'
          ],
          metric: `${Math.floor(hoursSinceRun)}h`
        });
      }
    }

    return insights.slice(0, 5);
  };

  const insights = generateInsights();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-500/5';
      case 'warning':
        return 'border-amber-500/20 bg-amber-500/5';
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      case 'info':
      default:
        return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  if (insights.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No test data available yet</p>
          <p className="text-xs mt-1">Run tests to generate insights</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          What You Need to Know
          <Badge variant="secondary" className="ml-auto text-xs">
            {insights.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${getTypeStyles(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium">{insight.title}</h4>
                  {insight.metric && (
                    <Badge 
                      variant="outline" 
                      className={`shrink-0 text-xs font-mono ${
                        insight.type === 'success' ? 'text-emerald-400 border-emerald-500/30' :
                        insight.type === 'warning' ? 'text-amber-400 border-amber-500/30' :
                        insight.type === 'error' ? 'text-red-400 border-red-500/30' :
                        'text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {insight.metric}
                    </Badge>
                  )}
                </div>
                <ul className="mt-1.5 space-y-0.5">
                  {insight.details.map((detail, i) => (
                    <li key={i} className="text-sm text-muted-foreground truncate">
                      • {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default KeyInsights;