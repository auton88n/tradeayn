import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Zap } from 'lucide-react';

interface Benchmark {
  metric: string;
  yourValue: number;
  industryTarget: number;
  unit: string;
  rating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  percentile: number;
}

interface IndustryComparisonProps {
  benchmarks: Benchmark[];
  overallScore: number;
  isLoading?: boolean;
}

export function IndustryComparison({ benchmarks, overallScore, isLoading = false }: IndustryComparisonProps) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'good': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'needs_improvement': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'poor': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'EXCELLENT';
      case 'good': return 'GOOD';
      case 'needs_improvement': return 'NEEDS WORK';
      case 'poor': return 'POOR';
      default: return rating.toUpperCase();
    }
  };

  const getTrendIcon = (percentile: number) => {
    if (percentile >= 70) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (percentile >= 40) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getOverallRating = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (score >= 40) return { label: 'Needs Improvement', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { label: 'Poor', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const overallRating = getOverallRating(overallScore);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading benchmarks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            Industry Benchmark Comparison
          </CardTitle>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${overallRating.bg}`}>
            <Zap className={`h-4 w-4 ${overallRating.color}`} />
            <span className={`text-sm font-bold ${overallRating.color}`}>
              {overallScore}% - {overallRating.label}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Compared against Google Web Vitals, AWS SLA standards, and OWASP benchmarks
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {benchmarks.map((benchmark, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{benchmark.metric}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {benchmark.yourValue.toFixed(benchmark.unit === '%' ? 1 : 0)}{benchmark.unit}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (Target: {benchmark.industryTarget}{benchmark.unit})
                  </span>
                  {getTrendIcon(benchmark.percentile)}
                  <Badge variant="outline" className={`text-[10px] ${getRatingColor(benchmark.rating)}`}>
                    {getRatingLabel(benchmark.rating)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={Math.min(100, benchmark.percentile)} 
                  className="h-2 flex-1"
                />
                <span className="text-xs text-muted-foreground w-16 text-right">
                  Top {100 - benchmark.percentile}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Rating Scale:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">
              EXCELLENT: Top 33%
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px]">
              GOOD: Top 50%
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px]">
              NEEDS WORK: Top 70%
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px]">
              POOR: Below 70%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default IndustryComparison;
