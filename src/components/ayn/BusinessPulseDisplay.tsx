import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BusinessPulse } from '@/types/ayn-response';
import { cn } from '@/lib/utils';

interface BusinessPulseDisplayProps {
  pulse: BusinessPulse;
  className?: string;
}

export const BusinessPulseDisplay: React.FC<BusinessPulseDisplayProps> = ({ 
  pulse, 
  className 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (score >= 50) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const categories = [
    { key: 'pricing', label: 'Pricing', icon: '💰' },
    { key: 'marketing', label: 'Marketing', icon: '📈' },
    { key: 'operations', label: 'Operations', icon: '⚙️' },
    { key: 'finance', label: 'Finance', icon: '💹' },
    { key: 'strategy', label: 'Strategy', icon: '🎯' }
  ];

  return (
    <div className={cn("business-pulse-display bg-card rounded-lg border p-6", className)}>
      {/* Overall Score */}
      <div className="text-center mb-6">
        <div className="pulse-ring relative inline-flex items-center justify-center">
          <div className={cn(
            "w-20 h-20 rounded-full border-4 flex items-center justify-center font-bold text-2xl",
            pulse.overallScore >= 80 && "border-green-500 bg-green-500/10",
            pulse.overallScore >= 60 && pulse.overallScore < 80 && "border-yellow-500 bg-yellow-500/10",
            pulse.overallScore >= 40 && pulse.overallScore < 60 && "border-orange-500 bg-orange-500/10",
            pulse.overallScore < 40 && "border-red-500 bg-red-500/10"
          )}>
            <span className={getScoreColor(pulse.overallScore)}>
              {pulse.overallScore}
            </span>
          </div>
          <div className="absolute -inset-2 rounded-full border border-primary/20 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold mt-3 mb-1">Business Health Score</h3>
        <p className="text-sm text-muted-foreground">
          {pulse.overallScore >= 80 && "Excellent - Business performing well"}
          {pulse.overallScore >= 60 && pulse.overallScore < 80 && "Good - Some areas need attention"}
          {pulse.overallScore >= 40 && pulse.overallScore < 60 && "Fair - Several issues to address"}
          {pulse.overallScore < 40 && "Poor - Immediate action required"}
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-foreground">Category Breakdown</h4>
        <div className="grid grid-cols-1 gap-3">
          {categories.map((category) => {
            const score = pulse.categories[category.key as keyof typeof pulse.categories];
            return (
              <div key={category.key} className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium">{category.label}</span>
                  {getScoreIcon(score)}
                </div>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress value={score} className="h-2 flex-1" />
                  <span className={cn("text-sm font-semibold w-8", getScoreColor(score))}>
                    {score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical Insights */}
      {pulse.criticalInsights.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            🚨 Critical Issues
          </h4>
          <div className="space-y-2">
            {pulse.criticalInsights.map((insight, index) => (
              <div key={index} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{insight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {pulse.opportunities.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            💡 Opportunities
          </h4>
          <div className="space-y-2">
            {pulse.opportunities.map((opportunity, index) => (
              <div key={index} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{opportunity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {pulse.risks.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            ⚠️ Risks
          </h4>
          <div className="space-y-2">
            {pulse.risks.map((risk, index) => (
              <div key={index} className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};