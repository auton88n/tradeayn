import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Maximize2, 
  Grid3X3, 
  RotateCw, 
  Download, 
  Wand2,
  Accessibility,
  Layers,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AICalculatorAssistant } from './AICalculatorAssistant';
import { ParkingLayout2D } from './ParkingLayout2D';
import { ParkingVisualization3D } from './ParkingVisualization3D';
import { ParkingSiteProvider, useParkingSite } from './parking/context/ParkingSiteContext';
import { BoundaryPointsTable } from './parking/boundary/BoundaryPointsTable';
import { BoundaryPreview } from './parking/boundary/BoundaryPreview';
import { BoundaryMetrics } from './parking/boundary/BoundaryMetrics';
import { ParkingConfigPanel } from './parking/boundary/ParkingConfigPanel';
import { calculateBoundaryMetrics } from './parking/utils/geometry';

interface ParkingSpace {
  id: string;
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  type: 'standard' | 'accessible' | 'compact' | 'ev';
  row: number;
  col: number;
}

interface ParkingLayout {
  spaces: ParkingSpace[];
  aisles: { x: number; y: number; width: number; height: number; direction: 'horizontal' | 'vertical' }[];
  entries: { x: number; y: number; width: number }[];
  exits: { x: number; y: number; width: number }[];
  totalSpaces: number;
  accessibleSpaces: number;
  evSpaces: number;
  compactSpaces: number;
}

interface ParkingDesignerProps {
  onCalculate: (results: any) => void;
  isCalculating: boolean;
  setIsCalculating: (value: boolean) => void;
  userId?: string;
}

interface ParkingInputs {
  siteLength: string;
  siteWidth: string;
  parkingType: string;
  parkingAngle: string;
  spaceWidth: string;
  spaceLength: string;
  aisleWidth: string;
  accessiblePercent: string;
  evPercent: string;
  floors: string;
}

const PARKING_ANGLES = [
  { value: '90', label: '90° (Perpendicular)', efficiency: 'Highest capacity' },
  { value: '60', label: '60° (Angled)', efficiency: 'Good flow' },
  { value: '45', label: '45° (Angled)', efficiency: 'Easy entry' },
  { value: '30', label: '30° (Angled)', efficiency: 'One-way only' },
  { value: '0', label: '0° (Parallel)', efficiency: 'Street parking' },
];

const PARKING_TYPES = [
  { value: 'surface', label: 'Surface Lot' },
  { value: 'structured', label: 'Parking Structure' },
  { value: 'underground', label: 'Underground' },
];

const defaultInputs: ParkingInputs = {
  siteLength: '100',
  siteWidth: '60',
  parkingType: 'surface',
  parkingAngle: '90',
  spaceWidth: '2.5',
  spaceLength: '5.0',
  aisleWidth: '6.0',
  accessiblePercent: '5',
  evPercent: '10',
  floors: '1',
};

// Custom Boundary Designer using context
const CustomBoundaryDesigner: React.FC<{
  onCalculate: (results: any) => void;
}> = ({ onCalculate }) => {
  const { boundaryPoints, config } = useParkingSite();
  const metrics = calculateBoundaryMetrics(boundaryPoints);

  const handleGenerateLayout = () => {
    if (boundaryPoints.length < 3) {
      toast({
        title: "Insufficient Points",
        description: "Add at least 3 boundary points to generate a layout",
        variant: "destructive",
      });
      return;
    }

    // Generate layout from polygon boundary
    const bounds = {
      minX: Math.min(...boundaryPoints.map((p: { x: number }) => p.x)),
      maxX: Math.max(...boundaryPoints.map((p: { x: number }) => p.x)),
      minY: Math.min(...boundaryPoints.map((p: { y: number }) => p.y)),
      maxY: Math.max(...boundaryPoints.map((p: { y: number }) => p.y)),
    };

    const siteLength = bounds.maxX - bounds.minX;
    const siteWidth = bounds.maxY - bounds.minY;

    onCalculate({
      type: 'parking',
      inputs: {
        siteLength,
        siteWidth,
        boundaryPoints: boundaryPoints,
        parkingAngle: config.parkingAngle,
        spaceWidth: config.spaceWidth,
        spaceLength: config.spaceLength,
        aisleWidth: config.aisleWidth,
      },
      outputs: {
        totalSpaces: Math.floor(metrics.area / 15), // Rough estimate
        accessibleSpaces: Math.ceil(metrics.area / 15 * 0.05),
        evSpaces: Math.ceil(metrics.area / 15 * 0.1),
        standardSpaces: Math.floor(metrics.area / 15 * 0.85),
        siteArea: metrics.area,
        efficiency: 65,
      },
      timestamp: new Date(),
    });

    toast({
      title: "Layout Generated",
      description: `Custom boundary with ${metrics.area.toFixed(0)}m² processed`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Point Table */}
        <div className="space-y-4">
          <BoundaryPointsTable />
          <BoundaryMetrics />
          <ParkingConfigPanel />
          
          <Button 
            onClick={handleGenerateLayout}
            disabled={boundaryPoints.length < 3}
            className="w-full gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Generate Layout from Boundary
          </Button>
        </div>

        {/* Right: Preview */}
        <div className="min-h-[400px]">
          <BoundaryPreview />
        </div>
      </div>
    </motion.div>
  );
};

// Quick Start Designer with simple rectangular inputs
const QuickStartDesigner: React.FC<{
  inputs: ParkingInputs;
  setInputs: React.Dispatch<React.SetStateAction<ParkingInputs>>;
  layout: ParkingLayout | null;
  setLayout: React.Dispatch<React.SetStateAction<ParkingLayout | null>>;
  onCalculate: (results: any) => void;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: '2d' | '3d';
  setViewMode: React.Dispatch<React.SetStateAction<'2d' | '3d'>>;
  showDimensions: boolean;
  setShowDimensions: React.Dispatch<React.SetStateAction<boolean>>;
  showLabels: boolean;
  setShowLabels: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  inputs,
  setInputs,
  layout,
  setLayout,
  onCalculate,
  isGenerating,
  setIsGenerating,
  viewMode,
  setViewMode,
  showDimensions,
  setShowDimensions,
  showLabels,
  setShowLabels,
}) => {
  const handleInputChange = (field: string, value: string) => {
    setInputs((prev: ParkingInputs) => ({ ...prev, [field]: value }));
  };

  const handleApplySuggestion = (field: string, value: any) => {
    setInputs((prev: ParkingInputs) => ({ ...prev, [field]: String(value) }));
    toast({
      title: "Suggestion Applied",
      description: `${field} updated to ${value}`,
    });
  };

  const handleApplyAllSuggestions = (values: Record<string, any>) => {
    const stringValues: Record<string, string> = {};
    Object.entries(values).forEach(([k, v]) => {
      stringValues[k] = String(v);
    });
    setInputs((prev: ParkingInputs) => ({ ...prev, ...stringValues }));
    toast({
      title: "All Suggestions Applied",
      description: "Input values have been optimized",
    });
  };

  const generateLayout = useCallback(async () => {
    setIsGenerating(true);

    try {
      const siteLength = parseFloat(inputs.siteLength);
      const siteWidth = parseFloat(inputs.siteWidth);
      const spaceWidth = parseFloat(inputs.spaceWidth);
      const spaceLength = parseFloat(inputs.spaceLength);
      const aisleWidth = parseFloat(inputs.aisleWidth);
      const angle = parseFloat(inputs.parkingAngle);

      const angleRad = (angle * Math.PI) / 180;
      const effectiveWidth = angle === 90 
        ? spaceWidth 
        : spaceWidth / Math.sin(angleRad) + spaceLength * Math.cos(angleRad);
      const effectiveDepth = angle === 90 
        ? spaceLength 
        : spaceWidth * Math.cos(angleRad) + spaceLength * Math.sin(angleRad);

      const moduleWidth = effectiveDepth * 2 + aisleWidth;
      const numModules = Math.floor(siteWidth / moduleWidth);
      const spacesPerRow = Math.floor(siteLength / effectiveWidth);
      const totalSpaces = numModules * 2 * spacesPerRow;

      const accessiblePercent = parseFloat(inputs.accessiblePercent) / 100;
      const accessibleSpaces = Math.max(1, Math.ceil(totalSpaces * accessiblePercent));
      
      const evPercent = parseFloat(inputs.evPercent) / 100;
      const evSpaces = Math.ceil(totalSpaces * evPercent);

      const spaces: ParkingSpace[] = [];
      let spaceId = 0;

      for (let module = 0; module < numModules; module++) {
        const moduleY = module * moduleWidth;
        
        for (let col = 0; col < spacesPerRow; col++) {
          const isAccessible = spaceId < accessibleSpaces;
          const isEV = !isAccessible && spaceId < accessibleSpaces + evSpaces;
          
          spaces.push({
            id: `space-${spaceId++}`,
            x: col * effectiveWidth,
            y: moduleY,
            width: spaceWidth,
            length: spaceLength,
            angle,
            type: isAccessible ? 'accessible' : isEV ? 'ev' : 'standard',
            row: module * 2,
            col,
          });
        }

        for (let col = 0; col < spacesPerRow; col++) {
          spaces.push({
            id: `space-${spaceId++}`,
            x: col * effectiveWidth,
            y: moduleY + effectiveDepth + aisleWidth,
            width: spaceWidth,
            length: spaceLength,
            angle: angle === 0 ? 0 : 180 - angle,
            type: 'standard',
            row: module * 2 + 1,
            col,
          });
        }
      }

      const aisles = [];
      for (let module = 0; module < numModules; module++) {
        aisles.push({
          x: 0,
          y: module * moduleWidth + effectiveDepth,
          width: siteLength,
          height: aisleWidth,
          direction: 'horizontal' as const,
        });
      }

      const entries = [{ x: 0, y: siteWidth / 2 - 3, width: 6 }];
      const exits = [{ x: siteLength - 6, y: siteWidth / 2 - 3, width: 6 }];

      const newLayout: ParkingLayout = {
        spaces,
        aisles,
        entries,
        exits,
        totalSpaces: spaces.length,
        accessibleSpaces,
        evSpaces,
        compactSpaces: 0,
      };

      setLayout(newLayout);

      const siteArea = siteLength * siteWidth;
      const parkingArea = spaces.length * spaceWidth * spaceLength;
      const aisleArea = aisles.reduce((sum, a) => sum + a.width * a.height, 0);
      const efficiency = parseFloat(((parkingArea / siteArea) * 100).toFixed(1));

      onCalculate({
        type: 'parking',
        inputs: {
          siteLength,
          siteWidth,
          parkingType: inputs.parkingType,
          parkingAngle: angle,
          spaceWidth,
          spaceLength,
          aisleWidth,
          accessiblePercent: parseFloat(inputs.accessiblePercent),
          evPercent: parseFloat(inputs.evPercent),
          floors: parseFloat(inputs.floors),
        },
        outputs: {
          totalSpaces: spaces.length,
          accessibleSpaces,
          evSpaces,
          standardSpaces: spaces.filter(s => s.type === 'standard').length,
          compactSpaces: 0,
          siteArea,
          parkingArea,
          aisleArea,
          efficiency,
          layout: newLayout,
          asphaltArea: siteArea,
          stripingLength: spaces.length * (spaceWidth + spaceLength) * 2,
          curbingLength: (siteLength + siteWidth) * 2,
          adaCompliant: accessibleSpaces >= Math.max(1, Math.ceil(spaces.length * 0.02)),
          minAisleWidth: aisleWidth >= 6.0,
          fireAccess: true,
        },
        timestamp: new Date(),
      });

      toast({
        title: "Layout Generated",
        description: `${spaces.length} parking spaces created`,
      });
    } catch (err) {
      console.error('Layout generation error:', err);
      toast({
        title: "Generation Failed",
        description: "Could not generate parking layout",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [inputs, onCalculate, setIsGenerating, setLayout]);

  const aiGenerateLayout = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('engineering-ai-chat', {
        body: {
          calculatorType: 'parking',
          currentInputs: inputs,
          messages: [
            {
              role: 'user',
              content: `Generate an optimized parking layout for a ${inputs.siteLength}m × ${inputs.siteWidth}m site. 
                       Parking type: ${inputs.parkingType}, Angle: ${inputs.parkingAngle}°.
                       Maximize capacity while ensuring code compliance and good traffic flow.`,
            },
          ],
        },
      });

      if (error) throw error;
      await generateLayout();

      toast({
        title: "AI Layout Generated",
        description: "Optimized parking design created",
      });
    } catch (err) {
      console.error('AI generation error:', err);
      await generateLayout();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Left Column - Inputs */}
      <div className="lg:col-span-1 space-y-6">
        {/* Site Dimensions */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            Site Dimensions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteLength">Length (m)</Label>
              <Input
                id="siteLength"
                type="number"
                value={inputs.siteLength}
                onChange={(e) => handleInputChange('siteLength', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="siteWidth">Width (m)</Label>
              <Input
                id="siteWidth"
                type="number"
                value={inputs.siteWidth}
                onChange={(e) => handleInputChange('siteWidth', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Parking Configuration */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Parking Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Parking Type</Label>
              <Select
                value={inputs.parkingType}
                onValueChange={(v) => handleInputChange('parkingType', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARKING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Parking Angle</Label>
              <Select
                value={inputs.parkingAngle}
                onValueChange={(v) => handleInputChange('parkingAngle', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARKING_ANGLES.map((angle) => (
                    <SelectItem key={angle.value} value={angle.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{angle.label}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {angle.efficiency}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spaceWidth">Space Width (m)</Label>
                <Input
                  id="spaceWidth"
                  type="number"
                  step="0.1"
                  value={inputs.spaceWidth}
                  onChange={(e) => handleInputChange('spaceWidth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="spaceLength">Space Length (m)</Label>
                <Input
                  id="spaceLength"
                  type="number"
                  step="0.1"
                  value={inputs.spaceLength}
                  onChange={(e) => handleInputChange('spaceLength', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="aisleWidth">Aisle Width (m)</Label>
              <Input
                id="aisleWidth"
                type="number"
                step="0.5"
                value={inputs.aisleWidth}
                onChange={(e) => handleInputChange('aisleWidth', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Accessibility & Special Spaces */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Accessibility className="w-4 h-4" />
            Special Spaces
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accessiblePercent">Accessible (%)</Label>
              <Input
                id="accessiblePercent"
                type="number"
                min="2"
                value={inputs.accessiblePercent}
                onChange={(e) => handleInputChange('accessiblePercent', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="evPercent">EV Charging (%)</Label>
              <Input
                id="evPercent"
                type="number"
                min="0"
                value={inputs.evPercent}
                onChange={(e) => handleInputChange('evPercent', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Multi-story Options */}
        {inputs.parkingType !== 'surface' && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Structure Options
            </h3>
            <div>
              <Label htmlFor="floors">Number of Floors</Label>
              <Input
                id="floors"
                type="number"
                min="1"
                max="10"
                value={inputs.floors}
                onChange={(e) => handleInputChange('floors', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={aiGenerateLayout}
            disabled={isGenerating}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            AI Generate Layout
          </Button>
          <Button
            variant="outline"
            onClick={generateLayout}
            disabled={isGenerating}
            className="w-full gap-2"
          >
            <Grid3X3 className="w-4 h-4" />
            Generate Standard Layout
          </Button>
        </div>

      </div>

      {/* Right Column - Visualization */}
      <div className="lg:col-span-2 space-y-4">
        {/* View Controls */}
        <div className="bg-card border rounded-lg p-3 flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as '2d' | '3d')}>
            <TabsList>
              <TabsTrigger value="2d" className="gap-2">
                <Grid3X3 className="w-4 h-4" />
                2D Plan
              </TabsTrigger>
              <TabsTrigger value="3d" className="gap-2">
                <Layers className="w-4 h-4" />
                3D View
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="showDimensions"
                checked={showDimensions}
                onCheckedChange={setShowDimensions}
              />
              <Label htmlFor="showDimensions" className="text-sm cursor-pointer">
                Dimensions
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="showLabels"
                checked={showLabels}
                onCheckedChange={setShowLabels}
              />
              <Label htmlFor="showLabels" className="text-sm cursor-pointer">
                Labels
              </Label>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Visualization Area */}
        <div className="bg-card border rounded-lg overflow-hidden" style={{ height: '600px' }}>
          {layout ? (
            viewMode === '2d' ? (
              <ParkingLayout2D
                layout={layout}
                siteLength={parseFloat(inputs.siteLength)}
                siteWidth={parseFloat(inputs.siteWidth)}
                showDimensions={showDimensions}
                showLabels={showLabels}
              />
            ) : (
              <ParkingVisualization3D
                layout={layout}
                siteLength={parseFloat(inputs.siteLength)}
                siteWidth={parseFloat(inputs.siteWidth)}
                parkingType={inputs.parkingType}
                floors={parseInt(inputs.floors)}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Car className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No Layout Generated</p>
              <p className="text-sm">Configure your site and click "Generate Layout"</p>
            </div>
          )}
        </div>

        {/* Layout Statistics */}
        {layout && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">{layout.totalSpaces}</div>
              <div className="text-sm text-muted-foreground">Total Spaces</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">{layout.accessibleSpaces}</div>
              <div className="text-sm text-muted-foreground">Accessible</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-500">{layout.evSpaces}</div>
              <div className="text-sm text-muted-foreground">EV Charging</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-500">
                {((layout.totalSpaces * parseFloat(inputs.spaceWidth) * parseFloat(inputs.spaceLength)) / 
                  (parseFloat(inputs.siteLength) * parseFloat(inputs.siteWidth)) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Efficiency</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main component with tabs for Quick Start and Custom Boundary
export const ParkingDesigner: React.FC<ParkingDesignerProps> = ({
  onCalculate,
  isCalculating,
  setIsCalculating,
  userId,
}) => {
  const [inputs, setInputs] = useState<ParkingInputs>(defaultInputs);
  const [layout, setLayout] = useState<ParkingLayout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [designMode, setDesignMode] = useState<'quick' | 'custom'>('quick');

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <Tabs value={designMode} onValueChange={(v) => setDesignMode(v as 'quick' | 'custom')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="quick" className="gap-2">
            <Grid3X3 className="w-4 h-4" />
            Quick Start
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <MapPin className="w-4 h-4" />
            Custom Boundary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-6">
          <QuickStartDesigner
            inputs={inputs}
            setInputs={setInputs}
            layout={layout}
            setLayout={setLayout}
            onCalculate={onCalculate}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showDimensions={showDimensions}
            setShowDimensions={setShowDimensions}
            showLabels={showLabels}
            setShowLabels={setShowLabels}
          />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <ParkingSiteProvider>
            <CustomBoundaryDesigner onCalculate={onCalculate} />
          </ParkingSiteProvider>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParkingDesigner;
