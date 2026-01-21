import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Lightbulb, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

interface TestResult {
  id: string;
  test_suite: string;
  test_name: string;
  status: string;
  error_message?: string | null;
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
  created_at: string;
}

interface Action {
  id: string;
  text: string;
  priority: "low" | "medium" | "high";
}

interface SuggestedActionsProps {
  testResults?: TestResult[];
  testRuns?: TestRun[];
  stressMetrics?: StressMetric[];
}

const SuggestedActions = ({ 
  testResults = [], 
  testRuns = [], 
  stressMetrics = [] 
}: SuggestedActionsProps) => {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const actions = useMemo((): Action[] => {
    const generatedActions: Action[] = [];

    // No data - suggest running tests
    if (testResults.length === 0 && testRuns.length === 0) {
      return [
        {
          id: "run-first-test",
          text: "Run your first test suite to get started",
          priority: "high",
        },
        {
          id: "explore-suites",
          text: "Explore available test suites (Auth, Security, Stress, etc.)",
          priority: "medium",
        },
      ];
    }

    // Fix failing tests - highest priority
    const failedTests = testResults.filter(t => t.status === 'failed');
    if (failedTests.length > 0) {
      // Group by suite
      const failedBySuite: Record<string, TestResult[]> = {};
      failedTests.forEach(test => {
        const suite = test.test_suite || "Other";
        if (!failedBySuite[suite]) failedBySuite[suite] = [];
        failedBySuite[suite].push(test);
      });

      Object.entries(failedBySuite).forEach(([suite, tests]) => {
        generatedActions.push({
          id: `fix-${suite}`,
          text: `Fix ${tests.length} failing test${tests.length !== 1 ? 's' : ''} in ${suite}: ${tests[0].test_name}${tests.length > 1 ? '...' : ''}`,
          priority: "high",
        });
      });
    }

    // Check for old test runs
    if (testRuns.length > 0) {
      const latestRun = testRuns[0];
      const hoursAgo = (Date.now() - new Date(latestRun.created_at).getTime()) / (1000 * 60 * 60);
      
      if (hoursAgo > 24) {
        generatedActions.push({
          id: "run-tests",
          text: `Last test run was ${formatDistanceToNow(new Date(latestRun.created_at), { addSuffix: true })} - consider running again`,
          priority: "medium",
        });
      }
    }

    // No stress tests
    if (stressMetrics.length === 0 && testResults.length > 0) {
      generatedActions.push({
        id: "run-stress",
        text: "No stress test data - run stress tests to check load capacity",
        priority: "medium",
      });
    }

    // High error rate in stress tests
    const highErrorStress = stressMetrics.filter(m => (m.error_rate || 0) > 0.05);
    if (highErrorStress.length > 0) {
      generatedActions.push({
        id: "fix-stress",
        text: `${highErrorStress.length} stress test${highErrorStress.length !== 1 ? 's' : ''} showing high error rates - investigate performance`,
        priority: "high",
      });
    }

    // Check test coverage across suites
    const testedSuites = new Set(testResults.map(t => t.test_suite));
    const expectedSuites = ['auth', 'security', 'engineering', 'performance', 'user_flow'];
    const missingSuites = expectedSuites.filter(s => !testedSuites.has(s));
    
    if (missingSuites.length > 0 && testResults.length > 0) {
      generatedActions.push({
        id: "expand-coverage",
        text: `Expand test coverage to include: ${missingSuites.slice(0, 3).join(', ')}`,
        priority: "low",
      });
    }

    // All good state
    if (generatedActions.length === 0 && testResults.length > 0) {
      generatedActions.push({
        id: "maintain",
        text: "All tests passing! Keep up the good work and run tests regularly",
        priority: "low",
      });
    }

    return generatedActions.slice(0, 5); // Max 5 actions
  }, [testResults, testRuns, stressMetrics]);

  const toggleCompleted = (id: string) => {
    setCompletedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-xs">Soon</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">When possible</Badge>;
    }
  };

  const pendingActions = actions.filter(a => !completedIds.has(a.id));
  const completedActions = actions.filter(a => completedIds.has(a.id));

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          Suggested Actions
          {pendingActions.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {pendingActions.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pendingActions.map((action) => (
            <div
              key={action.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={false}
                onCheckedChange={() => toggleCompleted(action.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{action.text}</p>
              </div>
              {getPriorityBadge(action.priority)}
            </div>
          ))}
          
          {completedActions.length > 0 && (
            <div className="pt-2 mt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Completed</p>
              {completedActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-3 p-2 opacity-60"
                >
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => toggleCompleted(action.id)}
                    className="mt-0.5"
                  />
                  <p className="text-sm line-through">{action.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestedActions;
