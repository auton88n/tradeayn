import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

interface ExperienceScoreCardProps {
  testPassRate: number;
  errorRate: number;
  avgResponseTime: number;
  supportTickets: number;
  coveragePercent: number;
}

const ExperienceScoreCard = ({
  testPassRate = 95,
  errorRate = 2,
  avgResponseTime = 1.5,
  supportTickets = 3,
  coveragePercent = 85,
}: ExperienceScoreCardProps) => {
  // Calculate weighted experience score
  const calculateScore = () => {
    const testScore = testPassRate * 0.30;
    const errorScore = (100 - Math.min(errorRate * 10, 100)) * 0.25;
    const responseScore = Math.max(0, (5 - avgResponseTime) / 5 * 100) * 0.20;
    const supportScore = Math.max(0, (20 - supportTickets) / 20 * 100) * 0.15;
    const coverageScore = coveragePercent * 0.10;
    return Math.round(testScore + errorScore + responseScore + supportScore + coverageScore);
  };

  const score = calculateScore();
  
  const getScoreColor = () => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreLabel = () => {
    if (score >= 85) return { label: "Excellent", emoji: "🌟", description: "Your platform is performing exceptionally well" };
    if (score >= 70) return { label: "Good", emoji: "✅", description: "Platform is healthy with minor areas to improve" };
    if (score >= 50) return { label: "Needs Attention", emoji: "⚠️", description: "Several areas require improvement" };
    return { label: "Critical", emoji: "🚨", description: "Immediate action required on multiple fronts" };
  };

  const scoreInfo = getScoreLabel();

  const factors = [
    { name: "Test Pass Rate", value: testPassRate, weight: "30%", trend: testPassRate > 90 ? "up" : testPassRate > 75 ? "stable" : "down" },
    { name: "Error Rate", value: 100 - Math.min(errorRate * 10, 100), weight: "25%", trend: errorRate < 5 ? "up" : errorRate < 15 ? "stable" : "down" },
    { name: "Response Time", value: Math.round(Math.max(0, (5 - avgResponseTime) / 5 * 100)), weight: "20%", trend: avgResponseTime < 2 ? "up" : avgResponseTime < 4 ? "stable" : "down" },
    { name: "Support Volume", value: Math.round(Math.max(0, (20 - supportTickets) / 20 * 100)), weight: "15%", trend: supportTickets < 5 ? "up" : supportTickets < 15 ? "stable" : "down" },
    { name: "Test Coverage", value: coveragePercent, weight: "10%", trend: coveragePercent > 80 ? "up" : coveragePercent > 60 ? "stable" : "down" },
  ];

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Experience Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Main Score */}
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor()}`}>
              {score}
            </div>
            <div className="text-sm text-muted-foreground mt-1">out of 100</div>
          </div>

          {/* Score Label */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{scoreInfo.emoji}</span>
              <Badge variant={score >= 70 ? "default" : "destructive"} className="text-sm">
                {scoreInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{scoreInfo.description}</p>
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">Score Breakdown</div>
          {factors.map((factor) => (
            <div key={factor.name} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-muted-foreground">{factor.name}</span>
              <Progress value={factor.value} className="h-1.5 flex-1" />
              <span className="w-8 text-right">{factor.value}%</span>
              <span className="w-8 text-muted-foreground">{factor.weight}</span>
              <TrendIcon trend={factor.trend} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceScoreCard;
