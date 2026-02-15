import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, BarChart3, Newspaper, Target, Shield, Award, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Volume2, Brain, Crosshair } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ChartAnalysisResult, ChartPattern, PatternBreakdown, PsychologyWarnings, DisciplineReminders } from '@/types/chartAnalyzer.types';

interface Props {
  result: ChartAnalysisResult;
}

const signalConfig = {
  BULLISH: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'BULLISH' },
  BEARISH: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'BEARISH' },
  NEUTRAL: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'NEUTRAL' },
  WAIT: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'WAIT' },
};

const assetIcons: Record<string, string> = {
  stock: '📈', crypto: '₿', forex: '💱', commodity: '🏗️', index: '📊',
};

const confidenceColors: Record<string, string> = {
  HIGH: 'bg-green-500/15 text-green-500 border-green-500/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  LOW: 'bg-red-500/15 text-red-500 border-red-500/30',
};

function PatternCard({ pattern }: { pattern: ChartPattern }) {
  const [open, setOpen] = useState(false);
  const confClass = confidenceColors[pattern.confidence] || confidenceColors.MEDIUM;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className={`text-[10px] shrink-0 ${confClass}`}>
              {pattern.confidence}
            </Badge>
            <span className="text-sm font-medium truncate">{pattern.name.replace(/_/g, ' ')}</span>
            <span className="text-xs text-muted-foreground shrink-0">({pattern.score})</span>
          </div>
          {(pattern.reasoning || pattern.location) && (
            open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </div>
      </CollapsibleTrigger>
      {(pattern.reasoning || pattern.location) && (
        <CollapsibleContent>
          <div className="px-3 py-2 text-xs space-y-1 border-l-2 border-muted ml-3 mt-1">
            {pattern.location && (
              <p className="text-muted-foreground">📍 {pattern.location}</p>
            )}
            {pattern.reasoning && (
              <p className="text-muted-foreground">{pattern.reasoning}</p>
            )}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function PatternBreakdownCard({ breakdown }: { breakdown: PatternBreakdown }) {
  const scoreColor = breakdown.finalScore >= 70
    ? 'bg-green-500/15 text-green-500'
    : breakdown.finalScore >= 55
      ? 'bg-yellow-500/15 text-yellow-500'
      : 'bg-red-500/15 text-red-500';

  return (
    <div className="border border-border/50 rounded-lg p-3 bg-muted/20">
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium text-sm capitalize">{breakdown.name.replace(/_/g, ' ')}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${scoreColor}`}>
          {breakdown.finalScore}%
        </span>
      </div>

      <div className="text-xs space-y-1.5">
        <div className="text-muted-foreground">
          Base: {breakdown.baseScore}%
        </div>

        {breakdown.adjustments.length > 0 && (
          <div className="text-muted-foreground">
            <span className="font-medium">Adjustments:</span>
            <ul className="ml-3 mt-0.5 space-y-0.5">
              {breakdown.adjustments.map((adj, j) => (
                <li key={j}>• {adj}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-1.5 mt-1.5 border-t border-border/30 space-y-0.5">
          <div className="text-green-600">
            ✓ {breakdown.historicalSuccess}
          </div>
          <div className="text-red-500">
            ✗ {breakdown.failureMode}
          </div>
          <div className="text-amber-600">
            ⚠ Invalid if: {breakdown.invalidation}
          </div>
        </div>
      </div>
    </div>
  );
}

function PsychologyCard({ warnings }: { warnings: PsychologyWarnings }) {
  return (
    <Card className="border border-blue-500/30 bg-blue-500/5">
      <CardContent className="pt-4 pb-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-500" />
          <span className="text-blue-500">Psychology Check</span>
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">Market Stage:</span>
            <Badge variant="outline" className="text-[10px] capitalize">{warnings.marketStage}</Badge>
          </div>

          {warnings.crowdPosition && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">Crowd:</span>
              <span className="text-xs capitalize">{warnings.crowdPosition}</span>
            </div>
          )}

          <div>
            <span className="text-muted-foreground text-xs font-medium">Emotional Drivers:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {warnings.emotionalDrivers.map(emotion => (
                <Badge key={emotion} variant="secondary" className="text-[10px]">
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>

          {warnings.commonMistakes.length > 0 && (
            <div>
              <span className="text-xs font-medium text-amber-600">⚠️ Common Mistakes:</span>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {warnings.commonMistakes.map((mistake, i) => (
                  <li key={i}>• {mistake}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.contrarian_insight && (
            <div className="pt-2 border-t border-blue-500/20">
              <span className="text-xs font-medium">💡 Contrarian Insight:</span>
              <p className="mt-0.5 text-xs text-muted-foreground">{warnings.contrarian_insight}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DisciplineCard({ reminders }: { reminders: DisciplineReminders }) {
  return (
    <Card className="border-border/50 bg-muted/20">
      <CardContent className="pt-4 pb-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Crosshair className="h-4 w-4" /> Trading Discipline
        </h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div>• {reminders.positionSizing}</div>
          <div>• {reminders.stopLoss}</div>
          <div>• {reminders.emotionalCheck}</div>
          <div>• {reminders.invalidation}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChartAnalyzerResults({ result }: Props) {
  const signal = signalConfig[result.prediction.signal] || signalConfig.NEUTRAL;
  const SignalIcon = signal.icon;
  const entryTiming = result.prediction.entryTiming;
  const volumeAnalysis = result.technical.volumeAnalysis;
  const patternBreakdown = result.prediction.patternBreakdown;
  const psychologyWarnings = result.prediction.psychologyWarnings;
  const disciplineReminders = result.prediction.disciplineReminders;

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

          <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {result.prediction.reasoning}
          </p>
        </CardContent>
      </Card>

      {/* Entry Timing Alert */}
      {entryTiming && (
        <Card className={`border ${entryTiming.status === 'READY' ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              {entryTiming.status === 'READY' ? (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${entryTiming.status === 'READY' ? 'text-green-500' : 'text-amber-500'}`}>
                    Entry Timing: {entryTiming.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{entryTiming.reason}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div className="p-2.5 rounded-lg bg-muted/40 text-xs">
                    <p className="font-semibold text-muted-foreground mb-1">🔥 Aggressive</p>
                    <p>{entryTiming.aggressive}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 text-xs">
                    <p className="font-semibold text-muted-foreground mb-1">🛡️ Conservative</p>
                    <p>{entryTiming.conservative}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Psychology Warnings */}
      {psychologyWarnings && <PsychologyCard warnings={psychologyWarnings} />}

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

      {/* Pattern Breakdown (Research-Backed) */}
      {patternBreakdown && patternBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" /> Pattern Analysis (Research-Backed)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patternBreakdown.map((pb, i) => (
                <PatternBreakdownCard key={i} breakdown={pb} />
              ))}
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

          {/* Rich Patterns (only show if no patternBreakdown) */}
          {(!patternBreakdown || patternBreakdown.length === 0) && result.technical.patterns.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs font-medium">Patterns Detected:</span>
              <div className="space-y-1.5">
                {result.technical.patterns.map((p, i) => {
                  if (typeof p === 'string') {
                    return <Badge key={i} variant="outline" className="text-xs mr-1">{p}</Badge>;
                  }
                  return <PatternCard key={i} pattern={p as ChartPattern} />;
                })}
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

          {/* Volume Analysis Section */}
          {volumeAnalysis && (
            <div className="mt-3 p-3 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Volume Analysis</span>
                <Badge variant="outline" className="text-[10px] capitalize">{volumeAnalysis.trend}</Badge>
              </div>
              {volumeAnalysis.spikes && (
                <p className="text-xs text-muted-foreground">📊 {volumeAnalysis.spikes}</p>
              )}
              {volumeAnalysis.significance && (
                <p className="text-xs text-muted-foreground">✅ {volumeAnalysis.significance}</p>
              )}
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

      {/* Discipline Reminders */}
      {disciplineReminders && <DisciplineCard reminders={disciplineReminders} />}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center px-4">
        ⚠️ {result.disclaimer}
      </p>
    </div>
  );
}
