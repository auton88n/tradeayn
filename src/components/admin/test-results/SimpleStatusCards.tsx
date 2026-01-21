import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Zap, 
  Calculator, 
  Globe,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  TestTube2
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

interface StatusCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: "good" | "warning" | "error";
  summary: string;
  details: string[];
}

interface SimpleStatusCardsProps {
  testResults?: TestResult[];
  testRuns?: TestRun[];
}

const getSuiteIcon = (suite: string) => {
  const lowerSuite = suite.toLowerCase();
  if (lowerSuite.includes('security') || lowerSuite.includes('auth')) {
    return <Shield className="h-5 w-5" />;
  }
  if (lowerSuite.includes('performance') || lowerSuite.includes('stress')) {
    return <Zap className="h-5 w-5" />;
  }
  if (lowerSuite.includes('engineering') || lowerSuite.includes('calculator')) {
    return <Calculator className="h-5 w-5" />;
  }
  if (lowerSuite.includes('i18n') || lowerSuite.includes('language')) {
    return <Globe className="h-5 w-5" />;
  }
  return <TestTube2 className="h-5 w-5" />;
};

const SimpleStatusCards = ({ 
  testResults = [], 
  testRuns = [] 
}: SimpleStatusCardsProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const generateCards = (): StatusCard[] => {
    if (testResults.length === 0) {
      return [
        {
          id: "no-data",
          title: "No Test Data",
          icon: <TestTube2 className="h-5 w-5" />,
          status: "warning",
          summary: "Run tests to see status",
          details: ["Use the 'Run Tests' button above to execute test suites"],
        },
      ];
    }

    // Group tests by suite
    const suiteGroups: Record<string, TestResult[]> = {};
    testResults.forEach(result => {
      const suite = result.test_suite || "Other";
      if (!suiteGroups[suite]) suiteGroups[suite] = [];
      suiteGroups[suite].push(result);
    });

    return Object.entries(suiteGroups).map(([suite, tests]) => {
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      const total = tests.length;

      // Determine status
      let status: "good" | "warning" | "error" = "good";
      if (failed > 0) status = "error";
      else if (passed < total) status = "warning";

      // Get latest test time
      const latestTest = tests.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const timeAgo = formatDistanceToNow(new Date(latestTest.created_at), { addSuffix: true });

      // Build details
      const details: string[] = [
        `${passed}/${total} tests passing`,
        `Last run: ${timeAgo}`,
      ];

      // Add failed test names
      const failedTests = tests.filter(t => t.status === 'failed');
      if (failedTests.length > 0) {
        details.push(`Failed: ${failedTests.map(t => t.test_name).slice(0, 2).join(', ')}${failedTests.length > 2 ? '...' : ''}`);
      }

      // Add passing test names (first few)
      const passingTests = tests.filter(t => t.status === 'passed');
      if (passingTests.length > 0) {
        details.push(`Tests: ${passingTests.map(t => t.test_name).slice(0, 2).join(', ')}${passingTests.length > 2 ? '...' : ''}`);
      }

      return {
        id: suite,
        title: suite.charAt(0).toUpperCase() + suite.slice(1).replace(/_/g, ' '),
        icon: getSuiteIcon(suite),
        status,
        summary: failed > 0 
          ? `${failed} failing` 
          : passed === total 
            ? "All passing" 
            : `${passed}/${total} passing`,
        details,
      };
    });
  };

  const cards = generateCards();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return { bg: "bg-green-500/10", border: "border-green-500/20", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> };
      case "warning":
        return { bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: <AlertCircle className="h-4 w-4 text-yellow-500" /> };
      case "error":
        return { bg: "bg-red-500/10", border: "border-red-500/20", icon: <AlertCircle className="h-4 w-4 text-red-500" /> };
      default:
        return { bg: "bg-muted", border: "border-border", icon: <CheckCircle2 className="h-4 w-4" /> };
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) => {
        const statusStyle = getStatusColor(card.status);
        const isExpanded = expandedId === card.id;

        return (
          <Card 
            key={card.id}
            className={`${statusStyle.bg} ${statusStyle.border} border cursor-pointer transition-all hover:shadow-md`}
            onClick={() => setExpandedId(isExpanded ? null : card.id)}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-primary">{card.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{card.title}</span>
                      {statusStyle.icon}
                    </div>
                    <p className="text-xs text-muted-foreground">{card.summary}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              
              <AnimatePresence>
                {isExpanded && card.details.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-3 pt-3 border-t border-border/50 space-y-1">
                      {card.details.map((detail, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SimpleStatusCards;
