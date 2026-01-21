import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Monitor,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { browserTestRunner, BrowserTestResult } from '@/lib/browserTestRunner';
import { userJourneyTests, getTestsByCategory, runTestCategory, runAllTests } from '@/lib/userJourneyTests';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrowserTestRunnerProps {
  onResultsUpdate?: () => void;
}

const BrowserTestRunnerComponent: React.FC<BrowserTestRunnerProps> = ({ onResultsUpdate }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [results, setResults] = useState<BrowserTestResult[]>([]);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const saveResultsToDatabase = async (testResults: BrowserTestResult[]) => {
    try {
      // Create a test run record
      const { data: runData, error: runError } = await supabase
        .from('test_runs')
        .insert({
          suite_name: 'User Journey Tests',
          total_tests: testResults.length,
          passed_tests: testResults.filter(r => r.status === 'passed').length,
          failed_tests: testResults.filter(r => r.status === 'failed').length,
          skipped_tests: testResults.filter(r => r.status === 'skipped').length,
          duration_ms: testResults.reduce((sum, r) => sum + r.duration_ms, 0),
          status: testResults.every(r => r.status === 'passed') ? 'passed' : 'failed'
        })
        .select()
        .single();

      if (runError) throw runError;

      // Save individual test results
      const resultsToInsert = testResults.map(result => ({
        run_id: runData.id,
        test_suite: 'user-journey',
        test_name: result.name,
        status: result.status,
        duration_ms: result.duration_ms,
        error_message: result.error_message || null,
        browser: 'Browser DOM',
      }));

      const { error: resultsError } = await supabase
        .from('test_results')
        .insert(resultsToInsert);

      if (resultsError) throw resultsError;

      toast.success('Test results saved to database');
      onResultsUpdate?.();
    } catch (error) {
      console.error('Failed to save results:', error);
      toast.error('Failed to save results to database');
    }
  };

  const runAllUserTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const allResults: BrowserTestResult[] = [];
      
      for (const test of userJourneyTests) {
        setCurrentTest(test.name);
        const result = await browserTestRunner.runTest(test.name, test.run);
        allResults.push(result);
        setResults([...allResults]);
        
        // Small delay between tests
        await browserTestRunner.wait(300);
      }
      
      setCurrentTest(null);
      await saveResultsToDatabase(allResults);
      
      const passed = allResults.filter(r => r.status === 'passed').length;
      const failed = allResults.filter(r => r.status === 'failed').length;
      
      if (failed === 0) {
        toast.success(`All ${passed} tests passed!`);
      } else {
        toast.warning(`${passed} passed, ${failed} failed`);
      }
    } catch (error) {
      console.error('Test run failed:', error);
      toast.error('Test run failed');
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  }, [onResultsUpdate]);

  const runCategoryTests = useCallback(async (category: string) => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const categoryResults = await runTestCategory(browserTestRunner, category);
      setResults(categoryResults);
      await saveResultsToDatabase(categoryResults);
      
      const passed = categoryResults.filter(r => r.status === 'passed').length;
      const failed = categoryResults.filter(r => r.status === 'failed').length;
      
      toast.info(`${category}: ${passed} passed, ${failed} failed`);
    } catch (error) {
      console.error('Category test failed:', error);
      toast.error('Category test failed');
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  }, [onResultsUpdate]);

  const toggleExpanded = (testName: string) => {
    setExpandedResults(prev => {
      const next = new Set(prev);
      if (next.has(testName)) {
        next.delete(testName);
      } else {
        next.add(testName);
      }
      return next;
    });
  };

  const categories = getTestsByCategory();
  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5 text-primary" />
            Browser User Journey Tests
          </CardTitle>
          <Button
            onClick={runAllUserTests}
            disabled={isRunning}
            size="sm"
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Quick Run */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(categories).map(([category, tests]) => (
            <Button
              key={category}
              variant="outline"
              size="sm"
              onClick={() => runCategoryTests(category)}
              disabled={isRunning}
              className="gap-1"
            >
              {category}
              <Badge variant="secondary" className="ml-1">
                {tests.length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Current Test Indicator */}
        {currentTest && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">Running: {currentTest}</span>
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="flex gap-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{passedCount} Passed</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">{failedCount} Failed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {(results.reduce((sum, r) => sum + r.duration_ms, 0) / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={`${result.name}-${index}`}
                  className={`p-3 rounded-lg border ${
                    result.status === 'passed'
                      ? 'border-green-500/20 bg-green-500/5'
                      : result.status === 'failed'
                      ? 'border-red-500/20 bg-red-500/5'
                      : 'border-muted'
                  }`}
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpanded(result.name)}
                  >
                    <div className="flex items-center gap-2">
                      {result.status === 'passed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : result.status === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{result.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {result.duration_ms}ms
                      </Badge>
                      {expandedResults.has(result.name) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedResults.has(result.name) && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      {result.error_message && (
                        <div className="text-sm text-red-500 mb-2">
                          Error: {result.error_message}
                        </div>
                      )}
                      {result.step_details && result.step_details.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Steps:</span>
                          <div className="text-xs font-mono bg-muted/50 p-2 rounded max-h-32 overflow-auto">
                            {result.step_details.map((step, i) => (
                              <div key={i} className="text-muted-foreground">
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Empty State */}
        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Click "Run All Tests" to start browser-based testing</p>
            <p className="text-xs mt-1">Tests will interact with the UI like a real user</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrowserTestRunnerComponent;
