import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface SimplePlatformHealthProps {
  testPassRate?: number;
  errorRate?: number;
  criticalIssues?: number;
  totalTests?: number;
  hasRealData?: boolean;
}

const SimplePlatformHealth = ({
  testPassRate = 0,
  errorRate = 0,
  criticalIssues = 0,
  totalTests = 0,
  hasRealData = false,
}: SimplePlatformHealthProps) => {
  const getStatus = () => {
    // No data state
    if (!hasRealData || totalTests === 0) {
      return {
        status: "NO DATA",
        color: "text-muted-foreground",
        bgColor: "bg-muted/50 border-border",
        icon: <HelpCircle className="h-8 w-8 text-muted-foreground" />,
        message: "Run tests to see your platform health status",
      };
    }

    // Has critical issues
    if (criticalIssues > 0 || testPassRate < 70) {
      return {
        status: "NEEDS ATTENTION",
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20",
        icon: <XCircle className="h-8 w-8 text-red-500" />,
        message: `${criticalIssues} failing test${criticalIssues !== 1 ? 's' : ''} detected • ${testPassRate.toFixed(1)}% pass rate`,
      };
    }

    // Warnings
    if (testPassRate < 90 || errorRate > 5) {
      return {
        status: "GOOD",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10 border-yellow-500/20",
        icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
        message: `${testPassRate.toFixed(1)}% pass rate • ${totalTests} tests analyzed`,
      };
    }

    // All good
    return {
      status: "EXCELLENT",
      color: "text-green-500",
      bgColor: "bg-green-500/10 border-green-500/20",
      icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
      message: `${testPassRate.toFixed(1)}% pass rate • ${totalTests} tests passing`,
    };
  };

  const statusInfo = getStatus();

  return (
    <Card className={`${statusInfo.bgColor} border`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {statusInfo.icon}
          <div>
            <h2 className={`text-2xl font-bold ${statusInfo.color}`}>
              Platform Health: {statusInfo.status}
            </h2>
            <p className="text-muted-foreground mt-1">
              {statusInfo.message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimplePlatformHealth;
