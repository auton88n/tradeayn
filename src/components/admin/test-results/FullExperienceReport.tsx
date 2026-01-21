import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock } from "lucide-react";
import SimplePlatformHealth from "./SimplePlatformHealth";
import KeyInsights from "./KeyInsights";
import SimpleStatusCards from "./SimpleStatusCards";
import SuggestedActions from "./SuggestedActions";
import { useState } from "react";
import { toast } from "sonner";

interface FullExperienceReportProps {
  testPassRate?: number;
  errorRate?: number;
  avgResponseTime?: number;
  supportTickets?: number;
  coveragePercent?: number;
  lastUpdated?: Date;
}

const FullExperienceReport = ({
  testPassRate = 94,
  errorRate = 2.5,
  avgResponseTime = 1.8,
  supportTickets = 5,
  coveragePercent = 87,
  lastUpdated = new Date(),
}: FullExperienceReportProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success("Report refreshed");
  };

  return (
    <div className="space-y-6">
      {/* Header - Simplified */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Updated {lastUpdated.toLocaleTimeString()}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Health Status */}
      <SimplePlatformHealth
        testPassRate={testPassRate}
        errorRate={errorRate}
        criticalIssues={0}
      />

      {/* Key Insights - What matters */}
      <KeyInsights />

      {/* Status Cards - Expandable for details */}
      <SimpleStatusCards />

      {/* Actions - What to do */}
      <SuggestedActions />

      {/* Simple Footer */}
      <p className="text-xs text-muted-foreground text-center">
        Based on {coveragePercent}% test coverage • {testPassRate}% tests passing
      </p>
    </div>
  );
};

export default FullExperienceReport;
