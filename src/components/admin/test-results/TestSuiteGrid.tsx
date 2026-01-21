import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  Calculator, 
  Zap, 
  Database, 
  Globe,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy
} from 'lucide-react';
import { useTestExport } from '@/hooks/useTestExport';
import { TestReportPDF } from './TestReportPDF';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration_ms?: number;
  error_message?: string | null;
}

interface TestSuite {
  id: string;
  name: string;
  icon: React.ReactNode;
  passed: number;
  failed: number;
  total: number;
  grade?: string;
  lastRun?: Date;
  tests?: TestResult[];
  isLoading?: boolean;
  onRun?: () => void;
}

interface TestSuiteGridProps {
  suites: TestSuite[];
}

const TestSuiteGrid: React.FC<TestSuiteGridProps> = ({ suites }) => {
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const { copyAllTests, copyTestAsMarkdown } = useTestExport();

  const toggleSuite = (id: string) => {
    const newExpanded = new Set(expandedSuites);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSuites(newExpanded);
  };

  const getPassRate = (suite: TestSuite) => {
    if (suite.total === 0) return 0;
    return Math.round((suite.passed / suite.total) * 100);
  };

  const getStatusColor = (suite: TestSuite) => {
    const passRate = getPassRate(suite);
    if (passRate >= 90) return 'border-green-500/30 bg-green-500/5';
    if (passRate >= 70) return 'border-yellow-500/30 bg-yellow-500/5';
    return 'border-red-500/30 bg-red-500/5';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500 text-white';
    if (grade.startsWith('B')) return 'bg-blue-500 text-white';
    if (grade.startsWith('C')) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {suites.map((suite) => (
        <Card 
          key={suite.id} 
          className={`transition-all ${getStatusColor(suite)} ${expandedSuites.has(suite.id) ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''}`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                {suite.icon}
                {suite.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                {suite.grade && (
                  <Badge className={getGradeColor(suite.grade)}>
                    {suite.grade}
                  </Badge>
                )}
                {suite.total > 0 && (
                  <Badge variant={getPassRate(suite) >= 90 ? 'default' : getPassRate(suite) >= 70 ? 'secondary' : 'destructive'}>
                    {getPassRate(suite)}%
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {suite.total > 0 ? (
              <>
                <Progress value={getPassRate(suite)} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {suite.passed} passed
                  </span>
                  {suite.failed > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle className="h-3 w-3" />
                      {suite.failed} failed
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                No tests run yet
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {suite.onRun && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={suite.onRun}
                  disabled={suite.isLoading}
                  className="flex-1 h-7"
                >
                  {suite.isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Zap className="h-3 w-3 mr-1" />
                  )}
                  Run
                </Button>
              )}
              
              {suite.tests && suite.tests.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyAllTests(suite.tests!, suite.name)}
                    className="h-7 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  
                  <TestReportPDF
                    categoryName={suite.name}
                    tests={suite.tests}
                    grade={suite.grade}
                    passRate={getPassRate(suite)}
                    lastRun={suite.lastRun}
                  />
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSuite(suite.id)}
                    className="h-7 px-2"
                  >
                    {expandedSuites.has(suite.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>

            {expandedSuites.has(suite.id) && suite.tests && (
              <ScrollArea className="h-[500px]">
                <div className="mt-3 border-t pt-3 space-y-2 pr-4">
                  {suite.tests.map((test, idx) => (
                    <div 
                      key={idx}
                      className={`p-2 rounded text-xs flex items-start justify-between ${
                        test.status === 'passed' ? 'bg-green-500/10 border border-green-500/20' : 
                        test.status === 'failed' ? 'bg-red-500/10 border border-red-500/20' : 'bg-muted border'
                      }`}
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {test.status === 'passed' ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                        ) : test.status === 'failed' ? (
                          <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{test.name}</p>
                          {test.error_message && (
                            <p className="text-red-500 mt-1 break-words text-[11px]">{test.error_message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {test.duration_ms !== undefined && (
                          <span className="text-muted-foreground">{test.duration_ms}ms</span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTestAsMarkdown(test)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { TestSuiteGrid };
export type { TestSuite, TestResult };
