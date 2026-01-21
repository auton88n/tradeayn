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
    description: 'AI-generated scenario tests',
    testCount: 8,
    estimatedTime: '~30s',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: 'auth',
    name: 'Authentication Suite',
    description: 'Login, signup, password reset',
    testCount: 19,
    estimatedTime: '~2min',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: 'security',
    name: 'Security Suite',
    description: 'XSS, SQL injection, data protection',
    testCount: 30,
    estimatedTime: '~3min',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: 'stress',
    name: 'Stress Tests',
    description: 'Load, concurrency, memory tests',
    testCount: 35,
    estimatedTime: '~5min',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: 'journeys',
    name: 'User Journeys',
    description: 'End-to-end user flows',
    testCount: 19,
    estimatedTime: '~4min',
    icon: <Route className="h-4 w-4" />,
  },
  {
    id: 'full',
    name: 'Full E2E Suite',
    description: 'All 300+ Playwright tests',
    testCount: 300,
    estimatedTime: '~15min',
    icon: <TestTube className="h-4 w-4" />,
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
