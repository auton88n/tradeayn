// Types for AI Grading Designer

export interface SurveyPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  fgl?: number;
  cutFill?: number;
}

export interface TerrainAnalysis {
  minElevation: number;
  maxElevation: number;
  elevationRange: number;
  avgElevation: number;
  pointCount: number;
  estimatedArea: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface GradingDesign {
  designElevation: number;
  maxSlope: number;
  totalCutVolume: number;
  totalFillVolume: number;
  balanceRatio: number;
  drainageDirection: string;
  recommendations: string[];
}

export interface CostBreakdownItem {
  item: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CostBreakdown {
  items: CostBreakdownItem[];
  subtotal: number;
  contingency: number;
  total: number;
}

export interface DesignOptimization {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
  applied?: boolean;
}

export interface AnalysisResult {
  volumes: {
    totalCut: number;
    totalFill: number;
    netVolume: number;
    balanceRatio: number;
  };
  problemsSummary: {
    critical: number;
    warnings: number;
    info: number;
  };
  problems: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    location?: { x: number; y: number };
  }>;
  optimizations: DesignOptimization[];
  compliance: {
    status: 'compliant' | 'non-compliant' | 'needs-review';
    issues: string[];
  };
  parsedData?: ParsedDesignData;
  fileName?: string;
}

export interface ParsedDesignData {
  points: SurveyPoint[];
  layers: string[];
  terrainAnalysis: TerrainAnalysis;
  metadata?: Record<string, unknown>;
}
