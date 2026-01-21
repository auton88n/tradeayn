import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  MessageSquare, 
  Calculator, 
  Zap, 
  Globe, 
  Users,
  Lock,
  Accessibility,
  CheckCircle2,
  AlertCircle,
  XCircle
} from "lucide-react";

interface TestCategory {
  name: string;
  icon: React.ReactNode;
  status: "excellent" | "good" | "needs-work" | "critical";
  tested: string;
  found: string;
  impact: string;
  passRate: number;
}

interface TestInsightsSectionProps {
  categories?: TestCategory[];
}

const defaultCategories: TestCategory[] = [
  {
    name: "Authentication",
    icon: <Lock className="h-4 w-4" />,
    status: "excellent",
    tested: "Login, signup, password reset, session management, and OAuth flows",
    found: "All 19 authentication tests passed - users have a smooth login experience",
    impact: "No friction expected during account access",
    passRate: 100,
  },
  {
    name: "Security",
    icon: <Shield className="h-4 w-4" />,
    status: "excellent",
    tested: "XSS prevention, CSRF protection, input sanitization, and data encryption",
    found: "Security tests show strong protection - user data is well protected",
    impact: "Users can trust the platform with sensitive information",
    passRate: 100,
  },
  {
    name: "Chat & AI",
    icon: <MessageSquare className="h-4 w-4" />,
    status: "good",
    tested: "Message sending, AI responses, file uploads, and conversation history",
    found: "25 of 28 tests passed - occasional slow responses under heavy load",
    impact: "Most users will have smooth AI interactions, rare delays possible",
    passRate: 89,
  },
  {
    name: "Engineering Tools",
    icon: <Calculator className="h-4 w-4" />,
    status: "good",
    tested: "Beam, column, foundation, slab calculators and 3D visualizations",
    found: "42 of 45 tests passed - some edge cases in complex calculations",
    impact: "Professional engineers can rely on calculations, minor edge cases exist",
    passRate: 93,
  },
  {
    name: "Performance",
    icon: <Zap className="h-4 w-4" />,
    status: "good",
    tested: "Page load times, stress tests, concurrent users, and memory usage",
    found: "Platform handles 100+ concurrent users - response times stay under 2s",
    impact: "Users experience consistent speed even during peak usage",
    passRate: 91,
  },
  {
    name: "Internationalization",
    icon: <Globe className="h-4 w-4" />,
    status: "needs-work",
    tested: "Arabic/English translations, RTL layouts, and language switching",
    found: "85% translation coverage - some UI elements need Arabic text",
    impact: "Arabic users may see some English fallback text",
    passRate: 85,
  },
  {
    name: "Accessibility",
    icon: <Accessibility className="h-4 w-4" />,
    status: "good",
    tested: "Screen reader compatibility, keyboard navigation, and color contrast",
    found: "Core flows are accessible - minor improvements needed for charts",
    impact: "Users with disabilities can navigate main features effectively",
    passRate: 88,
  },
  {
    name: "User Journeys",
    icon: <Users className="h-4 w-4" />,
    status: "excellent",
    tested: "Complete user flows from landing to feature usage and support",
    found: "All critical user paths work smoothly with proper feedback",
    impact: "New users can onboard and use features without confusion",
    passRate: 96,
  },
];

export const TestInsightsSection = ({ categories = defaultCategories }: TestInsightsSectionProps) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "excellent":
        return { emoji: "🌟", color: "bg-green-500", badge: "default" as const, icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> };
      case "good":
        return { emoji: "✅", color: "bg-blue-500", badge: "secondary" as const, icon: <CheckCircle2 className="h-4 w-4 text-blue-500" /> };
      case "needs-work":
        return { emoji: "⚠️", color: "bg-yellow-500", badge: "outline" as const, icon: <AlertCircle className="h-4 w-4 text-yellow-500" /> };
      case "critical":
        return { emoji: "🚨", color: "bg-red-500", badge: "destructive" as const, icon: <XCircle className="h-4 w-4 text-red-500" /> };
      default:
        return { emoji: "❓", color: "bg-gray-500", badge: "outline" as const, icon: <AlertCircle className="h-4 w-4" /> };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          How Things Look in Tests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category) => {
            const statusInfo = getStatusInfo(category.status);
            return (
              <div
                key={category.name}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                    <span>{statusInfo.emoji}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusInfo.badge} className="text-xs">
                      {category.passRate}% passed
                    </Badge>
                    {statusInfo.icon}
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><span className="font-medium text-foreground">Tested:</span> {category.tested}</p>
                  <p><span className="font-medium text-foreground">Found:</span> {category.found}</p>
                  <p><span className="font-medium text-foreground">User Impact:</span> {category.impact}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
