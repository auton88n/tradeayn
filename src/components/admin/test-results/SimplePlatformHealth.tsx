import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface SimplePlatformHealthProps {
  testPassRate?: number;
  errorRate?: number;
  criticalIssues?: number;
}

const SimplePlatformHealth = ({
  testPassRate = 94,
  errorRate = 2.5,
  criticalIssues = 0,
}: SimplePlatformHealthProps) => {
  // Simple logic: GOOD if pass rate > 90 and no critical issues
  const getStatus = () => {
    if (criticalIssues > 0 || testPassRate < 70) {
      return {
        status: "NEEDS ATTENTION",
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20",
        icon: <XCircle className="h-8 w-8 text-red-500" />,
        message: `${criticalIssues} critical issue${criticalIssues !== 1 ? 's' : ''} found that need your attention.`,
      };
    }
    if (testPassRate < 90 || errorRate > 5) {
      return {
        status: "GOOD",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10 border-yellow-500/20",
        icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
        message: "Everything is working, but there are some minor issues to review.",
      };
    }
    return {
      status: "EXCELLENT",
      color: "text-green-500",
      bgColor: "bg-green-500/10 border-green-500/20",
      icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
      message: "Everything is working well. No urgent issues detected.",
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
