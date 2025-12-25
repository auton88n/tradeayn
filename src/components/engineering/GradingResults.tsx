import React from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Point {
  id: string;
  x: number;
  y: number;
  z: number;
  fgl?: number;
  cutFill?: number;
}

interface GradingDesign {
  designElevation: number;
  slopeDirection: string;
  slopePercentage: number;
  gradingZones?: Array<{
    name: string;
    area: number;
    nglAvg: number;
    fglTarget: number;
    cutVolume: number;
    fillVolume: number;
  }>;
  totalCutVolume: number;
  totalFillVolume: number;
  netVolume: number;
  designNotes: string[];
  drainageRecommendations: string;
  compactionRequirements: string;
}

interface CostBreakdown {
  excavation: number;
  fill: number;
  compaction: number;
  disposal: number;
  surveying: number;
}

interface GradingResultsProps {
  design: GradingDesign | null;
  costBreakdown: CostBreakdown | null;
  totalCost: number;
  fglPoints: Point[];
  projectName: string;
}

export const GradingResults: React.FC<GradingResultsProps> = ({
  design,
  costBreakdown,
  totalCost,
  fglPoints,
  projectName,
}) => {
  const [exporting, setExporting] = React.useState(false);

  const handleExportDXF = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-grading-dxf', {
        body: { points: fglPoints, design, projectName }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Download the DXF file
      const blob = new Blob([data.dxfContent], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'DXF exported successfully',
        description: `Downloaded ${data.fileName}`,
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  if (!design) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Generate a grading design to see results</p>
        </div>
      </Card>
    );
  }

  const netVolumeLabel = design.netVolume > 0 ? 'Excess Cut' : 'Import Required';
  const netVolumeColor = design.netVolume > 0 ? 'text-amber-500' : 'text-blue-500';

  return (
    <div className="space-y-4">
      {/* Volume Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Earthwork Volumes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-500">Total Cut</span>
            </div>
            <p className="text-2xl font-bold">{design.totalCutVolume?.toLocaleString()} m³</p>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">Total Fill</span>
            </div>
            <p className="text-2xl font-bold">{design.totalFillVolume?.toLocaleString()} m³</p>
          </div>
          
          <div className={`bg-muted/50 border rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-5 h-5 ${netVolumeColor}`} />
              <span className={`text-sm font-medium ${netVolumeColor}`}>{netVolumeLabel}</span>
            </div>
            <p className="text-2xl font-bold">{Math.abs(design.netVolume)?.toLocaleString()} m³</p>
          </div>
        </div>
      </Card>

      {/* Design Parameters */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Design Parameters</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Design Elevation</p>
            <p className="text-lg font-semibold">{design.designElevation?.toFixed(2)}m</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Slope Direction</p>
            <p className="text-lg font-semibold">{design.slopeDirection}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Slope Percentage</p>
            <p className="text-lg font-semibold">{design.slopePercentage}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Points Processed</p>
            <p className="text-lg font-semibold">{fglPoints.length}</p>
          </div>
        </div>
      </Card>

      {/* Cost Breakdown */}
      {costBreakdown && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Cost Estimate (SAR)
          </h3>
          <div className="space-y-3">
            {Object.entries(costBreakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium">{value.toLocaleString()} SAR</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t-2 border-primary">
              <span className="font-semibold text-lg">Total Estimated Cost</span>
              <span className="font-bold text-xl text-primary">{totalCost.toLocaleString()} SAR</span>
            </div>
          </div>
        </Card>
      )}

      {/* Design Notes */}
      {design.designNotes && design.designNotes.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">AI Design Notes</h3>
          <ul className="space-y-2">
            {design.designNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">{note}</span>
              </li>
            ))}
          </ul>
          
          {design.drainageRecommendations && (
            <div className="mt-4 pt-4 border-t">
              <p className="font-medium mb-1">Drainage Recommendations:</p>
              <p className="text-sm text-muted-foreground">{design.drainageRecommendations}</p>
            </div>
          )}
          
          {design.compactionRequirements && (
            <div className="mt-3">
              <p className="font-medium mb-1">Compaction Requirements:</p>
              <p className="text-sm text-muted-foreground">{design.compactionRequirements}</p>
            </div>
          )}
        </Card>
      )}

      {/* Export Button */}
      <Button
        onClick={handleExportDXF}
        disabled={exporting}
        className="w-full"
        size="lg"
      >
        {exporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Generating DXF...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Export to DXF (AutoCAD)
          </>
        )}
      </Button>
    </div>
  );
};
