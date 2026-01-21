import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, CheckCircle, XCircle, AlertTriangle, Sparkles } from 'lucide-react';

interface EvalResult {
  category: string;
  name: string;
  passed: boolean;
  score: number;
  response: string;
  reason: string;
}

interface CategoryData {
  passed: number;
  total: number;
  avgScore: number;
  results: EvalResult[];
}

interface AYNIntelligenceResultsProps {
  summary?: {
    overallScore: number;
    intelligenceRating: 'genius' | 'smart' | 'average' | 'needs_training';
    totalTests: number;
    passed: number;
    failed: number;
  };
  byCategory?: Record<string, CategoryData>;
  improvements?: string[];
  isLoading?: boolean;
}

const getRatingEmoji = (rating: string) => {
  switch (rating) {
    case 'genius': return '🧠';
    case 'smart': return '💡';
    case 'average': return '📚';
    case 'needs_training': return '📖';
    default: return '🤖';
  }
};

const getRatingColor = (rating: string) => {
  switch (rating) {
    case 'genius': return 'text-purple-500';
    case 'smart': return 'text-green-500';
    case 'average': return 'text-yellow-500';
    case 'needs_training': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'accuracy': return '🎯';
    case 'helpfulness': return '🤝';
    case 'safety': return '🛡️';
    case 'multilingual': return '🌍';
    case 'context': return '🧵';
    default: return '📊';
  }
};

export const AYNIntelligenceResults: React.FC<AYNIntelligenceResultsProps> = ({
  summary,
  byCategory,
  improvements,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Brain className="h-8 w-8 mx-auto mb-2 animate-pulse text-purple-500" />
          <p className="text-sm text-muted-foreground">Evaluating AYN intelligence...</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary || !byCategory) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No intelligence data yet</p>
          <p className="text-xs mt-1">Run the AYN Intelligence Test to evaluate AI quality</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Score Card */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            AYN Intelligence Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">{summary.overallScore}</div>
              <div className="text-sm text-muted-foreground">/100</div>
            </div>
            <div className="text-right">
              <div className={`text-2xl ${getRatingColor(summary.intelligenceRating)}`}>
                {getRatingEmoji(summary.intelligenceRating)}
              </div>
              <Badge variant="outline" className="capitalize">
                {summary.intelligenceRating.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <Progress value={summary.overallScore} className="h-3 mb-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{summary.passed} passed</span>
            <span>{summary.failed} failed</span>
            <span>{summary.totalTests} total tests</span>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(byCategory).map(([category, data]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>{getCategoryIcon(category)}</span>
                  <span className="capitalize">{category}</span>
                </span>
                <Badge variant={data.avgScore >= 70 ? 'default' : data.avgScore >= 50 ? 'secondary' : 'destructive'}>
                  {data.avgScore.toFixed(0)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={data.avgScore} className="h-2 mb-3" />
              <div className="space-y-2">
                {data.results.map((result, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    {result.passed ? (
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{result.name}</p>
                      <p className="text-muted-foreground truncate">{result.reason}</p>
                    </div>
                    <span className={result.passed ? 'text-green-500' : 'text-red-500'}>
                      {result.score}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Improvements */}
      {improvements && improvements.length > 0 && (
        <Card className="border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AYNIntelligenceResults;
