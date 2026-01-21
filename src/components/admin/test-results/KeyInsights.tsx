import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface Insight {
  type: "success" | "warning" | "info";
  message: string;
}

interface KeyInsightsProps {
  insights?: Insight[];
}

const defaultInsights: Insight[] = [
  { type: "success", message: "All security and login features are working perfectly" },
  { type: "success", message: "Engineering calculators are functioning correctly" },
  { type: "warning", message: "Arabic translations are 85% complete - some users may see English text" },
  { type: "info", message: "Platform handles 100+ users smoothly" },
];

const KeyInsights = ({ insights = defaultInsights }: KeyInsightsProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">What You Need to Know</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              {getIcon(insight.type)}
              <span className="text-muted-foreground">{insight.message}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default KeyInsights;
