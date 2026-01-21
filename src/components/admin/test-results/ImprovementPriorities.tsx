import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ArrowUp, ArrowRight, ArrowDown, Lightbulb } from "lucide-react";
import { useState } from "react";

interface Improvement {
  id: string;
  priority: "high" | "medium" | "low";
  issue: string;
  impact: string;
  recommendation: string;
  completed: boolean;
  category: string;
}

interface ImprovementPrioritiesProps {
  improvements?: Improvement[];
}

const defaultImprovements: Improvement[] = [
  {
    id: "1",
    priority: "high",
    issue: "Network resilience tests show 5% failure rate",
    impact: "Users on slow connections may experience dropouts and lost messages",
    recommendation: "Implement retry logic with exponential backoff for API calls",
    completed: false,
    category: "Reliability",
  },
  {
    id: "2",
    priority: "high",
    issue: "Rate limiting can lock out legitimate users",
    impact: "Power users may get blocked during heavy usage sessions",
    recommendation: "Add user-friendly rate limit warnings before blocking",
    completed: false,
    category: "UX",
  },
  {
    id: "3",
    priority: "medium",
    issue: "Mobile tests have lower pass rate (85%)",
    impact: "Mobile users may experience layout glitches and touch issues",
    recommendation: "Review and fix mobile-specific CSS and touch targets",
    completed: false,
    category: "Mobile",
  },
  {
    id: "4",
    priority: "medium",
    issue: "Arabic translation completeness at 90%",
    impact: "Some Arabic users see English fallbacks in UI",
    recommendation: "Complete remaining Arabic translations in settings and admin",
    completed: false,
    category: "i18n",
  },
  {
    id: "5",
    priority: "medium",
    issue: "Engineering calculations lack input validation hints",
    impact: "Users may enter invalid values and get confusing errors",
    recommendation: "Add inline validation with helpful error messages",
    completed: false,
    category: "Engineering",
  },
  {
    id: "6",
    priority: "low",
    issue: "Chart components not fully accessible",
    impact: "Screen reader users can't interpret 3D visualizations",
    recommendation: "Add ARIA labels and text alternatives for charts",
    completed: false,
    category: "Accessibility",
  },
  {
    id: "7",
    priority: "low",
    issue: "Loading states missing on some pages",
    impact: "Users may think the app is frozen during data fetching",
    recommendation: "Add skeleton loaders to engineering calculators",
    completed: true,
    category: "UX",
  },
  {
    id: "8",
    priority: "low",
    issue: "Session timeout gives no warning",
    impact: "Users lose unsaved work when session expires",
    recommendation: "Add 5-minute warning before session timeout",
    completed: true,
    category: "Auth",
  },
];

const ImprovementPriorities = ({ improvements = defaultImprovements }: ImprovementPrioritiesProps) => {
  const [items, setItems] = useState(improvements);

  const toggleCompleted = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case "high":
        return { icon: <ArrowUp className="h-3 w-3" />, color: "bg-red-500/10 text-red-600 border-red-500/20", label: "High" };
      case "medium":
        return { icon: <ArrowRight className="h-3 w-3" />, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Medium" };
      case "low":
        return { icon: <ArrowDown className="h-3 w-3" />, color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Low" };
      default:
        return { icon: <ArrowRight className="h-3 w-3" />, color: "bg-gray-500/10 text-gray-600 border-gray-500/20", label: "Unknown" };
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const stats = {
    total: items.length,
    completed: items.filter(i => i.completed).length,
    high: items.filter(i => i.priority === "high" && !i.completed).length,
    medium: items.filter(i => i.priority === "medium" && !i.completed).length,
    low: items.filter(i => i.priority === "low" && !i.completed).length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            Areas Needing Improvement
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{stats.completed}/{stats.total} completed</span>
            {stats.high > 0 && <Badge variant="destructive" className="text-xs">{stats.high} High</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedItems.map((item) => {
            const priorityInfo = getPriorityInfo(item.priority);
            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all ${
                  item.completed ? "bg-muted/50 opacity-60" : "bg-card hover:bg-accent/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleCompleted(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className={`text-xs ${priorityInfo.color}`}>
                        {priorityInfo.icon}
                        <span className="ml-1">{priorityInfo.label}</span>
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <p className={`text-sm font-medium ${item.completed ? "line-through" : ""}`}>
                      {item.issue}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-orange-600">Impact:</span> {item.impact}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-green-600">Fix:</span> {item.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovementPriorities;
