import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Calculator, 
  AlertTriangle, 
  Lightbulb, 
  Droplets, 
  Shield,
  Loader2,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AnalysisOptions {
  calculateVolumes: boolean;
  findProblems: boolean;
  suggestOptimizations: boolean;
  checkDrainage: boolean;
  checkCompliance: boolean;
}

interface DesignReviewModeProps {
  onAnalysisComplete: (result: any) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
}

export const DesignReviewMode: React.FC<DesignReviewModeProps> = ({
  onAnalysisComplete,
  isAnalyzing,
  setIsAnalyzing
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [userRequirements, setUserRequirements] = useState('');
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    calculateVolumes: true,
    findProblems: true,
    suggestOptimizations: true,
    checkDrainage: true,
    checkCompliance: true,
  });

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['dxf', 'dwg', 'pdf'].includes(extension || '')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a .dxf, .dwg, or .pdf file',
        variant: 'destructive',
      });
      return;
    }

    setUploadedFile(file);
    setParsedData(null);

    // Read file content
    if (extension === 'dxf') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
        
        // Parse the DXF file
        try {
          const { data, error } = await supabase.functions.invoke('parse-dxf-design', {
            body: { fileContent: content, fileType: 'dxf' }
          });
          
          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          
          setParsedData(data);
          toast({
            title: 'File parsed successfully',
            description: `Found ${data.summary.totalPoints} points, ${data.summary.layerCount} layers`,
          });
        } catch (err) {
          console.error('Parse error:', err);
          toast({
            title: 'Failed to parse file',
            description: err instanceof Error ? err.message : 'Unknown error',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    } else if (extension === 'dwg') {
      toast({
        title: 'DWG format not directly supported',
        description: 'Please save your file as DXF (ASCII) format in AutoCAD',
        variant: 'destructive',
      });
      setUploadedFile(null);
    } else if (extension === 'pdf') {
      toast({
        title: 'PDF support coming soon',
        description: 'For now, please use DXF format',
        variant: 'destructive',
      });
      setUploadedFile(null);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      handleFileSelect({ target: input } as any);
    }
  }, [handleFileSelect]);

  const handleAnalyze = async () => {
    if (!parsedData) {
      toast({
        title: 'No file loaded',
        description: 'Please upload and parse a DXF file first',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-autocad-design', {
        body: {
          parsedData: parsedData.data,
          analysisOptions,
          userRequirements,
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      onAnalysisComplete({
        ...data.analysis,
        parsedData: parsedData.data,
        fileName: uploadedFile?.name,
      });

      toast({
        title: 'Analysis complete!',
        description: `Found ${data.analysis.problemsSummary.critical} critical issues, ${data.analysis.problemsSummary.warnings} warnings`,
      });
    } catch (err) {
      console.error('Analysis error:', err);
      toast({
        title: 'Analysis failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileContent(null);
    setParsedData(null);
  };

  const toggleOption = (option: keyof AnalysisOptions) => {
    setAnalysisOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const triggerFileInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Design File
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".dxf,.dwg,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Drop your AutoCAD file here</p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports .dxf, .dwg, and .pdf files
              </p>
              <Button 
                variant="outline" 
                type="button"
                onClick={triggerFileInput}
              >
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {parsedData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                    ✓ File parsed successfully
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Points:</span>
                      <span className="ml-2 font-medium">{parsedData.summary.totalPoints}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">NGL Points:</span>
                      <span className="ml-2 font-medium">{parsedData.summary.nglPointCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Design Points:</span>
                      <span className="ml-2 font-medium">{parsedData.summary.designPointCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Layers:</span>
                      <span className="ml-2 font-medium">{parsedData.summary.layerCount}</span>
                    </div>
                  </div>
                  {parsedData.terrainAnalysis && (
                    <div className="mt-3 pt-3 border-t border-green-500/20">
                      <p className="text-sm text-muted-foreground">
                        Elevation range: {parsedData.terrainAnalysis.minElevation.toFixed(2)}m - {parsedData.terrainAnalysis.maxElevation.toFixed(2)}m 
                        (avg: {parsedData.terrainAnalysis.avgElevation.toFixed(2)}m)
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Options */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox
                checked={analysisOptions.calculateVolumes}
                onCheckedChange={() => toggleOption('calculateVolumes')}
              />
              <div>
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Calculate Cut/Fill Volumes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compute missing earthwork quantities from NGL vs design levels
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox
                checked={analysisOptions.findProblems}
                onCheckedChange={() => toggleOption('findProblems')}
              />
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Find Design Problems</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Identify earthwork imbalances, steep slopes, and other issues
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox
                checked={analysisOptions.suggestOptimizations}
                onCheckedChange={() => toggleOption('suggestOptimizations')}
              />
              <div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Suggest Cost Optimizations</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI-powered suggestions to reduce costs and improve design
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox
                checked={analysisOptions.checkDrainage}
                onCheckedChange={() => toggleOption('checkDrainage')}
              />
              <div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-500" />
                  <span className="font-medium">Check Drainage Adequacy</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Verify minimum slopes for proper water drainage
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors md:col-span-2">
              <Checkbox
                checked={analysisOptions.checkCompliance}
                onCheckedChange={() => toggleOption('checkCompliance')}
              />
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">Verify Saudi Code Compliance</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Check against MOT standards for road grades, compaction requirements
                </p>
              </div>
            </label>
          </div>

          <div className="pt-4">
            <Label htmlFor="requirements" className="text-sm font-medium mb-2 block">
              Specific Concerns or Requirements (Optional)
            </Label>
            <Textarea
              id="requirements"
              placeholder="E.g., 'Focus on the north-east corner slopes', 'Check if we can reduce fill volume', 'Verify accessibility ramps meet 5% max grade'"
              value={userRequirements}
              onChange={(e) => setUserRequirements(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!parsedData || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Design with AI...
              </>
            ) : (
              <>
                <Lightbulb className="mr-2 h-5 w-5" />
                Analyze Design with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
