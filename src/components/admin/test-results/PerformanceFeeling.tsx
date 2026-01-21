import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Zap, MessageSquare, Upload, Calculator } from "lucide-react";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  thresholds: { fast: number; normal: number };
}

interface PerformanceFeelingProps {
  pageLoad?: number;
  aiResponse?: number;
  fileUpload?: number;
  calculation?: number;
}

export const PerformanceFeeling = ({
  pageLoad = 1.2,
  aiResponse = 2.5,
  fileUpload = 3.1,
  calculation = 0.8,
}: PerformanceFeelingProps) => {
  const metrics: PerformanceMetric[] = [
    { 
      name: "Page Load", 
      value: pageLoad, 
      unit: "s", 
      icon: <Zap className="h-5 w-5" />,
      thresholds: { fast: 1.5, normal: 3 }
    },
    { 
      name: "AI Response", 
      value: aiResponse, 
      unit: "s", 
      icon: <MessageSquare className="h-5 w-5" />,
      thresholds: { fast: 2, normal: 5 }
    },
    { 
      name: "File Upload", 
      value: fileUpload, 
      unit: "s", 
      icon: <Upload className="h-5 w-5" />,
      thresholds: { fast: 2, normal: 5 }
    },
    { 
      name: "Calculation", 
      value: calculation, 
      unit: "s", 
      icon: <Calculator className="h-5 w-5" />,
      thresholds: { fast: 1, normal: 3 }
    },
  ];

  const getFeeling = (value: number, thresholds: { fast: number; normal: number }) => {
    if (value <= thresholds.fast) {
      return { 
        label: "Snappy", 
        description: "Users won't wait", 
        color: "text-green-500",
        bgColor: "bg-green-500",
        percentage: 100
      };
    }
    if (value <= thresholds.normal) {
      return { 
        label: "Acceptable", 
        description: "Users stay engaged", 
        color: "text-yellow-500",
        bgColor: "bg-yellow-500",
        percentage: 60
      };
    }
    return { 
      label: "Slow", 
      description: "Users may get frustrated", 
      color: "text-red-500",
      bgColor: "bg-red-500",
      percentage: 30
    };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="h-5 w-5 text-primary" />
          Performance Feeling
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {metrics.map((metric) => {
            const feeling = getFeeling(metric.value, metric.thresholds);
            return (
              <div
                key={metric.name}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{metric.icon}</span>
                    <span className="font-medium text-sm">{metric.name}</span>
                  </div>
                  <span className="text-lg font-bold">{metric.value}{metric.unit}</span>
                </div>

                {/* Gauge visualization */}
                <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
                  <div 
                    className={`absolute left-0 top-0 h-full ${feeling.bgColor} transition-all duration-500`}
                    style={{ width: `${feeling.percentage}%` }}
                  />
                  {/* Threshold markers */}
                  <div 
                    className="absolute top-0 h-full w-0.5 bg-green-700"
                    style={{ left: `${(metric.thresholds.fast / (metric.thresholds.normal * 1.5)) * 100}%` }}
                  />
                  <div 
                    className="absolute top-0 h-full w-0.5 bg-yellow-700"
                    style={{ left: `${(metric.thresholds.normal / (metric.thresholds.normal * 1.5)) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${feeling.color}`}>{feeling.label}</span>
                  <span className="text-muted-foreground">{feeling.description}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Fast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Slow</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
