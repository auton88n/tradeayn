import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, BarChart3, Newspaper, Target, Shield, Award, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Volume2, Brain, Crosshair, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ChartAnalysisResult, ChartPattern, PatternBreakdown, PsychologyWarnings, DisciplineReminders, ConfidenceBreakdown } from '@/types/chartAnalyzer.types';

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

// ─── Collapsible Section Wrapper ───
function Section({ id, title, icon: Icon, expanded, onToggle, children, badge }: {
  id: string;
  title: string;
  icon: React.ElementType;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const isOpen = expanded[id] || false;
  return (
    <Collapsible open={isOpen} onOpenChange={() => onToggle(id)}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="h-4 w-4" />
            {title}
            {badge}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Sub-components ───

function PatternCard({ pattern }: { pattern: ChartPattern }) {
  const [open, setOpen] = useState(false);
  const confClass = confidenceColors[pattern.confidence] || confidenceColors.MEDIUM;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className={`text-[10px] shrink-0 ${confClass}`}>{pattern.confidence}</Badge>
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
            {pattern.location && <p className="text-muted-foreground">📍 {pattern.location}</p>}
            {pattern.reasoning && <p className="text-muted-foreground">{pattern.reasoning}</p>}
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
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${scoreColor}`}>{breakdown.finalScore}%</span>
      </div>
      <div className="text-xs space-y-1.5">
        <div className="text-muted-foreground">Base: {breakdown.baseScore}%</div>
        {breakdown.adjustments.length > 0 && (
          <div className="text-muted-foreground">
            <span className="font-medium">Adjustments:</span>
            <ul className="ml-3 mt-0.5 space-y-0.5">
              {breakdown.adjustments.map((adj, j) => <li key={j}>• {adj}</li>)}
            </ul>
          </div>
        )}
        <div className="pt-1.5 mt-1.5 border-t border-border/30 space-y-0.5">
          <div className="text-green-600">✓ {breakdown.historicalSuccess}</div>
          <div className="text-red-500">✗ {breakdown.failureMode}</div>
          <div className="text-amber-600">⚠ Invalid if: {breakdown.invalidation}</div>
        </div>
      </div>
    </div>
  );
}

function PsychologyCard({ warnings }: { warnings: PsychologyWarnings }) {
  return (
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
            <Badge key={emotion} variant="secondary" className="text-[10px]">{emotion}</Badge>
          ))}
        </div>
      </div>
      {warnings.commonMistakes.length > 0 && (
        <div>
          <span className="text-xs font-medium text-amber-600">⚠️ Common Mistakes:</span>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {warnings.commonMistakes.map((mistake, i) => <li key={i}>• {mistake}</li>)}
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
  );
}

function ConfidenceBreakdownDisplay({ breakdown }: { breakdown: ConfidenceBreakdown }) {
  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground">Why this confidence?</p>
      <div className="text-xs space-y-0.5">
        <div>• Technical score: <span className="font-medium">{breakdown.technicalScore}</span></div>
        <div>• News score: <span className="font-medium">{breakdown.newsScore}</span></div>
        {breakdown.conflictPenalty !== 0 && (
          <div className="text-amber-600">• ⚠️ Conflict penalty: <span className="font-medium">{breakdown.conflictPenalty}%</span></div>
        )}
        <div className="pt-1 border-t border-border/30 text-muted-foreground italic">{breakdown.calculation}</div>
      </div>
      {breakdown.explanation && (
        <p className="text-xs text-muted-foreground mt-1">{breakdown.explanation}</p>
      )}
    </div>
  );
}

function parseRiskReward(rr: string): { ratio: number | null; label: string; color: string } {
  const match = rr.match(/1[:\s]*(\d+\.?\d*)/);
  if (!match) return { ratio: null, label: '', color: '' };
  const ratio = parseFloat(match[1]);
  if (ratio >= 2) return { ratio, label: '✅ Excellent', color: 'text-green-500' };
  if (ratio >= 1.5) return { ratio, label: '✅ Good', color: 'text-green-500' };
  return { ratio, label: '⚠️ Below minimum (need 1:1.5)', color: 'text-amber-500' };
}

function NextStepsCard({ result }: Props) {
  const { prediction, technical } = result;
  const isWait = prediction.signal === 'WAIT';

  return (
    <Card className="border border-blue-500/30 bg-blue-500/5">
      <CardContent className="pt-4 pb-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-500" />
          <span className="text-blue-500">📲 What To Do Next</span>
        </h3>
        <div className="space-y-3 text-sm">
          {isWait ? (
            <>
              <div>
                <p className="font-medium text-foreground">1. Set Price Alerts</p>
                <div className="text-xs text-muted-foreground ml-4 mt-0.5 space-y-0.5">
                  {technical.resistance.length > 0 && <p>• Alert at {technical.resistance[0]} (bullish trigger)</p>}
                  {technical.support.length > 0 && <p>• Alert at {technical.support[0]} (bearish trigger)</p>}
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">2. Don't Watch the Chart</p>
                <p className="text-xs text-muted-foreground ml-4 mt-0.5">Staring at price increases emotional trading. Close the chart and wait for alerts.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">3. Re-analyze When:</p>
                <div className="text-xs text-muted-foreground ml-4 mt-0.5 space-y-0.5">
                  <p>• Alert triggers (price breaks key level)</p>
                  <p>• New volume spike occurs</p>
                  <p>• 4+ hours have passed</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="font-medium text-foreground">1. Review the Setup</p>
                <p className="text-xs text-muted-foreground ml-4 mt-0.5">Re-read entry plan, stop loss, and targets above. Know WHY you're taking this trade.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">2. Calculate Position Size</p>
                <p className="text-xs text-muted-foreground ml-4 mt-0.5">Risk 1-2% of account. Formula: (Account × Risk%) ÷ (Entry − Stop)</p>
              </div>
              <div>
                <p className="font-medium text-foreground">3. Set Stop Loss BEFORE Entering</p>
                <p className="text-xs text-muted-foreground ml-4 mt-0.5">
                  Place stop at {prediction.stop_loss !== 'N/A' ? prediction.stop_loss : 'your calculated level'}. Never move it wider.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">4. Journal This Trade</p>
                <p className="text-xs text-muted-foreground ml-4 mt-0.5">Write down: Why entering, what you'll do if stopped out, how you're feeling right now.</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───

export default function ChartAnalyzerResults({ result }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const signal = signalConfig[result.prediction.signal] || signalConfig.NEUTRAL;
  const SignalIcon = signal.icon;
  const { entryTiming, patternBreakdown, psychologyWarnings, disciplineReminders, confidenceBreakdown } = result.prediction;
  const volumeAnalysis = result.technical.volumeAnalysis;
  const rrParsed = parseRiskReward(result.prediction.risk_reward || '');

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {/* ─── Quick View: Always Visible ─── */}
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

          {/* Confidence Breakdown (inline in Quick View) */}
          {confidenceBreakdown && <ConfidenceBreakdownDisplay breakdown={confidenceBreakdown} />}
        </CardContent>
      </Card>

      {/* ─── Collapsible Sections ─── */}

      {/* Entry Timing */}
      {entryTiming && (
        <Section id="entry" title="Entry Timing" icon={entryTiming.status === 'READY' ? CheckCircle : AlertTriangle} expanded={expanded} onToggle={toggleSection}
          badge={<Badge variant="outline" className={`text-[10px] ml-2 ${entryTiming.status === 'READY' ? 'text-green-500 border-green-500/30' : 'text-amber-500 border-amber-500/30'}`}>{entryTiming.status}</Badge>}
        >
          <Card className={`border ${entryTiming.status === 'READY' ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground mb-3">{entryTiming.reason}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-muted/40 text-xs">
                  <p className="font-semibold text-muted-foreground mb-1">🔥 Aggressive</p>
                  <p>{entryTiming.aggressive}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 text-xs">
                  <p className="font-semibold text-muted-foreground mb-1">🛡️ Conservative</p>
                  <p>{entryTiming.conservative}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Psychology Warnings */}
      {psychologyWarnings && (
        <Section id="psychology" title="Psychology Check" icon={Brain} expanded={expanded} onToggle={toggleSection}>
          <Card className="border border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-4 pb-4">
              <PsychologyCard warnings={psychologyWarnings} />
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Trade Setup */}
      {result.prediction.entry_zone !== 'N/A' && (
        <Section id="trade" title="Trade Setup" icon={Target} expanded={expanded} onToggle={toggleSection}>
          <Card>
            <CardContent className="pt-4">
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
                  {rrParsed.ratio !== null && (
                    <p className={`text-[10px] mt-0.5 ${rrParsed.color}`}>{rrParsed.label}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Pattern Breakdown */}
      {patternBreakdown && patternBreakdown.length > 0 && (
        <Section id="patterns" title="Pattern Analysis (Research-Backed)" icon={Award} expanded={expanded} onToggle={toggleSection}
          badge={<Badge variant="secondary" className="text-[10px] ml-2">{patternBreakdown.length} patterns</Badge>}
        >
          <div className="space-y-2">
            {patternBreakdown.map((pb, i) => <PatternBreakdownCard key={i} breakdown={pb} />)}
          </div>
        </Section>
      )}

      {/* Technical Analysis */}
      <Section id="technical" title="Technical Analysis" icon={BarChart3} expanded={expanded} onToggle={toggleSection}>
        <Card>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Trend:</span>
              <Badge variant="secondary" className="capitalize">{result.technical.trend}</Badge>
            </div>

            {(!patternBreakdown || patternBreakdown.length === 0) && result.technical.patterns.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-muted-foreground text-xs font-medium">Patterns Detected:</span>
                <div className="space-y-1.5">
                  {result.technical.patterns.map((p, i) => {
                    if (typeof p === 'string') return <Badge key={i} variant="outline" className="text-xs mr-1">{p}</Badge>;
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

            {volumeAnalysis && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Volume Analysis</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{volumeAnalysis.trend}</Badge>
                </div>
                {volumeAnalysis.spikes && <p className="text-xs text-muted-foreground">📊 {volumeAnalysis.spikes}</p>}
                {volumeAnalysis.significance && <p className="text-xs text-muted-foreground">✅ {volumeAnalysis.significance}</p>}
              </div>
            )}

            {result.technical.keyObservations && (
              <p className="text-muted-foreground text-xs italic mt-2">{result.technical.keyObservations}</p>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* News Sentiment */}
      {result.news.length > 0 && (
        <Section id="news" title="News Sentiment" icon={Newspaper} expanded={expanded} onToggle={toggleSection}
          badge={<Badge variant="secondary" className="text-[10px] ml-2">
            {result.prediction.overallSentiment > 0 ? '+' : ''}{result.prediction.overallSentiment?.toFixed(2)}
          </Badge>}
        >
          <div className="space-y-2">
            {result.news.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                <span className={`shrink-0 mt-0.5 ${item.sentiment > 0.2 ? 'text-green-500' : item.sentiment < -0.2 ? 'text-red-500' : 'text-yellow-500'}`}>
                  {item.sentiment > 0.2 ? '🟢' : item.sentiment < -0.2 ? '🔴' : '🟡'}
                </span>
                <span className="line-clamp-1">{item.title}</span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* Discipline Reminders */}
      {disciplineReminders && (
        <Section id="discipline" title="Trading Discipline" icon={Crosshair} expanded={expanded} onToggle={toggleSection}>
          <Card className="border-border/50 bg-muted/20">
            <CardContent className="pt-4 pb-4">
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div>• {disciplineReminders.positionSizing}</div>
                <div>• {disciplineReminders.stopLoss}</div>
                <div>• {disciplineReminders.emotionalCheck}</div>
                <div>• {disciplineReminders.invalidation}</div>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Next Steps */}
      <Section id="nextsteps" title="What To Do Next" icon={Bell} expanded={expanded} onToggle={toggleSection}>
        <NextStepsCard result={result} />
      </Section>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center px-4">
        ⚠️ {result.disclaimer}
      </p>
    </div>
  );
}
