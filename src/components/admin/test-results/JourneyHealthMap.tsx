import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  ArrowDown,
  MapPin,
  Home,
  LogIn,
  MessageSquare,
  Calculator,
  Settings,
  HelpCircle
} from "lucide-react";

interface JourneyStep {
  name: string;
  icon: React.ReactNode;
  status: "excellent" | "good" | "warning" | "critical";
  passRate: number;
  avgResponseTime: string;
  dropOffRate?: number;
}

interface JourneyHealthMapProps {
  steps?: JourneyStep[];
}

const defaultSteps: JourneyStep[] = [
  {
    name: "Landing Page",
    icon: <Home className="h-5 w-5" />,
    status: "excellent",
    passRate: 100,
    avgResponseTime: "0.8s",
    dropOffRate: 35,
  },
  {
    name: "Sign Up / Login",
    icon: <LogIn className="h-5 w-5" />,
    status: "excellent",
    passRate: 100,
    avgResponseTime: "1.2s",
    dropOffRate: 12,
  },
  {
    name: "Dashboard Chat",
    icon: <MessageSquare className="h-5 w-5" />,
    status: "good",
    passRate: 89,
    avgResponseTime: "2.1s",
    dropOffRate: 8,
  },
  {
    name: "Engineering Tools",
    icon: <Calculator className="h-5 w-5" />,
    status: "good",
    passRate: 93,
    avgResponseTime: "1.8s",
    dropOffRate: 15,
  },
  {
    name: "Settings / Profile",
    icon: <Settings className="h-5 w-5" />,
    status: "excellent",
    passRate: 98,
    avgResponseTime: "0.9s",
    dropOffRate: 5,
  },
  {
    name: "Support",
    icon: <HelpCircle className="h-5 w-5" />,
    status: "excellent",
    passRate: 96,
    avgResponseTime: "1.1s",
  },
];

export const JourneyHealthMap = ({ steps = defaultSteps }: JourneyHealthMapProps) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "excellent":
        return { 
          color: "border-green-500 bg-green-500/10", 
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          label: "Excellent"
        };
      case "good":
        return { 
          color: "border-blue-500 bg-blue-500/10", 
          icon: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
          label: "Good"
        };
      case "warning":
        return { 
          color: "border-yellow-500 bg-yellow-500/10", 
          icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
          label: "Warning"
        };
      case "critical":
        return { 
          color: "border-red-500 bg-red-500/10", 
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          label: "Critical"
        };
      default:
        return { 
          color: "border-gray-500 bg-gray-500/10", 
          icon: <AlertCircle className="h-4 w-4 text-gray-500" />,
          label: "Unknown"
        };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          User Journey Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {steps.map((step, index) => {
            const statusInfo = getStatusInfo(step.status);
            return (
              <div key={step.name} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-14 w-0.5 h-8 bg-border" />
                )}
                
                {/* Step Card */}
                <div className={`flex items-center gap-4 p-3 rounded-lg border-2 ${statusInfo.color} mb-2`}>
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background border-2 border-current flex items-center justify-center text-primary">
                    {step.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{step.name}</span>
                      {statusInfo.icon}
                      <Badge variant="outline" className="text-xs ml-auto">
                        {step.passRate}% pass
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>⚡ {step.avgResponseTime}</span>
                      {step.dropOffRate !== undefined && (
                        <span className={step.dropOffRate > 20 ? "text-orange-500" : ""}>
                          📉 {step.dropOffRate}% drop-off
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
          <div className="font-medium mb-1">Journey Summary</div>
          <p className="text-muted-foreground text-xs">
            Users flow smoothly from landing to feature usage. Main drop-off points are at landing 
            (35% - expected for new visitors) and engineering tools (15% - users exploring before committing).
            All critical paths have 89%+ test pass rates.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
