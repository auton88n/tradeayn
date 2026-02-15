// ============================================
// CHART ANALYZER TYPES
// ============================================

export type AssetType = 'stock' | 'crypto' | 'forex' | 'commodity' | 'index';
export type PredictionSignal = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type ChartTimeframe = '1m' | '5m' | '15m' | '1H' | '4H' | 'Daily' | 'Weekly' | 'Monthly' | 'unknown';

export interface ChartTechnicalAnalysis {
  trend: string;
  patterns: string[];
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
}

export interface ChartNewsItem {
  title: string;
  url: string;
  description: string;
  sentiment: number;
  impact: 'high' | 'medium' | 'low';
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
