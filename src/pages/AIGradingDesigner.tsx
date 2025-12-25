import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mountain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { SurveyUploader } from '@/components/engineering/SurveyUploader';
import { GradingRequirements } from '@/components/engineering/GradingRequirements';
import { TerrainVisualization3D } from '@/components/engineering/TerrainVisualization3D';
import { GradingResults } from '@/components/engineering/GradingResults';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';

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

const AIGradingDesigner: React.FC = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('Untitled Project');
  const [points, setPoints] = useState<SurveyPoint[]>([]);
  const [terrainAnalysis, setTerrainAnalysis] = useState<TerrainAnalysis | null>(null);
  const [requirements, setRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [design, setDesign] = useState<any>(null);
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [fglPoints, setFglPoints] = useState<SurveyPoint[]>([]);

  const handleUploadComplete = (uploadedPoints: SurveyPoint[], analysis: TerrainAnalysis) => {
    setPoints(uploadedPoints);
    setTerrainAnalysis(analysis);
    setDesign(null);
    setFglPoints([]);
  };

  const handleGenerateDesign = async () => {
    if (!terrainAnalysis || points.length === 0) {
      toast({
        title: 'Upload survey data first',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-grading-design', {
        body: { 
          points, 
          terrainAnalysis, 
          requirements: requirements || 'Standard site grading for construction with proper drainage'
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setDesign(data.design);
      setCostBreakdown(data.costBreakdown);
      setTotalCost(data.totalCost);
      setFglPoints(data.fglPoints);

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

  return (
    <>
      <SEO 
        title="AI Grading Designer - Civil Engineering"
        description="AI-powered site grading design tool. Upload survey data, describe requirements, get automatic cut/fill calculations and DXF exports."
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate('/engineering')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                    <Mountain className="h-5 w-5 text-white" />
                  </div>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="text-lg font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 max-w-[300px]"
                    placeholder="Project Name"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>AI-Powered Grading Design</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Input */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SurveyUploader 
                  onUploadComplete={handleUploadComplete}
                  isLoading={isGenerating}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GradingRequirements
                  requirements={requirements}
                  onRequirementsChange={setRequirements}
                  onGenerate={handleGenerateDesign}
                  isGenerating={isGenerating}
                  hasPoints={points.length > 0}
                />
              </motion.div>
            </div>

            {/* Right Column - Visualization & Results */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <TerrainVisualization3D 
                  points={fglPoints.length > 0 ? fglPoints : points}
                  showFGL={fglPoints.length > 0}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <GradingResults
                  design={design}
                  costBreakdown={costBreakdown}
                  totalCost={totalCost}
                  fglPoints={fglPoints}
                  projectName={projectName}
                />
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AIGradingDesigner;
