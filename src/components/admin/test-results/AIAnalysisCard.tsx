import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface BugReport {
  endpoint: string;
  bugType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedFix: string;
}

interface AIAnalysisCardProps {
  analysis: string;
  model: string;
  tokensUsed?: number;
  bugs?: BugReport[];
  isLoading?: boolean;
  lastAnalyzedAt?: Date;
}

export function AIAnalysisCard({ 
  analysis, 
  model, 
  tokensUsed, 
  bugs = [],
  isLoading = false,
  lastAnalyzedAt 
}: AIAnalysisCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const criticalBugs = bugs.filter(b => b.severity === 'critical').length;
  const highBugs = bugs.filter(b => b.severity === 'high').length;

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-purple-500" />
            AI Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
              <Sparkles className="h-3 w-3 mr-1" />
              {model}
            </Badge>
          </div>
        </div>
        {lastAnalyzedAt && (
          <p className="text-xs text-muted-foreground">
            Last analyzed: {lastAnalyzedAt.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bug Summary */}
        {bugs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {criticalBugs > 0 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {criticalBugs} Critical
              </Badge>
            )}
            {highBugs > 0 && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {highBugs} High
              </Badge>
            )}
            {bugs.length === 0 && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                No bugs found
              </Badge>
            )}
          </div>
        )}

        {/* AI Analysis Text */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {isLoading ? 'AI is analyzing test results...' : analysis || 'No analysis available yet. Run tests to generate AI insights.'}
          </p>
        </div>

        {/* Bug Details */}
        {bugs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Bugs Discovered:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {bugs.slice(0, 5).map((bug, index) => (
                <div key={index} className={`p-2 rounded-lg border ${getSeverityColor(bug.severity)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{bug.endpoint}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {bug.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs">{bug.description}</p>
                </div>
              ))}
              {bugs.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{bugs.length - 5} more bugs
                </p>
              )}
            </div>
          </div>
        )}

        {/* Token Usage */}
        {tokensUsed && tokensUsed > 0 && (
          <p className="text-xs text-muted-foreground">
            Tokens used: {tokensUsed.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default AIAnalysisCard;
