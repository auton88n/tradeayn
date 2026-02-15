// ============================================
// CHART ANALYZER TYPES
// ============================================

export type AssetType = 'stock' | 'crypto' | 'forex' | 'commodity' | 'index';
export type PredictionSignal = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'WAIT';
export type ChartTimeframe = '1m' | '5m' | '15m' | '1H' | '4H' | 'Daily' | 'Weekly' | 'Monthly' | 'unknown';

export interface ChartPattern {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  reasoning: string;
  location: string;
}

export interface VolumeAnalysis {
  trend: string;
  spikes: string;
  significance: string;
}

export interface EntryTiming {
  status: 'READY' | 'WAIT';
  reason: string;
  aggressive: string;
  conservative: string;
}

export interface ChartTechnicalAnalysis {
  trend: string;
  patterns: (string | ChartPattern)[];
  support: number[];
  resistance: number[];
  indicators: {
    rsi?: number | null;
    macd?: string | null;
    movingAverages?: string | null;
    volume?: string | null;
    other?: string | null;
  };
  keyObservations: string;
  volumeAnalysis?: VolumeAnalysis;
}

export interface ChartNewsItem {
  title: string;
  url: string;
  description: string;
  sentiment: number;
  impact: 'high' | 'medium' | 'low';
}

export interface PatternBreakdown {
  name: string;
  baseScore: number;
  adjustments: string[];
  finalScore: number;
  historicalSuccess: string;
  failureMode: string;
  invalidation: string;
}

export interface PsychologyWarnings {
  marketStage: string;
  crowdPosition: string;
  emotionalDrivers: string[];
  commonMistakes: string[];
  contrarian_insight?: string;
}

export interface DisciplineReminders {
  positionSizing: string;
  stopLoss: string;
  emotionalCheck: string;
  invalidation: string;
}

export interface ConfidenceBreakdown {
  technicalScore: number;
  newsScore: number;
  conflictPenalty: number;
  calculation: string;
  explanation: string;
}

export interface ChartPrediction {
  signal: PredictionSignal;
  confidence: number;
  timeframe: ChartTimeframe;
  assetType: AssetType;
  reasoning: string;
  entry_zone: string;
  stop_loss: string;
  take_profit: string;
  risk_reward: string;
  overallSentiment: number;
  entryTiming?: EntryTiming;
  patternBreakdown?: PatternBreakdown[];
  psychologyWarnings?: PsychologyWarnings;
  disciplineReminders?: DisciplineReminders;
  confidenceBreakdown?: ConfidenceBreakdown;
}

export interface ChartAnalysisResult {
  ticker: string;
  assetType: AssetType;
  timeframe: ChartTimeframe;
  technical: ChartTechnicalAnalysis;
  news: ChartNewsItem[];
  prediction: ChartPrediction;
  imageUrl: string;
  analysisId: string | null;
  disclaimer: string;
}

export type ChartAnalyzerStep = 'idle' | 'uploading' | 'analyzing' | 'fetching-news' | 'predicting' | 'done' | 'error';

export interface ChartHistoryItem extends ChartAnalysisResult {
  id: string;
  created_at: string;
}

export interface ChartHistoryFilter {
  ticker?: string;
  assetType?: AssetType | '';
  signal?: PredictionSignal | '';
}
