import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Play,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useTestExport } from '@/hooks/useTestExport';
import { TestReportPDF } from './TestReportPDF';
import { BugReportCard } from './BugReportCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration_ms?: number;
  error_message?: string | null;
}

interface BugReport {
  endpoint: string;
  bugType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedFix: string;
}

interface DetailedTestCardProps {
  title: string;
  icon: React.ReactNode;
  tests?: TestResult[];
  bugs?: BugReport[];
  grade?: string;
  lastRun?: Date;
  isLoading?: boolean;
  onRun?: () => void;
}

type FilterType = 'all' | 'passed' | 'failed' | 'skipped';

export function DetailedTestCard({
  title,
  icon,
  tests = [],
  bugs = [],
  grade,
  lastRun,
  isLoading = false,
  onRun
}: DetailedTestCardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const { copyAllTests, copyAllBugs, copyTestAsMarkdown } = useTestExport();

  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const passRate = tests.length > 0 ? (passed / tests.length) * 100 : 0;

  // Filter tests
  const filteredTests = tests.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.error_message?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filter === 'all' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Filter bugs by search
  const filteredBugs = bugs.filter(b => 
    b.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bugType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500 text-white';
    if (grade.startsWith('B')) return 'bg-blue-500 text-white';
    if (grade.startsWith('C')) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  const hasContent = tests.length > 0 || bugs.length > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {grade && (
              <Badge className={getGradeColor(grade)}>{grade}</Badge>
            )}
            {tests.length > 0 && (
              <Badge variant={passRate >= 90 ? 'default' : passRate >= 70 ? 'secondary' : 'destructive'}>
                {passRate.toFixed(0)}%
              </Badge>
            )}
            {bugs.length > 0 && (
              <Badge variant="destructive">{bugs.length} bugs</Badge>
            )}
          </div>
        </div>
        
        {/* Summary row */}
        {tests.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {passed} passed
            </span>
            {failed > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="h-3 w-3" />
                {failed} failed
              </span>
            )}
            {lastRun && (
              <span className="ml-auto">
                Last run: {lastRun.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {onRun && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRun}
              disabled={isLoading}
              className="h-7"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              Run
            </Button>
          )}
          
          {tests.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyAllTests(tests, title)}
              className="h-7 px-2"
            >
              <Copy className="h-3 w-3" />
              <span className="ml-1 hidden sm:inline">Copy All</span>
            </Button>
          )}
          
          {bugs.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyAllBugs(bugs, title)}
              className="h-7 px-2"
            >
              <Copy className="h-3 w-3" />
              <span className="ml-1 hidden sm:inline">Copy All</span>
            </Button>
          )}

          <TestReportPDF
            categoryName={title}
            tests={tests}
            bugs={bugs}
            grade={grade}
            passRate={passRate}
            lastRun={lastRun}
          />
        </div>

        {/* Search and filter */}
        {hasContent && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search tests or bugs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-7 text-xs"
              />
            </div>
            
            {tests.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <Filter className="h-3 w-3 mr-1" />
                    {filter === 'all' ? 'All' : filter}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilter('all')}>
                    All ({tests.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('passed')}>
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Passed ({passed})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('failed')}>
                    <XCircle className="h-3 w-3 mr-1 text-red-500" />
                    Failed ({failed})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Test results list */}
        {filteredTests.length > 0 && (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {filteredTests.map((test, idx) => (
                <div 
                  key={idx}
                  className={`p-2 rounded-lg border text-xs flex items-start justify-between ${
                    test.status === 'passed' ? 'border-green-500/30 bg-green-500/5' : 
                    test.status === 'failed' ? 'border-red-500/30 bg-red-500/5' : 
                    'border-yellow-500/30 bg-yellow-500/5'
                  }`}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {test.status === 'passed' ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                    ) : test.status === 'failed' ? (
                      <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{test.name}</p>
                      {test.error_message && (
                        <p className="text-red-600 mt-1 break-words text-[11px]">{test.error_message}</p>
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

        {/* Bugs list */}
        {filteredBugs.length > 0 && (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {filteredBugs.map((bug, idx) => (
                <BugReportCard key={idx} bug={bug} />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Empty state */}
        {!hasContent && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No tests run yet</p>
            {onRun && (
              <Button onClick={onRun} className="mt-3" size="sm">
                <Play className="h-3 w-3 mr-1" /> Run Tests
              </Button>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Running tests...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DetailedTestCard;
