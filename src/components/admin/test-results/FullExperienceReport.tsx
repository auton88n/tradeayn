import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock } from "lucide-react";
import SimplePlatformHealth from "./SimplePlatformHealth";
import KeyInsights from "./KeyInsights";
import SimpleStatusCards from "./SimpleStatusCards";
import SuggestedActions from "./SuggestedActions";
import { useState } from "react";
import { toast } from "sonner";

interface TestResult {
  id: string;
  test_suite: string;
  test_name: string;
  status: string;
  duration_ms: number | null;
  error_message?: string | null;
  browser: string | null;
  created_at: string;
}

interface TestRun {
  id: string;
  run_name: string | null;
  total_tests: number | null;
  passed_tests: number | null;
  failed_tests: number | null;
  skipped_tests: number | null;
  duration_ms: number | null;
  environment: string | null;
  created_at: string;
}

interface StressMetric {
  id: string;
  test_name: string;
  concurrent_users: number | null;
  avg_response_time_ms: number | null;
  p95_response_time_ms: number | null;
  error_rate: number | null;
  created_at: string;
}

interface FullExperienceReportProps {
  testPassRate?: number;
  errorRate?: number;
  avgResponseTime?: number;
  supportTickets?: number;
  coveragePercent?: number;
  lastUpdated?: Date;
  testRuns?: TestRun[];
  testResults?: TestResult[];
  stressMetrics?: StressMetric[];
}

const FullExperienceReport = ({
  testPassRate = 0,
  errorRate = 0,
  avgResponseTime = 0,
  supportTickets = 0,
  coveragePercent = 0,
  lastUpdated = new Date(),
  testRuns = [],
  testResults = [],
  stressMetrics = [],
}: FullExperienceReportProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success("Report refreshed");
  };

  // Calculate real stats
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;
  const realPassRate = totalTests > 0 ? (passedTests / totalTests) * 100 : testPassRate;
  const realErrorRate = totalTests > 0 ? (failedTests / totalTests) * 100 : errorRate;

  // Check for critical issues
  const criticalIssues = testResults.filter(t => t.status === 'failed').length;

  // Check if we have real data
  const hasRealData = testResults.length > 0 || testRuns.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Updated {lastUpdated.toLocaleTimeString()}
          </Badge>
          {!hasRealData && (
            <Badge variant="secondary" className="text-xs">
              No test data yet - run some tests!
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Health Status */}
      <SimplePlatformHealth
        testPassRate={realPassRate}
        errorRate={realErrorRate}
        criticalIssues={criticalIssues}
        totalTests={totalTests}
        hasRealData={hasRealData}
      />

      {/* Key Insights - Based on real data */}
      <KeyInsights
        testRuns={testRuns}
        testResults={testResults}
        stressMetrics={stressMetrics}
      />

      {/* Status Cards - Grouped by test suite */}
      <SimpleStatusCards
        testResults={testResults}
        testRuns={testRuns}
      />

      {/* Actions - Based on real gaps */}
      <SuggestedActions
        testResults={testResults}
        testRuns={testRuns}
        stressMetrics={stressMetrics}
      />

      {/* Footer with real stats */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>
          {hasRealData ? (
            <>
              Based on {totalTests} tests from {testRuns.length} run{testRuns.length !== 1 ? 's' : ''} • 
              {passedTests} passed, {failedTests} failed ({realPassRate.toFixed(1)}%)
            </>
          ) : (
            "No test data available yet. Run a test suite to see real results!"
          )}
        </p>
        {stressMetrics.length > 0 && (
          <p>
            {stressMetrics.length} stress test{stressMetrics.length !== 1 ? 's' : ''} recorded
          </p>
        )}
      </div>
    </div>
  );
};

export default FullExperienceReport;
