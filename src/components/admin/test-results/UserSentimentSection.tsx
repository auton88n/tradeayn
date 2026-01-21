import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, AlertTriangle, HeadphonesIcon, Rocket, Smile, Meh, Frown } from "lucide-react";

interface SentimentMetric {
  metric: string;
  value: string;
  feeling: "positive" | "neutral" | "negative";
  interpretation: string;
  icon: React.ReactNode;
}

interface UserSentimentSectionProps {
  avgLoadSpeed?: number;
  errorRate?: number;
  supportTicketsThisWeek?: number;
  featureAdoptionRate?: number;
}

const UserSentimentSection = ({
  avgLoadSpeed = 1.2,
  errorRate = 0.5,
  supportTicketsThisWeek = 3,
  featureAdoptionRate = 78,
}: UserSentimentSectionProps) => {
  const getSentimentIcon = (feeling: string) => {
    if (feeling === "positive") return <Smile className="h-5 w-5 text-green-500" />;
    if (feeling === "negative") return <Frown className="h-5 w-5 text-red-500" />;
    return <Meh className="h-5 w-5 text-yellow-500" />;
  };

  const metrics: SentimentMetric[] = [
    {
      metric: "Load Speed",
      value: avgLoadSpeed < 1.5 ? "Fast" : avgLoadSpeed < 3 ? "Normal" : "Slow",
      feeling: avgLoadSpeed < 1.5 ? "positive" : avgLoadSpeed < 3 ? "neutral" : "negative",
      interpretation: `Users experience ${avgLoadSpeed < 1.5 ? "fast" : avgLoadSpeed < 3 ? "acceptable" : "slow"} page loads (avg ${avgLoadSpeed}s)`,
      icon: <Zap className="h-5 w-5" />,
    },
    {
      metric: "Error Encounters",
      value: errorRate < 2 ? "Low" : errorRate < 10 ? "Medium" : "High",
      feeling: errorRate < 2 ? "positive" : errorRate < 10 ? "neutral" : "negative",
      interpretation: `${errorRate < 2 ? "Very few" : errorRate < 10 ? "Some" : "Many"} users see errors (${errorRate}% error rate)`,
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      metric: "Support Requests",
      value: supportTicketsThisWeek < 5 ? "Low" : supportTicketsThisWeek < 15 ? "Medium" : "High",
      feeling: supportTicketsThisWeek < 5 ? "positive" : supportTicketsThisWeek < 15 ? "neutral" : "negative",
      interpretation: `Users ${supportTicketsThisWeek < 5 ? "rarely" : supportTicketsThisWeek < 15 ? "occasionally" : "frequently"} need help (${supportTicketsThisWeek} tickets this week)`,
      icon: <HeadphonesIcon className="h-5 w-5" />,
    },
    {
      metric: "Feature Adoption",
      value: featureAdoptionRate > 70 ? "High" : featureAdoptionRate > 40 ? "Medium" : "Low",
      feeling: featureAdoptionRate > 70 ? "positive" : featureAdoptionRate > 40 ? "neutral" : "negative",
      interpretation: `Users ${featureAdoptionRate > 70 ? "actively explore" : featureAdoptionRate > 40 ? "moderately use" : "rarely discover"} features (${featureAdoptionRate}% adoption)`,
      icon: <Rocket className="h-5 w-5" />,
    },
  ];

  const getBgColor = (feeling: string) => {
    if (feeling === "positive") return "bg-green-500/10 border-green-500/20";
    if (feeling === "negative") return "bg-red-500/10 border-red-500/20";
    return "bg-yellow-500/10 border-yellow-500/20";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Smile className="h-5 w-5 text-primary" />
          How Users Feel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map((item) => (
            <div
              key={item.metric}
              className={`p-3 rounded-lg border ${getBgColor(item.feeling)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.icon}</span>
                  <span className="font-medium text-sm">{item.metric}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">{item.value}</span>
                  {getSentimentIcon(item.feeling)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{item.interpretation}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSentimentSection;
