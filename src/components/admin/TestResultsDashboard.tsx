import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Zap,
  Timer,
  Loader2,
  Database,
  Bot,
  Shield,
  Activity,
  Globe,
  UserCheck,
  Calculator,
  ChevronDown,
  ChevronUp,
  FileCode,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import QuickStatusBar from './test-results/QuickStatusBar';
import { TestSuiteGrid, TestSuite } from './test-results/TestSuiteGrid';
import SimplePlatformHealth from './test-results/SimplePlatformHealth';
import AIAnalysisCard from './test-results/AIAnalysisCard';
import EngineeringBenchmark from './test-results/EngineeringBenchmark';
import AIImprovements from './test-results/AIImprovements';
import { OWASPSecurityReport } from './test-results/OWASPSecurityReport';

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

const SUPABASE_URL = 'https://dfkoxuokfkttjhfjcecx.supabase.co';

const TestResultsDashboard: React.FC = () => {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [stressMetrics, setStressMetrics] = useState<StressMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['suites', 'activity']));
  
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiModel, setAiModel] = useState<string>('');
  const [bugs, setBugs] = useState<Array<{ endpoint: string; bugType: string; severity: 'critical' | 'high' | 'medium' | 'low'; description: string; suggestedFix: string }>>([]);
  const [isRunningBugHunter, setIsRunningBugHunter] = useState(false);
  
  // Test suite running states
  const [runningSecurityTests, setRunningSecurityTests] = useState(false);
  const [runningApiTests, setRunningApiTests] = useState(false);
  const [runningDbTests, setRunningDbTests] = useState(false);
  const [runningPerfTests, setRunningPerfTests] = useState(false);
  
  // Engineering grade from localStorage
  const [engineeringGrade, setEngineeringGrade] = useState<string | null>(null);
  
  // Security score
  const [securityScore, setSecurityScore] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    // Load engineering grade from localStorage
    const stored = localStorage.getItem('engineering_benchmark_results');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEngineeringGrade(parsed.summary?.overallGrade);
      } catch (e) {
        console.error('Failed to parse engineering results:', e);
      }
    }
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
      if (resultsRes.data) {
        setTestResults(resultsRes.data);
        // Calculate security score from results
        const secTests = resultsRes.data.filter(t => t.test_suite === 'security');
        if (secTests.length > 0) {
          const passed = secTests.filter(t => t.status === 'passed').length;
          setSecurityScore(Math.round((passed / secTests.length) * 100));
        }
      }
      if (metricsRes.data) setStressMetrics(metricsRes.data);
    } catch (error) {
      console.error('Failed to load test data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runTests = async (suiteId: string, setLoading: (v: boolean) => void) => {
    setLoading(true);
    const runId = crypto.randomUUID();
    
    try {
      const suiteConfig: Record<string, { name: string; suite: string }> = {
        api: { name: 'API Health Tests', suite: 'api' },
        database: { name: 'Database Tests', suite: 'database' },
        security: { name: 'Security Tests', suite: 'security' },
        performance: { name: 'Performance Tests', suite: 'performance' },
      };
      
      const config = suiteConfig[suiteId] || { name: 'Quick Tests', suite: 'quick' };
      toast.info(`Running ${config.name}...`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/run-real-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suite: config.suite }),
      });

      // Validate content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from test runner:', text.substring(0, 200));
        throw new Error('Server returned HTML error page instead of JSON. Check edge function logs.');
      }

      if (!response.ok) {
        throw new Error(`Test runner failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.results) {
        await supabase.from('test_runs').insert({
          id: runId,
          run_name: config.name,
          total_tests: result.summary.total,
          passed_tests: result.summary.passed,
          failed_tests: result.summary.failed,
          skipped_tests: 0,
          duration_ms: result.summary.totalDuration,
          environment: 'production',
          completed_at: new Date().toISOString(),
        });

        for (const testResult of result.results) {
          await supabase.from('test_results').insert({
            run_id: runId,
            test_suite: testResult.category,
            test_name: testResult.name,
            status: testResult.status,
            duration_ms: testResult.duration_ms,
            error_message: testResult.error_message,
            browser: 'Edge Function',
          });
        }

        const passRate = result.summary.passRate;
        if (passRate === 100) {
          toast.success(`✅ ${config.name}: All ${result.summary.total} tests passed!`);
        } else if (passRate >= 80) {
          toast.warning(`⚠️ ${config.name}: ${result.summary.passed}/${result.summary.total} passed`);
        } else {
          toast.error(`❌ ${config.name}: ${result.summary.failed} tests failed`);
        }
        
        await loadData();
      }
    } catch (error) {
      console.error('Test run failed:', error);
      toast.error(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const runBugHunter = async () => {
    setIsRunningBugHunter(true);
    try {
      toast.info('🔍 AI Bug Hunter starting...');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-bug-hunter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          endpoints: ['calculate-beam', 'calculate-column', 'calculate-foundation', 'support-bot'],
          model: 'claude'
        }),
      });

      // Validate content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from bug hunter:', text.substring(0, 200));
        throw new Error('Server returned HTML error page instead of JSON. Check edge function logs.');
      }

      if (!response.ok) {
        throw new Error(`Bug hunter failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setBugs(result.bugs || []);
        setAiAnalysis(result.analysis || '');
        setAiModel(result.modelUsed || 'Claude Sonnet 4');
        
        if (result.bugs.length === 0) {
          toast.success('✅ No bugs found!');
        } else {
          toast.warning(`⚠️ Found ${result.bugs.length} potential bugs`);
        }
      }
    } catch (error) {
      console.error('Bug hunter failed:', error);
      toast.error(`Bug hunter failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningBugHunter(false);
    }
  };

  // Calculate summary stats
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const avgDuration = totalTests > 0 
    ? testResults.reduce((acc, t) => acc + (t.duration_ms || 0), 0) / totalTests 
    : 0;

  // Group test results by category for suite grid
  const getTestsByCategory = (category: string) => 
    testResults.filter(t => t.test_suite === category);

  const testSuites: TestSuite[] = [
    {
      id: 'security',
      name: 'Security',
      icon: <Shield className="h-4 w-4 text-red-500" />,
      passed: getTestsByCategory('security').filter(t => t.status === 'passed').length,
      failed: getTestsByCategory('security').filter(t => t.status === 'failed').length,
      total: getTestsByCategory('security').length,
      tests: getTestsByCategory('security').map(t => ({
        name: t.test_name,
        status: t.status as 'passed' | 'failed' | 'skipped',
        duration_ms: t.duration_ms ?? undefined,
        error_message: t.error_message
      })),
      isLoading: runningSecurityTests,
      onRun: () => runTests('security', setRunningSecurityTests)
    },
    {
      id: 'api',
      name: 'API Health',
      icon: <Globe className="h-4 w-4 text-cyan-500" />,
      passed: getTestsByCategory('api').filter(t => t.status === 'passed').length,
      failed: getTestsByCategory('api').filter(t => t.status === 'failed').length,
      total: getTestsByCategory('api').length,
      tests: getTestsByCategory('api').map(t => ({
        name: t.test_name,
        status: t.status as 'passed' | 'failed' | 'skipped',
        duration_ms: t.duration_ms ?? undefined,
        error_message: t.error_message
      })),
      isLoading: runningApiTests,
      onRun: () => runTests('api', setRunningApiTests)
    },
    {
      id: 'database',
      name: 'Database',
      icon: <Database className="h-4 w-4 text-purple-500" />,
      passed: getTestsByCategory('database').filter(t => t.status === 'passed').length,
      failed: getTestsByCategory('database').filter(t => t.status === 'failed').length,
      total: getTestsByCategory('database').length,
      tests: getTestsByCategory('database').map(t => ({
        name: t.test_name,
        status: t.status as 'passed' | 'failed' | 'skipped',
        duration_ms: t.duration_ms ?? undefined,
        error_message: t.error_message
      })),
      isLoading: runningDbTests,
      onRun: () => runTests('database', setRunningDbTests)
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: <Zap className="h-4 w-4 text-yellow-500" />,
      passed: getTestsByCategory('performance').filter(t => t.status === 'passed').length,
      failed: getTestsByCategory('performance').filter(t => t.status === 'failed').length,
      total: getTestsByCategory('performance').length,
      tests: getTestsByCategory('performance').map(t => ({
        name: t.test_name,
        status: t.status as 'passed' | 'failed' | 'skipped',
        duration_ms: t.duration_ms ?? undefined,
        error_message: t.error_message
      })),
      isLoading: runningPerfTests,
      onRun: () => runTests('performance', setRunningPerfTests)
    },
    {
      id: 'calculator',
      name: 'Calculators',
      icon: <Calculator className="h-4 w-4 text-blue-500" />,
      passed: getTestsByCategory('calculator').filter(t => t.status === 'passed').length,
      failed: getTestsByCategory('calculator').filter(t => t.status === 'failed').length,
      total: getTestsByCategory('calculator').length,
      grade: engineeringGrade || undefined,
      tests: getTestsByCategory('calculator').map(t => ({
        name: t.test_name,
        status: t.status as 'passed' | 'failed' | 'skipped',
        duration_ms: t.duration_ms ?? undefined,
        error_message: t.error_message
      })),
    }
  ];

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const criticalIssues = failedTests;
  const warnings = testResults.filter(t => t.status === 'skipped').length;

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Test Results</h1>
          <p className="text-sm text-muted-foreground">Real-time testing dashboard</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Status Bar */}
      <QuickStatusBar
        passing={passedTests}
        warnings={warnings}
        critical={criticalIssues}
        lastRun={testRuns.length > 0 ? new Date(testRuns[0].created_at) : undefined}
        engineeringGrade={engineeringGrade || undefined}
        securityScore={securityScore ?? undefined}
      />

      {/* Section 1: Platform Health + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SimplePlatformHealth
          testPassRate={passRate}
          errorRate={totalTests > 0 ? (failedTests / totalTests) * 100 : 0}
          criticalIssues={criticalIssues}
          totalTests={totalTests}
          hasRealData={totalTests > 0}
        />
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{passRate.toFixed(0)}%</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${passRate >= 90 ? 'text-green-500' : passRate >= 70 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
            <Progress value={passRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{passedTests}/{totalTests} tests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{(avgDuration / 1000).toFixed(1)}s</p>
              </div>
              <Timer className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{testRuns.length} runs recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: AI Tools Quick Actions */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="py-3">
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-2 mr-2">
              <Bot className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">AI Tools:</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runBugHunter} 
              disabled={isRunningBugHunter}
              className="h-8"
            >
              {isRunningBugHunter ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Shield className="h-3 w-3 mr-1" />}
              Bug Hunter
              {bugs.length > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{bugs.length}</Badge>}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runTests('security', setRunningSecurityTests)} 
              disabled={runningSecurityTests}
              className="h-8"
            >
              {runningSecurityTests ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Shield className="h-3 w-3 mr-1" />}
              OWASP Scan
              {securityScore !== null && <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">{securityScore}%</Badge>}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runTests('api', setRunningApiTests)} 
              disabled={runningApiTests}
              className="h-8"
            >
              {runningApiTests ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Globe className="h-3 w-3 mr-1" />}
              API Health
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runTests('performance', setRunningPerfTests)} 
              disabled={runningPerfTests}
              className="h-8"
            >
              {runningPerfTests ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
              Performance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Test Suites Grid (Collapsible) */}
      <Collapsible open={expandedSections.has('suites')} onOpenChange={() => toggleSection('suites')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Test Suites
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{totalTests} tests</Badge>
                  {expandedSections.has('suites') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <TestSuiteGrid suites={testSuites} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 4: Engineering & AI Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EngineeringBenchmark />
        
        <AIAnalysisCard
          analysis={aiAnalysis}
          model={aiModel || 'Claude Sonnet 4'}
          bugs={bugs}
          isLoading={isRunningBugHunter}
          lastAnalyzedAt={testRuns.length > 0 ? new Date(testRuns[0].created_at) : undefined}
        />
      </div>

      {/* Section 5: AI Improvements */}
      <Collapsible open={expandedSections.has('improvements')} onOpenChange={() => toggleSection('improvements')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  AI Improvement Suggestions
                </CardTitle>
                {expandedSections.has('improvements') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <AIImprovements />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 6: Recent Activity (Collapsible) */}
      <Collapsible open={expandedSections.has('activity')} onOpenChange={() => toggleSection('activity')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{testRuns.length} runs</Badge>
                  {expandedSections.has('activity') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {testRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No test runs yet</p>
                  <Button onClick={() => runTests('api', setRunningApiTests)} className="mt-3" size="sm" disabled={runningApiTests}>
                    <Play className="h-3 w-3 mr-1" /> Run First Test
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {testRuns.slice(0, 10).map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {(run.passed_tests ?? 0) === (run.total_tests ?? 0) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (run.failed_tests ?? 0) > 0 ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{run.run_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(run.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">{run.passed_tests ?? 0}/{run.total_tests ?? 0}</p>
                            <p className="text-xs text-muted-foreground">
                              {((run.duration_ms ?? 0) / 1000).toFixed(1)}s
                            </p>
                          </div>
                          <Progress 
                            value={((run.passed_tests ?? 0) / (run.total_tests || 1)) * 100} 
                            className="w-16 h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 7: OWASP Detailed Report (Collapsible) */}
      <Collapsible open={expandedSections.has('owasp')} onOpenChange={() => toggleSection('owasp')}>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer">
            <Card className="hover:bg-muted/30 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-500" />
                    OWASP Security Details
                  </CardTitle>
                  {expandedSections.has('owasp') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
            </Card>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2">
            <OWASPSecurityReport />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default TestResultsDashboard;
