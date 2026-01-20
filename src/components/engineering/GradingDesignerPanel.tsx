import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mountain, Sparkles, PlusCircle, FileSearch } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SurveyUploader } from '@/components/engineering/SurveyUploader';
import { GradingRequirements } from '@/components/engineering/GradingRequirements';
import { TerrainVisualization3D } from '@/components/engineering/TerrainVisualization3D';
import { GradingResults } from '@/components/engineering/GradingResults';
import { DesignReviewMode } from '@/components/engineering/DesignReviewMode';
import { DesignAnalysisResults } from '@/components/engineering/DesignAnalysisResults';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface SurveyPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  fgl?: number;
  cutFill?: number;
}

interface TerrainAnalysis {
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

interface GradingDesignerPanelProps {
  onInputChange?: (inputs: Record<string, any>) => void;
}

const GradingDesignerPanel: React.FC<GradingDesignerPanelProps> = ({ onInputChange }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [projectName, setProjectName] = useState('Untitled Project');
  
  // Create mode state
  const [points, setPoints] = useState<SurveyPoint[]>([]);
  const [terrainAnalysis, setTerrainAnalysis] = useState<TerrainAnalysis | null>(null);
  const [requirements, setRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [design, setDesign] = useState<any>(null);
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [fglPoints, setFglPoints] = useState<SurveyPoint[]>([]);

  // Review mode state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isApplyingOptimizations, setIsApplyingOptimizations] = useState(false);

  const handleUploadComplete = (uploadedPoints: SurveyPoint[], analysis: TerrainAnalysis) => {
    setPoints(uploadedPoints);
    setTerrainAnalysis(analysis);
    setDesign(null);
    setFglPoints([]);
    
    // Notify parent of input change for preview
    onInputChange?.({
      points: uploadedPoints,
      terrainAnalysis: analysis,
      projectName,
    });
  };

  const handleGenerateDesign = async () => {
    if (!terrainAnalysis || points.length === 0) {
      toast({ title: 'Upload survey data first', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-grading-design', {
        body: { points, terrainAnalysis, requirements: requirements || 'Standard site grading for construction with proper drainage' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setDesign(data.design);
      setCostBreakdown(data.costBreakdown);
      setTotalCost(data.totalCost);
      setFglPoints(data.fglPoints);

      // Update inputs to trigger preview update
      onInputChange?.({
        points,
        terrainAnalysis,
        fglPoints: data.fglPoints,
        design: data.design,
        projectName,
      });

      toast({
        title: 'Grading design generated!',
        description: `Cut: ${data.design.totalCutVolume?.toLocaleString()} m³, Fill: ${data.design.totalFillVolume?.toLocaleString()} m³`,
      });
    } catch (err) {
      console.error('Generation error:', err);
      toast({
        title: 'Failed to generate design',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
  };

  const handleApplyOptimizations = async (optimizations: any[]) => {
    if (!analysisResult?.parsedData) return;

    setIsApplyingOptimizations(true);
    try {
      const { data, error } = await supabase.functions.invoke('apply-design-optimizations', {
        body: {
          parsedData: analysisResult.parsedData,
          optimizations,
          projectName,
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Download the optimized DXF
      const blob = new Blob([data.dxfContent], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Optimizations applied!',
        description: `Saved ${data.comparison.improvement.costSavings.toLocaleString()} SAR. DXF downloaded.`,
      });
    } catch (err) {
      console.error('Optimization error:', err);
      toast({
        title: 'Failed to apply optimizations',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingOptimizations(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
          <Mountain className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs text-muted-foreground">AI-Powered</span>
          </div>
          <Label className="text-xs text-muted-foreground">Project Name</Label>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-lg font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
            placeholder="Project Name"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="flex items-center gap-2 text-xs">
            <PlusCircle className="h-3 w-3" />
            Create New
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2 text-xs">
            <FileSearch className="h-3 w-3" />
            Review Existing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <SurveyUploader onUploadComplete={handleUploadComplete} isLoading={isGenerating} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GradingRequirements
              requirements={requirements}
              onRequirementsChange={setRequirements}
              onGenerate={handleGenerateDesign}
              isGenerating={isGenerating}
              hasPoints={points.length > 0}
            />
          </motion.div>
          {design && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GradingResults 
                design={design} 
                costBreakdown={costBreakdown} 
                totalCost={totalCost} 
                fglPoints={fglPoints} 
                projectName={projectName} 
              />
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <DesignReviewMode
            onAnalysisComplete={handleAnalysisComplete}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
          />
          {analysisResult && (
            <DesignAnalysisResults
              result={analysisResult}
              onApplyOptimizations={handleApplyOptimizations}
              isApplying={isApplyingOptimizations}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GradingDesignerPanel;
