import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Zap, 
  TestTube, 
  Shield, 
  Route, 
  ChevronDown,
  Loader2
} from 'lucide-react';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCount: number;
  estimatedTime: string;
  icon: React.ReactNode;
}

const TEST_SUITES: TestSuite[] = [
  {
    id: 'quick',
    name: 'Quick Tests',
    description: 'Fast smoke tests from each category',
    testCount: 5,
    estimatedTime: '~10s',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: 'api',
    name: 'API Health',
    description: 'Test all edge function endpoints',
    testCount: 5,
    estimatedTime: '~15s',
    icon: <TestTube className="h-4 w-4" />,
  },
  {
    id: 'database',
    name: 'Database Tests',
    description: 'Query all tables, CRUD operations',
    testCount: 10,
    estimatedTime: '~20s',
    icon: <TestTube className="h-4 w-4" />,
  },
  {
    id: 'calculator',
    name: 'Calculator Tests',
    description: 'Engineering calculations validation',
    testCount: 4,
    estimatedTime: '~15s',
    icon: <TestTube className="h-4 w-4" />,
  },
  {
    id: 'security',
    name: 'Security Tests',
    description: 'XSS, SQL injection, auth checks',
    testCount: 3,
    estimatedTime: '~10s',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: 'performance',
    name: 'Performance Tests',
    description: 'Response times, load handling',
    testCount: 2,
    estimatedTime: '~30s',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: 'full',
    name: 'Full Integration Suite',
    description: 'All real integration tests',
    testCount: 29,
    estimatedTime: '~2min',
    icon: <Route className="h-4 w-4" />,
  },
];

interface TestSuiteSelectorProps {
  isRunning: boolean;
  onRunSuite: (suiteId: string) => void;
}

const TestSuiteSelector: React.FC<TestSuiteSelectorProps> = ({ isRunning, onRunSuite }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isRunning} className="bg-primary">
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Tests
              <ChevronDown className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Select Test Suite</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TEST_SUITES.map((suite) => (
          <DropdownMenuItem 
            key={suite.id}
            onClick={() => onRunSuite(suite.id)}
            className="flex flex-col items-start gap-1 py-3 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {suite.icon}
                <span className="font-medium">{suite.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {suite.testCount}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {suite.estimatedTime}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pl-6">{suite.description}</p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TestSuiteSelector;
