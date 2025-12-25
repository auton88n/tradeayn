import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Calculator, 
  Lightbulb,
  TrendingUp,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Problem {
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  impact: string;
  location?: string;
}

interface Optimization {
  title: string;
  action: string;
  expectedResult: {
    newCutVolume: number;
    newFillVolume: number;
    newBalance: number;
  };
  costSavings: number;
  savingsExplanation: string;
  implementationNotes: string[];
}

interface AnalysisResult {
  hasVolumeData: boolean;
  calculatedVolumes: {
    cutVolume: number;
    fillVolume: number;
    netVolume: number;
    balanceRatio: number;
  } | null;
  problems: Problem[];
  problemsSummary: {
    critical: number;
    warnings: number;
    info: number;
  };
  designRating: number;
  costEstimates: {
    currentCosts: Record<string, number>;
    totalCurrentCost: number;
  };
  aiOptimizations: {
    designRating: number;
    ratingExplanation: string;
    optimizations: Optimization[];
    totalPotentialSavings: number;
    implementationTime: string;
    priorityActions: string[];
  } | null;
  parsedData: any;
  fileName: string;
}

interface DesignAnalysisResultsProps {
  result: AnalysisResult | null;
  onApplyOptimizations: (optimizations: Optimization[]) => void;
  isApplying: boolean;
}

export const DesignAnalysisResults: React.FC<DesignAnalysisResultsProps> = ({
  result,
  onApplyOptimizations,
  isApplying
}) => {
  const [expandedOptimization, setExpandedOptimization] = useState<number | null>(null);

  if (!result) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Upload and analyze a design file to see results here
          </p>
        </CardContent>
      </Card>
    );
  }

  const rating = result.aiOptimizations?.designRating || result.designRating;
  const ratingColor = rating >= 8 ? 'text-green-500' : rating >= 6 ? 'text-yellow-500' : 'text-red-500';
  const ratingBg = rating >= 8 ? 'bg-green-500/10' : rating >= 6 ? 'bg-yellow-500/10' : 'bg-red-500/10';

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };
    return variants[severity] || variants.info;
  };

  return (
    <div className="space-y-6">
      {/* Design Rating Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={ratingBg}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${ratingColor}`}>
                  {rating}/10
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Design Quality Rating</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.aiOptimizations?.ratingExplanation || 'Based on earthwork balance and design standards'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${i < Math.round(rating / 2) ? ratingColor : 'text-muted-foreground/30'}`}
                    fill={i < Math.round(rating / 2) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calculated Volumes */}
      {result.hasVolumeData && result.calculatedVolumes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-500" />
                Calculated Earthwork Volumes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-red-500/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {result.calculatedVolumes.cutVolume.toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Cut Volume (m³)</p>
                </div>
                <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-500">
                    {result.calculatedVolumes.fillVolume.toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Fill Volume (m³)</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {result.calculatedVolumes.netVolume > 0 ? '+' : ''}{result.calculatedVolumes.netVolume.toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Net ({result.calculatedVolumes.netVolume > 0 ? 'Excess Cut' : 'Import Needed'})
                  </p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">
                    {(result.calculatedVolumes.balanceRatio * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Balance Ratio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Problems Found */}
      {result.problems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Problems Identified
                </span>
                <div className="flex gap-2">
                  {result.problemsSummary.critical > 0 && (
                    <Badge variant="destructive">{result.problemsSummary.critical} Critical</Badge>
                  )}
                  {result.problemsSummary.warnings > 0 && (
                    <Badge className="bg-amber-500">{result.problemsSummary.warnings} Warnings</Badge>
                  )}
                  {result.problemsSummary.info > 0 && (
                    <Badge variant="secondary">{result.problemsSummary.info} Info</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.problems.map((problem, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${getSeverityBadge(problem.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(problem.severity)}
                      <div className="flex-1">
                        <p className="font-medium">{problem.message}</p>
                        <p className="text-sm opacity-80 mt-1">{problem.impact}</p>
                        {problem.location && (
                          <p className="text-xs mt-2 opacity-60">Location: {problem.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Optimization Suggestions */}
      {result.aiOptimizations && result.aiOptimizations.optimizations?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI Optimization Suggestions
                </span>
                <Badge className="bg-green-500">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Save up to {result.aiOptimizations.totalPotentialSavings?.toLocaleString()} SAR
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.aiOptimizations.optimizations.map((opt, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedOptimization(expandedOptimization === idx ? null : idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{opt.title}</p>
                        <p className="text-sm text-muted-foreground">{opt.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-green-500 font-semibold">
                        +{opt.costSavings?.toLocaleString()} SAR
                      </span>
                      {expandedOptimization === idx ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                  
                  {expandedOptimization === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t bg-muted/30 p-4"
                    >
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-background rounded-lg">
                          <p className="text-lg font-bold">{opt.expectedResult?.newCutVolume?.toFixed(0) || '-'}</p>
                          <p className="text-xs text-muted-foreground">New Cut (m³)</p>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg">
                          <p className="text-lg font-bold">{opt.expectedResult?.newFillVolume?.toFixed(0) || '-'}</p>
                          <p className="text-xs text-muted-foreground">New Fill (m³)</p>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg">
                          <p className="text-lg font-bold text-green-500">{opt.expectedResult?.newBalance || '-'}%</p>
                          <p className="text-xs text-muted-foreground">New Balance</p>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-3">
                        <strong>Why this saves money:</strong> {opt.savingsExplanation}
                      </p>
                      
                      {opt.implementationNotes?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Implementation Notes:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {opt.implementationNotes.map((note, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => onApplyOptimizations(result.aiOptimizations!.optimizations)}
                  disabled={isApplying}
                  className="flex-1"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying Optimizations...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Apply All Optimizations
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cost Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Current Cost Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.costEstimates.currentCosts).map(([key, value]) => (
                value > 0 && (
                  <div key={key} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-lg font-semibold">{value.toLocaleString()} SAR</p>
                  </div>
                )
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-lg font-medium">Total Estimated Cost</span>
              <span className="text-2xl font-bold text-primary">
                {result.costEstimates.totalCurrentCost.toLocaleString()} SAR
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
