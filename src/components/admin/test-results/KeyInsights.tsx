import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Info, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  created_at: string;
}

interface StressMetric {
  id: string;
  test_name: string;
  concurrent_users: number | null;
  error_rate: number | null;
  created_at: string;
}

interface Insight {
  type: "success" | "warning" | "info" | "error";
  message: string;
}

interface KeyInsightsProps {
  testRuns?: TestRun[];
  testResults?: TestResult[];
  stressMetrics?: StressMetric[];
}

const KeyInsights = ({ 
  testRuns = [], 
  testResults = [], 
  stressMetrics = [] 
}: KeyInsightsProps) => {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // No data state
    if (testResults.length === 0 && testRuns.length === 0) {
      return [
        { type: "warning", message: "No test data available yet. Run your first test suite to see insights!" },
      ];
    }

    // Recent test run insight
    if (testRuns.length > 0) {
      const latestRun = testRuns[0];
      const timeAgo = formatDistanceToNow(new Date(latestRun.created_at), { addSuffix: true });
      const passRate = latestRun.total_tests 
        ? ((latestRun.passed_tests || 0) / latestRun.total_tests * 100).toFixed(0)
        : 0;
      
      if ((latestRun.failed_tests || 0) > 0) {
        insights.push({
          type: "error",
          message: `Last run "${latestRun.run_name || 'Test Run'}": ${latestRun.passed_tests}/${latestRun.total_tests} passed (${passRate}%) - ${timeAgo}`,
        });
      } else {
        insights.push({
          type: "success",
          message: `Last run "${latestRun.run_name || 'Test Run'}": ${latestRun.passed_tests}/${latestRun.total_tests} passed - ${timeAgo}`,
        });
      }
    }

    // Failed tests insight
    const failedTests = testResults.filter(t => t.status === 'failed');
    if (failedTests.length > 0) {
      const uniqueFailedSuites = [...new Set(failedTests.map(t => t.test_suite))];
      insights.push({
        type: "error",
        message: `${failedTests.length} failing test${failedTests.length !== 1 ? 's' : ''} in: ${uniqueFailedSuites.slice(0, 3).join(', ')}${uniqueFailedSuites.length > 3 ? '...' : ''}`,
      });
    } else if (testResults.length > 0) {
      insights.push({
        type: "success",
        message: `All ${testResults.length} tests passing - no failures detected`,
      });
    }

    // Test suite coverage insight
    const uniqueSuites = [...new Set(testResults.map(t => t.test_suite))];
    if (uniqueSuites.length > 0) {
      insights.push({
        type: "success",
        message: `Testing ${uniqueSuites.length} categories: ${uniqueSuites.slice(0, 4).join(', ')}${uniqueSuites.length > 4 ? '...' : ''}`,
      });
    }

    // Stress test insight
    if (stressMetrics.length > 0) {
      const maxUsers = Math.max(...stressMetrics.map(m => m.concurrent_users || 0));
      const avgErrorRate = stressMetrics.reduce((sum, m) => sum + (m.error_rate || 0), 0) / stressMetrics.length;
      
      if (avgErrorRate > 0.05) {
        insights.push({
          type: "warning",
          message: `Stress tests: ${(avgErrorRate * 100).toFixed(1)}% avg error rate at ${maxUsers} concurrent users`,
        });
      } else {
        insights.push({
          type: "success",
          message: `Stress tests passing: supports ${maxUsers}+ concurrent users`,
        });
      }
    } else if (testResults.length > 0) {
      insights.push({
        type: "info",
        message: "No stress test data - consider running stress tests",
      });
    }

    return insights.slice(0, 4); // Max 4 insights
  };

  const insights = generateInsights();

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">What You Need to Know</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              {getIcon(insight.type)}
              <span className={
                insight.type === "error" ? "text-red-600 dark:text-red-400" :
                insight.type === "warning" ? "text-yellow-600 dark:text-yellow-400" :
                insight.type === "success" ? "text-green-600 dark:text-green-400" :
                "text-muted-foreground"
              }>
                {insight.message}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default KeyInsights;
