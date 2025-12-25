import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  FileText, 
  Sparkles, 
  RefreshCw,
  Box,
  Ruler,
  Weight,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BeamVisualization3D } from './BeamVisualization3D';
import { FoundationVisualization3D } from './FoundationVisualization3D';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CalculationResultsProps {
  result: {
    type: 'beam' | 'foundation' | 'column' | 'slab' | null;
    inputs: Record<string, number | string>;
    outputs: Record<string, number | string | object>;
    timestamp: Date;
  };
  onNewCalculation: () => void;
}

export const CalculationResults = ({ result, onNewCalculation }: CalculationResultsProps) => {
  const [isExportingDXF, setIsExportingDXF] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    compliance: string[];
    optimizations: string[];
    costEstimate: { item: string; cost: number }[];
  } | null>(null);

  const outputs = result.outputs as Record<string, unknown>;

  const handleExportDXF = async () => {
    setIsExportingDXF(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-dxf', {
        body: {
          type: result.type,
          inputs: result.inputs,
          outputs: result.outputs,
        },
      });

      if (error) throw error;

      // Download the DXF file
      const blob = new Blob([data.dxfContent], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.type}-design-${Date.now()}.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('DXF file downloaded!');
    } catch (err) {
      console.error('DXF export error:', err);
      toast.error('Failed to export DXF file');
    } finally {
      setIsExportingDXF(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Use html2pdf.js for PDF generation
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('calculation-report');
      
      if (!element) {
        throw new Error('Report element not found');
      }

      const opt = {
        margin: 10,
        filename: `${result.type}-calculation-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('PDF report downloaded!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF report');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('engineering-ai-analysis', {
        body: {
          type: result.type,
          inputs: result.inputs,
          outputs: result.outputs,
        },
      });

      if (error) throw error;

      setAiAnalysis(data);
      toast.success('AI analysis complete!');
    } catch (err) {
      console.error('AI analysis error:', err);
      toast.error('AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatNumber = (value: unknown, decimals = 2): string => {
    if (typeof value === 'number') {
      return value.toFixed(decimals);
    }
    return String(value);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="outline" onClick={onNewCalculation} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          New Calculation
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportDXF}
            disabled={isExportingDXF}
            className="gap-2"
          >
            {isExportingDXF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download DXF
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="gap-2"
          >
            {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Download PDF
          </Button>
          <Button 
            onClick={handleAIAnalysis}
            disabled={isAnalyzing}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Analysis
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 3D Visualization */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Box className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">3D Visualization</h3>
          </div>
          <div className="aspect-square bg-muted/30 rounded-xl overflow-hidden">
            {result.type === 'beam' ? (
              <BeamVisualization3D outputs={outputs} />
            ) : result.type === 'foundation' ? (
              <FoundationVisualization3D outputs={outputs} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                3D visualization not available
              </div>
            )}
          </div>
        </motion.div>

        {/* Results Summary */}
        <motion.div
          id="calculation-report"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Dimensions Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Ruler className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Design Dimensions</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {result.type === 'beam' && (
                <>
                  <ResultItem label="Width" value={`${outputs.width || outputs.beamWidth} mm`} />
                  <ResultItem label="Depth" value={`${outputs.depth || outputs.beamDepth} mm`} />
                  <ResultItem label="Effective Depth" value={`${formatNumber(outputs.effectiveDepth)} mm`} />
                  <ResultItem label="Span" value={`${result.inputs.span} m`} />
                </>
              )}
              {result.type === 'foundation' && (
                <>
                  <ResultItem label="Length" value={`${formatNumber(outputs.length)} m`} />
                  <ResultItem label="Width" value={`${formatNumber(outputs.width)} m`} />
                  <ResultItem label="Depth" value={`${formatNumber(outputs.depth)} mm`} />
                  <ResultItem label="Area" value={`${formatNumber(outputs.area)} m²`} />
                </>
              )}
            </div>
          </div>

          {/* Reinforcement Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Weight className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold">Reinforcement</h3>
            </div>
            <div className="space-y-3">
              {result.type === 'beam' && (
                <>
                  <ReinforcementItem 
                    label="Main Bars (Bottom)" 
                    value={outputs.mainReinforcement as string || `${outputs.mainBars}`} 
                  />
                  <ReinforcementItem 
                    label="Top Bars" 
                    value={outputs.topReinforcement as string || '2Ø12 (nominal)'} 
                  />
                  <ReinforcementItem 
                    label="Stirrups" 
                    value={outputs.stirrups as string || `Ø${outputs.stirrupDia}@${outputs.stirrupSpacing}mm`} 
                  />
                </>
              )}
              {result.type === 'foundation' && (
                <>
                  <ReinforcementItem 
                    label="Bottom X-Direction" 
                    value={outputs.reinforcementX as string} 
                  />
                  <ReinforcementItem 
                    label="Bottom Y-Direction" 
                    value={outputs.reinforcementY as string} 
                  />
                </>
              )}
            </div>
          </div>

          {/* Material Quantities Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold">Material Quantities</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ResultItem 
                label="Concrete" 
                value={`${formatNumber(outputs.concreteVolume)} m³`} 
              />
              <ResultItem 
                label="Steel" 
                value={`${formatNumber(outputs.steelWeight)} kg`} 
              />
              {result.type === 'beam' && (
                <ResultItem 
                  label="Formwork" 
                  value={`${formatNumber(outputs.formworkArea)} m²`} 
                />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">AI Analysis</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Compliance */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Compliance Checks
              </h4>
              <ul className="space-y-2">
                {aiAnalysis.compliance.map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Optimizations */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Optimization Suggestions
              </h4>
              <ul className="space-y-2">
                {aiAnalysis.optimizations.map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-500 mt-1 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cost Estimate */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Cost Estimate (SAR)
              </h4>
              <ul className="space-y-2">
                {aiAnalysis.costEstimate.map((item, i) => (
                  <li key={i} className="text-sm flex items-center justify-between">
                    <span>{item.item}</span>
                    <span className="font-medium">{item.cost.toLocaleString()}</span>
                  </li>
                ))}
                <li className="text-sm flex items-center justify-between pt-2 border-t border-purple-200 dark:border-purple-700">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">
                    {aiAnalysis.costEstimate.reduce((sum, item) => sum + item.cost, 0).toLocaleString()}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const ResultItem = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 bg-muted/30 rounded-lg">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

const ReinforcementItem = ({ label, value }: { label: string; value: string }) => (
  <div className={cn(
    "flex items-center justify-between p-3 rounded-lg",
    "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
  )}>
    <span className="text-sm text-amber-700 dark:text-amber-300">{label}</span>
    <span className="font-mono font-semibold text-amber-900 dark:text-amber-100">{value}</span>
  </div>
);
