import { TrendingUp, TrendingDown, Minus, Clock, BarChart3, Newspaper, Target, Shield, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ChartAnalysisResult } from '@/types/chartAnalyzer.types';

interface Props {
  result: ChartAnalysisResult;
}

const signalConfig = {
  BULLISH: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'BULLISH' },
  BEARISH: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'BEARISH' },
  NEUTRAL: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'NEUTRAL' },
};

const assetIcons: Record<string, string> = {
  stock: '📈', crypto: '₿', forex: '💱', commodity: '🏗️', index: '📊',
};

export default function ChartAnalyzerResults({ result }: Props) {
  const signal = signalConfig[result.prediction.signal] || signalConfig.NEUTRAL;
  const SignalIcon = signal.icon;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header: Signal + Confidence */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${signal.bg}`}>
                <SignalIcon className={`h-8 w-8 ${signal.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Signal</p>
                <p className={`text-2xl font-bold ${signal.color}`}>{signal.label}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                {assetIcons[result.assetType] || '📊'} {result.ticker}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" /> {result.timeframe}
              </Badge>
              <Badge variant="outline">{result.assetType}</Badge>
            </div>

            <div className="text-center min-w-[100px]">
              <p className="text-sm text-muted-foreground mb-1">Confidence</p>
              <p className="text-3xl font-bold">{result.prediction.confidence}%</p>
              <Progress value={result.prediction.confidence} className="h-2 mt-1" />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {result.prediction.reasoning}
          </p>
        </CardContent>
      </Card>

      {/* Trade Setup */}
      {result.prediction.entry_zone !== 'N/A' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" /> Trade Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Entry Zone</p>
                <p className="font-semibold">{result.prediction.entry_zone}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/5">
                <p className="text-muted-foreground text-xs">Stop Loss</p>
                <p className="font-semibold text-red-500">{result.prediction.stop_loss}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/5">
                <p className="text-muted-foreground text-xs">Take Profit</p>
                <p className="font-semibold text-green-500">{result.prediction.take_profit}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Risk/Reward</p>
                <p className="font-semibold">{result.prediction.risk_reward}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Technical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Trend:</span>
            <Badge variant="secondary" className="capitalize">{result.technical.trend}</Badge>
          </div>

          {result.technical.patterns.length > 0 && (
            <div>
              <span className="text-muted-foreground">Patterns:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {result.technical.patterns.map((p, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            </div>
          )}

          {result.technical.support.length > 0 && (
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Support:</span>
              <span>{result.technical.support.join(', ')}</span>
            </div>
          )}

          {result.technical.resistance.length > 0 && (
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-red-500" />
              <span className="text-muted-foreground">Resistance:</span>
              <span>{result.technical.resistance.join(', ')}</span>
            </div>
          )}

          {result.technical.keyObservations && (
            <p className="text-muted-foreground text-xs italic mt-2">{result.technical.keyObservations}</p>
          )}
        </CardContent>
      </Card>

      {/* News Sentiment */}
      {result.news.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Newspaper className="h-4 w-4" /> News Sentiment
              <Badge variant="secondary" className="ml-auto text-xs">
                Overall: {result.prediction.overallSentiment > 0 ? '+' : ''}{result.prediction.overallSentiment?.toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.news.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                >
                  <span className={`shrink-0 mt-0.5 ${
                    item.sentiment > 0.2 ? 'text-green-500' : item.sentiment < -0.2 ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {item.sentiment > 0.2 ? '🟢' : item.sentiment < -0.2 ? '🔴' : '🟡'}
                  </span>
                  <span className="line-clamp-1">{item.title}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center px-4">
        ⚠️ {result.disclaimer}
      </p>
    </div>
  );
}
