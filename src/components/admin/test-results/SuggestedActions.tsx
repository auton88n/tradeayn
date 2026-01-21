import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Lightbulb } from "lucide-react";
import { useState } from "react";

interface Action {
  id: string;
  text: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
}

interface SuggestedActionsProps {
  actions?: Action[];
}

const defaultActions: Action[] = [
  {
    id: "1",
    text: "Complete Arabic translations for settings and admin pages",
    priority: "low",
    completed: false,
  },
  {
    id: "2",
    text: "Add retry logic for users on slow connections",
    priority: "medium",
    completed: false,
  },
  {
    id: "3",
    text: "Review mobile layout on smaller screens",
    priority: "low",
    completed: true,
  },
];

const SuggestedActions = ({ actions = defaultActions }: SuggestedActionsProps) => {
  const [items, setItems] = useState(actions);

  const toggleCompleted = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-xs">Soon</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">When possible</Badge>;
    }
  };

  const pendingItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed);

  if (pendingItems.length === 0 && completedItems.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            ✨ No actions needed right now. Everything looks great!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          Suggested Actions
          {pendingItems.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {pendingItems.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pendingItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleCompleted(item.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{item.text}</p>
              </div>
              {getPriorityBadge(item.priority)}
            </div>
          ))}
          
          {completedItems.length > 0 && (
            <div className="pt-2 mt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Completed</p>
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-2 opacity-60"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleCompleted(item.id)}
                    className="mt-0.5"
                  />
                  <p className="text-sm line-through">{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestedActions;
