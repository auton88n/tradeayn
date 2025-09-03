import React, { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AYNResponse, moodIndicators, priorityLevels } from '@/types/ayn-response';
import { cn } from '@/lib/utils';

interface AYNResponseCardProps {
  response: AYNResponse;
  onActionClick?: (actionId: string) => void;
}

export const AYNResponseCard: React.FC<AYNResponseCardProps> = ({ 
  response, 
  onActionClick 
}) => {
  const [showFullContext, setShowFullContext] = useState(false);
  const mood = moodIndicators[response.mood];
  const priority = priorityLevels[response.visual.priority];

  const getTypeIcon = () => {
    switch (response.type) {
      case 'analysis': return <Brain className="w-5 h-5" />;
      case 'recommendation': return <Target className="w-5 h-5" />;
      case 'reality_check': return <AlertTriangle className="w-5 h-5" />;
      case 'opportunity': return <TrendingUp className="w-5 h-5" />;
      case 'warning': return <Zap className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getTypeColor = () => {
    switch (response.type) {
      case 'analysis': return 'bg-blue-500/10 border-blue-500/20';
      case 'recommendation': return 'bg-green-500/10 border-green-500/20';
      case 'reality_check': return 'bg-orange-500/10 border-orange-500/20';
      case 'opportunity': return 'bg-purple-500/10 border-purple-500/20';
      case 'warning': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className={cn(
      "ayn-response-card rounded-lg border-2 p-6 mb-4 transition-all duration-300 hover:shadow-lg",
      getTypeColor()
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">AYN</span>
              <span className="text-xl">{mood.emoji}</span>
              <Badge variant="outline" className="text-xs">
                {response.visual.category}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {mood.description}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            {getTypeIcon()}
            <Badge 
              variant="secondary" 
              className={cn("text-xs font-semibold", {
                "bg-red-500/20 text-red-400": response.visual.priority === 'critical',
                "bg-orange-500/20 text-orange-400": response.visual.priority === 'high',
                "bg-yellow-500/20 text-yellow-400": response.visual.priority === 'medium',
                "bg-blue-500/20 text-blue-400": response.visual.priority === 'low',
              })}
            >
              {priority.label}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {priority.urgency}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Headline */}
        <h3 className="ayn-headline text-xl font-bold text-foreground leading-tight">
          {response.content.headline}
        </h3>

        {/* Key Point */}
        <div className="ayn-keypoint bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-primary mb-1">Key Insight</div>
              <div className="text-foreground font-medium">
                {response.content.keyPoint}
              </div>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="ayn-action bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-destructive mb-1">Next Action</div>
              <div className="text-foreground font-medium">
                {response.content.action}
              </div>
            </div>
          </div>
        </div>

        {/* Context (expandable) */}
        {response.content.context && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullContext(!showFullContext)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showFullContext ? 'Hide' : 'Show'} Context
            </Button>
            {showFullContext && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                {response.content.context}
              </div>
            )}
          </div>
        )}

        {/* Confidence Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              AYN Confidence
            </span>
            <span className="text-sm font-bold text-foreground">
              {response.visual.confidence}%
            </span>
          </div>
          <div className="confidence-bar h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="confidence-fill h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${response.visual.confidence}%`,
                background: response.visual.confidence > 80 
                  ? 'linear-gradient(90deg, #00ff88 0%, #00cc66 100%)' 
                  : response.visual.confidence > 60 
                  ? 'linear-gradient(90deg, #ffaa00 0%, #ff8800 100%)'
                  : 'linear-gradient(90deg, #ff4444 0%, #cc3333 100%)'
              }}
            />
          </div>
        </div>

        {/* Health Score */}
        {response.visual.healthScore && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Business Health
              </span>
              <span className="text-sm font-bold text-foreground">
                {response.visual.healthScore}/100
              </span>
            </div>
            <Progress value={response.visual.healthScore} className="h-2" />
          </div>
        )}

        {/* Predictions */}
        {response.predictions && response.predictions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">AYN Predicts</h4>
            <div className="space-y-2">
              {response.predictions.map((prediction, index) => (
                <div key={index} className={cn(
                  "p-3 rounded-lg border text-sm",
                  prediction.impact === 'positive' && "bg-green-500/10 border-green-500/20",
                  prediction.impact === 'negative' && "bg-red-500/10 border-red-500/20",
                  prediction.impact === 'neutral' && "bg-blue-500/10 border-blue-500/20"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{prediction.shortTerm}</span>
                    <Badge variant="outline" className="text-xs">
                      {prediction.probability}% likely
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contextual Actions */}
        {response.contextualActions && response.contextualActions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Smart Actions</h4>
            <div className="flex flex-wrap gap-2">
              {response.contextualActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.type === 'primary' ? 'default' : 
                          action.type === 'warning' ? 'destructive' : 'secondary'}
                  size="sm"
                  onClick={() => onActionClick?.(action.id)}
                  className="text-xs"
                >
                  <span className="mr-1">{action.icon}</span>
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};