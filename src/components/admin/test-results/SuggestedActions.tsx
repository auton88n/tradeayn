import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Lightbulb, CheckCircle2, ArrowRight, AlertCircle, Play, Bug, Zap, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface TestResult {
  id: string;
  test_suite: string;
  test_name: string;
  status: string;
  error_message?: string | null;
  duration_ms?: number | null;
  created_at: string;
}

interface TestRun {
  id: string;
  run_name: string | null;
  total_tests: number | null;
  passed_tests: number | null;
  failed_tests: number | null;
  created_at: string;
}

interface StressMetric {
  id: string;
  test_name: string;
  error_rate: number | null;
  avg_response_time_ms?: number | null;
  created_at: string;
}

interface Action {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ReactNode;
  testNames?: string[];
  actionLabel?: string;
}

interface SuggestedActionsProps {
  testResults?: TestResult[];
  testRuns?: TestRun[];
  stressMetrics?: StressMetric[];
}

const SuggestedActions = ({ testResults = [], testRuns = [], stressMetrics = [] }: SuggestedActionsProps) => {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const actions = useMemo((): Action[] => {
    const suggestions: Action[] = [];

    // No data suggestion
    if (testResults.length === 0 && testRuns.length === 0) {
      return [
        {
          id: 'run-initial',
          title: 'Run your first test suite',
          description: 'Establish baseline metrics by running the Quick AI Tests suite',
          priority: 'critical',
          icon: <Play className="w-4 h-4" />,
          actionLabel: 'Run Quick Tests'
        },
        {
          id: 'explore-suites',
          title: 'Explore available test suites',
          description: 'Check out Auth, Security, Stress, and more test categories',
          priority: 'medium',
          icon: <Lightbulb className="w-4 h-4" />,
          actionLabel: 'View Suites'
        }
      ];
    }

    // Specific failed tests with names
    const failedTests = testResults.filter(r => r.status === 'failed');
    if (failedTests.length > 0) {
      const groupedByError = failedTests.reduce((acc, t) => {
        const key = t.error_message || 'Unknown error';
        if (!acc[key]) acc[key] = [];
        acc[key].push(t.test_name);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(groupedByError).slice(0, 2).forEach(([error, tests], i) => {
        suggestions.push({
          id: `fix-${i}`,
          title: `Fix ${tests.length} failing test${tests.length > 1 ? 's' : ''}`,
          description: error.length > 80 ? error.substring(0, 77) + '...' : error,
          priority: 'critical',
          icon: <Bug className="w-4 h-4" />,
          testNames: tests.slice(0, 3),
          actionLabel: 'View Details'
        });
      });
    }

    // Slow tests that need optimization
    const slowTests = testResults.filter(r => (r.duration_ms || 0) > 5000);
    if (slowTests.length > 0) {
      suggestions.push({
        id: 'optimize-slow',
        title: `Optimize ${slowTests.length} slow test${slowTests.length > 1 ? 's' : ''}`,
        description: 'Tests taking over 5 seconds may indicate performance issues',
        priority: 'medium',
        icon: <Zap className="w-4 h-4" />,
        testNames: slowTests.slice(0, 3).map(t => t.test_name),
        actionLabel: 'Review Tests'
      });
    }

    // Old test runs
    if (testRuns.length > 0) {
      const latestRun = new Date(testRuns[0].created_at);
      const hoursSinceRun = (Date.now() - latestRun.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceRun > 24) {
        suggestions.push({
          id: 'run-tests',
          title: 'Tests may be stale',
          description: `Last run was ${formatDistanceToNow(latestRun, { addSuffix: true })}. Re-run to verify current state.`,
          priority: 'medium',
          icon: <Play className="w-4 h-4" />,
          actionLabel: 'Run Tests'
        });
      }
    }

    // No stress tests
    if (stressMetrics.length === 0 && testResults.length > 0) {
      suggestions.push({
        id: 'run-stress',
        title: 'No stress test data',
        description: 'Run stress tests to check load capacity and performance under pressure',
        priority: 'medium',
        icon: <Zap className="w-4 h-4" />,
        actionLabel: 'Run Stress Tests'
      });
    }

    // High error rate in stress tests with specifics
    const highErrorMetrics = stressMetrics.filter(m => (m.error_rate || 0) >= 0.05);
    if (highErrorMetrics.length > 0) {
      const worst = highErrorMetrics.sort((a, b) => (b.error_rate || 0) - (a.error_rate || 0))[0];
      suggestions.push({
        id: 'fix-stress',
        title: 'High error rate under load',
        description: `${worst.test_name}: ${((worst.error_rate || 0) * 100).toFixed(1)}% errors`,
        priority: 'high',
        icon: <AlertCircle className="w-4 h-4" />,
        actionLabel: 'Investigate'
      });
    }

    // Missing critical test suites
    const existingSuites = new Set(testResults.map(r => r.test_suite.toLowerCase()));
    const criticalSuites = [
      { name: 'security', label: 'Security Tests' },
      { name: 'auth', label: 'Auth Tests' }
    ];
    
    const missingSuites = criticalSuites.filter(s => 
      ![...existingSuites].some(es => es.includes(s.name))
    );
    
    if (missingSuites.length > 0) {
      suggestions.push({
        id: 'add-security',
        title: 'Add critical test coverage',
        description: `Missing: ${missingSuites.map(s => s.label).join(', ')}`,
        priority: 'high',
        icon: <Shield className="w-4 h-4" />,
        actionLabel: 'Add Tests'
      });
    }

    // All good state
    if (suggestions.length === 0) {
      const passedCount = testResults.filter(r => r.status === 'passed').length;
      suggestions.push({
        id: 'all-good',
        title: 'All systems healthy',
        description: `${passedCount} tests passing. Consider expanding edge case coverage.`,
        priority: 'low',
        icon: <CheckCircle2 className="w-4 h-4" />,
        actionLabel: 'Add More Tests'
      });
    }

    return suggestions.slice(0, 5);
  }, [testResults, testRuns, stressMetrics]);

  const toggleCompleted = (id: string) => {
    setCompletedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          badge: 'bg-red-500/20 text-red-400 border-red-500/30',
          card: 'border-red-500/20 bg-red-500/5'
        };
      case 'high':
        return {
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          card: 'border-orange-500/20 bg-orange-500/5'
        };
      case 'medium':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          card: 'border-amber-500/20 bg-amber-500/5'
        };
      case 'low':
      default:
        return {
          badge: 'bg-muted text-muted-foreground border-border',
          card: 'border-border/50 bg-muted/20'
        };
    }
  };

  if (actions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            No actions available
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingActions = actions.filter(a => !completedActions.has(a.id));
  const doneActions = actions.filter(a => completedActions.has(a.id));

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Suggested Actions
          {pendingActions.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {pendingActions.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingActions.map((action) => {
          const styles = getPriorityStyles(action.priority);
          return (
            <div
              key={action.id}
              className={`p-3 rounded-lg border ${styles.card}`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={action.id}
                  checked={false}
                  onCheckedChange={() => toggleCompleted(action.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted-foreground">{action.icon}</span>
                    <label 
                      htmlFor={action.id}
                      className="font-medium cursor-pointer"
                    >
                      {action.title}
                    </label>
                    <Badge className={`${styles.badge} border text-[10px] ml-auto shrink-0`}>
                      {action.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {action.description}
                  </p>
                  {action.testNames && action.testNames.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {action.testNames.map((name, i) => (
                        <Badge 
                          key={i} 
                          variant="outline" 
                          className="text-[10px] py-0 h-5"
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {action.actionLabel && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs px-2 -ml-2"
                    >
                      {action.actionLabel}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {doneActions.length > 0 && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Completed</p>
            {doneActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-3 p-2 rounded-md opacity-60"
              >
                <Checkbox
                  id={`done-${action.id}`}
                  checked={true}
                  onCheckedChange={() => toggleCompleted(action.id)}
                />
                <label 
                  htmlFor={`done-${action.id}`}
                  className="flex-1 text-sm cursor-pointer line-through"
                >
                  {action.title}
                </label>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuggestedActions;