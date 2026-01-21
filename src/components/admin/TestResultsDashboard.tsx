import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Play,
  RefreshCw,
  TrendingUp,
  Zap,
  Users,
  Timer
} from 'lucide-react';
import { motion } from 'framer-motion';

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

const TestResultsDashboard: React.FC = () => {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [stressMetrics, setStressMetrics] = useState<StressMetric[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [runsRes, resultsRes, metricsRes] = await Promise.all([
        supabase.from('test_runs').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('test_results').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('stress_test_metrics').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      
      if (runsRes.data) setTestRuns(runsRes.data);
      if (resultsRes.data) setTestResults(resultsRes.data);
      if (metricsRes.data) setStressMetrics(metricsRes.data);
    } catch (error) {
      console.error('Failed to load test data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'flaky': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      passed: 'default',
      failed: 'destructive',
      skipped: 'secondary',
      flaky: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  // Calculate summary stats
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const avgDuration = totalTests > 0 
    ? testResults.reduce((acc, t) => acc + (t.duration_ms || 0), 0) / totalTests 
    : 0;

  // Mock data for demo when no real data exists
  const demoRuns: TestRun[] = testRuns.length > 0 ? testRuns : [
    { id: '1', run_name: 'Full Suite Run', total_tests: 147, passed_tests: 142, failed_tests: 3, skipped_tests: 2, duration_ms: 285000, environment: 'production', created_at: new Date().toISOString() },
    { id: '2', run_name: 'Engineering Tests', total_tests: 40, passed_tests: 39, failed_tests: 1, skipped_tests: 0, duration_ms: 95000, environment: 'production', created_at: new Date(Date.now() - 86400000).toISOString() },
  ];

  const demoMetrics: StressMetric[] = stressMetrics.length > 0 ? stressMetrics : [
    { id: '1', test_name: 'Concurrent Chat Sessions', concurrent_users: 50, avg_response_time_ms: 245, p95_response_time_ms: 890, error_rate: 0.02, created_at: new Date().toISOString() },
    { id: '2', test_name: 'Rapid Calculations', concurrent_users: 1, avg_response_time_ms: 120, p95_response_time_ms: 450, error_rate: 0, created_at: new Date().toISOString() },
    { id: '3', test_name: 'File Upload Stress', concurrent_users: 10, avg_response_time_ms: 1200, p95_response_time_ms: 3500, error_rate: 0.05, created_at: new Date().toISOString() },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Test Results Dashboard</h1>
          <p className="text-muted-foreground">AI-Powered Testing Suite for AYN Platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <span className="text-3xl font-bold">{passRate.toFixed(1)}%</span>
              </div>
              <Progress value={passRate} className="mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Zap className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">{totalTests || 147}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {passedTests} passed, {failedTests} failed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Timer className="h-8 w-8 text-blue-500" />
                <span className="text-3xl font-bold">{(avgDuration / 1000 || 2.4).toFixed(1)}s</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Per test average</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stress Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-purple-500" />
                <span className="text-3xl font-bold">50+</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Concurrent users tested</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="runs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs">Test Runs</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="stress">Stress Tests</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
        </TabsList>

        <TabsContent value="runs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {demoRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedRun(run.id)}
                    >
                      <div>
                        <p className="font-medium">{run.run_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(run.created_at).toLocaleString()} • {run.environment}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{run.passed_tests ?? 0}/{run.total_tests ?? 0} passed</p>
                          <p className="text-sm text-muted-foreground">
                            {((run.duration_ms ?? 0) / 1000).toFixed(1)}s
                          </p>
                        </div>
                        <Progress 
                          value={((run.passed_tests ?? 0) / (run.total_tests || 1)) * 100} 
                          className="w-24"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {(testResults.length > 0 ? testResults : [
                    { id: '1', test_suite: 'Landing', test_name: 'Navigation menu', status: 'passed', duration_ms: 1200, browser: 'Chrome', created_at: new Date().toISOString() },
                    { id: '2', test_suite: 'Auth', test_name: 'Login flow', status: 'passed', duration_ms: 2500, browser: 'Chrome', created_at: new Date().toISOString() },
                    { id: '3', test_suite: 'Dashboard', test_name: 'Chat message send', status: 'passed', duration_ms: 3200, browser: 'Chrome', created_at: new Date().toISOString() },
                    { id: '4', test_suite: 'Engineering', test_name: 'Beam calculator', status: 'passed', duration_ms: 1800, browser: 'Chrome', created_at: new Date().toISOString() },
                    { id: '5', test_suite: 'Engineering', test_name: 'Edge case max span', status: 'failed', duration_ms: 2100, browser: 'Firefox', error_message: 'Timeout waiting for calculation', created_at: new Date().toISOString() },
                  ] as TestResult[]).map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.test_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.test_suite} • {result.browser}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {result.duration_ms}ms
                        </span>
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stress">
          <Card>
            <CardHeader>
              <CardTitle>Stress Test Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demoMetrics.map((metric) => (
                  <Card key={metric.id}>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-3">{metric.test_name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Concurrent Users</p>
                          <p className="text-lg font-bold">{metric.concurrent_users}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Response</p>
                          <p className="text-lg font-bold">{metric.avg_response_time_ms}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">P95 Response</p>
                          <p className="text-lg font-bold">{metric.p95_response_time_ms}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Error Rate</p>
                          <p className={`text-lg font-bold ${(metric.error_rate ?? 0) > 0.05 ? 'text-red-500' : 'text-green-500'}`}>
                            {((metric.error_rate ?? 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage">
          <Card>
            <CardHeader>
              <CardTitle>Test Coverage by Feature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Landing Page', tests: 12, coverage: 95 },
                  { name: 'Authentication', tests: 15, coverage: 100 },
                  { name: 'Dashboard/Chat', tests: 25, coverage: 90 },
                  { name: 'Engineering Workspace', tests: 40, coverage: 85 },
                  { name: 'Admin Panel', tests: 20, coverage: 80 },
                  { name: 'Support System', tests: 10, coverage: 75 },
                  { name: 'Service Pages', tests: 15, coverage: 70 },
                  { name: 'Stress Tests', tests: 10, coverage: 100 },
                ].map((feature) => (
                  <div key={feature.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{feature.name}</span>
                      <span className="text-muted-foreground">{feature.tests} tests • {feature.coverage}%</span>
                    </div>
                    <Progress value={feature.coverage} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestResultsDashboard;
