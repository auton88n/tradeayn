import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Maximize2, 
  RotateCw, 
  Wand2,
  Accessibility,
  Layers,
  Zap,
  MapPin,
  Info,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ParkingLayout2D } from './ParkingLayout2D';
import { ParkingVisualization3D } from './ParkingVisualization3D';
import { ParkingSiteProvider, useParkingSite } from './parking/context/ParkingSiteContext';
import { BoundaryPointsTable } from './parking/boundary/BoundaryPointsTable';
import { BoundaryPreview } from './parking/boundary/BoundaryPreview';
import { BoundaryMetrics } from './parking/boundary/BoundaryMetrics';
import { calculateBoundaryMetrics } from './parking/utils/geometry';
import { InputSection } from './ui';
import { AnglePicker, ParkingStatsBar } from './parking/components';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
  parkingAngle: number;
  spaceWidth: string;
  spaceLength: string;
  aisleWidth: string;
  accessiblePercent: number;
  evPercent: number;
  compactPercent: number;
  floors: string;
  siteMode: 'rectangle' | 'polygon';
}

const PARKING_TYPES = [
  { value: 'surface', label: 'Surface Lot', icon: '🅿️' },
  { value: 'structured', label: 'Parking Structure', icon: '🏢' },
  { value: 'underground', label: 'Underground', icon: '⬇️' },
];

const defaultInputs: ParkingInputs = {
  siteLength: '100',
  siteWidth: '60',
  parkingType: 'surface',
  parkingAngle: 90,
  spaceWidth: '2.5',
  spaceLength: '5.0',
  aisleWidth: '6.0',
  accessiblePercent: 5,
  evPercent: 10,
  compactPercent: 0,
  floors: '1',
  siteMode: 'rectangle',
};

// Tooltip helper
const InfoTooltip: React.FC<{ content: string }> = ({ content }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help ml-1" />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[200px]">
        <p className="text-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Slider with percentage label
const PercentSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ReactNode;
  color: string;
  tooltip: string;
  min?: number;
  max?: number;
}> = ({ label, value, onChange, icon, color, tooltip, min = 0, max = 30 }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-md", color)}>
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
        <InfoTooltip content={tooltip} />
      </div>
      <Badge variant="secondary" className="text-xs">
        {value}%
      </Badge>
    </div>
    <Slider
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={min}
      max={max}
      step={1}
      className="w-full"
    />
  </div>
);

// Unified Designer Content
const UnifiedDesigner: React.FC<{
  inputs: ParkingInputs;
  setInputs: React.Dispatch<React.SetStateAction<ParkingInputs>>;
  layout: ParkingLayout | null;
  setLayout: React.Dispatch<React.SetStateAction<ParkingLayout | null>>;
  onCalculate: (results: any) => void;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: '2d' | '3d';
  setViewMode: React.Dispatch<React.SetStateAction<'2d' | '3d'>>;
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
}) => {
  const handleInputChange = (field: string, value: string | number) => {
    setInputs((prev: ParkingInputs) => ({ ...prev, [field]: value }));
  };

  const generateLayout = useCallback(async () => {
    setIsGenerating(true);

    try {
      const siteLength = parseFloat(inputs.siteLength);
      const siteWidth = parseFloat(inputs.siteWidth);
      const spaceWidth = parseFloat(inputs.spaceWidth);
      const spaceLength = parseFloat(inputs.spaceLength);
      const aisleWidth = parseFloat(inputs.aisleWidth);
      const angle = inputs.parkingAngle;

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

      const accessiblePercent = inputs.accessiblePercent / 100;
      const accessibleSpaces = Math.max(1, Math.ceil(totalSpaces * accessiblePercent));
      
      const evPercent = inputs.evPercent / 100;
      const evSpaces = Math.ceil(totalSpaces * evPercent);

      const compactPercent = inputs.compactPercent / 100;
      const compactSpaces = Math.ceil(totalSpaces * compactPercent);

      const spaces: ParkingSpace[] = [];
      let spaceId = 0;

      for (let module = 0; module < numModules; module++) {
        const moduleY = module * moduleWidth;
        
        for (let col = 0; col < spacesPerRow; col++) {
          const isAccessible = spaceId < accessibleSpaces;
          const isEV = !isAccessible && spaceId < accessibleSpaces + evSpaces;
          const isCompact = !isAccessible && !isEV && spaceId < accessibleSpaces + evSpaces + compactSpaces;
          
          spaces.push({
            id: `space-${spaceId++}`,
            x: col * effectiveWidth,
            y: moduleY,
            width: isCompact ? spaceWidth * 0.85 : spaceWidth,
            length: spaceLength,
            angle,
            type: isAccessible ? 'accessible' : isEV ? 'ev' : isCompact ? 'compact' : 'standard',
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
        compactSpaces,
      };

      setLayout(newLayout);

      const siteArea = siteLength * siteWidth;
      const parkingArea = spaces.length * spaceWidth * spaceLength;
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
          accessiblePercent: inputs.accessiblePercent,
          evPercent: inputs.evPercent,
          floors: parseFloat(inputs.floors),
        },
        outputs: {
          totalSpaces: spaces.length,
          accessibleSpaces,
          evSpaces,
          standardSpaces: spaces.filter(s => s.type === 'standard').length,
          compactSpaces,
          siteArea,
          parkingArea,
          efficiency,
          layout: newLayout,
        },
        timestamp: new Date(),
      });

      toast({
        title: "Layout Generated",
        description: `${spaces.length} parking spaces created with ${efficiency}% efficiency`,
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

  // Auto-generate on mount with default values
  useEffect(() => {
    if (!layout) {
      generateLayout();
    }
  }, []);

  const stats = layout ? {
    totalSpaces: layout.totalSpaces,
    accessibleSpaces: layout.accessibleSpaces,
    evSpaces: layout.evSpaces,
    efficiency: Math.round((layout.totalSpaces * parseFloat(inputs.spaceWidth) * parseFloat(inputs.spaceLength)) / 
      (parseFloat(inputs.siteLength) * parseFloat(inputs.siteWidth)) * 100),
  } : {
    totalSpaces: 0,
    accessibleSpaces: 0,
    evSpaces: 0,
    efficiency: 0,
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Form Section - Full Width */}
      <div className="space-y-4 pb-6">
        {/* Site Definition */}
        <InputSection 
          title="Site Definition" 
          icon={Maximize2}
          defaultOpen={true}
        >
          {/* Site Mode Toggle */}
          <div className="flex items-center gap-4 mb-4 p-2 bg-muted/30 rounded-lg">
            <button
              onClick={() => handleInputChange('siteMode', 'rectangle')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                inputs.siteMode === 'rectangle' 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Maximize2 className="w-4 h-4" />
              Rectangle
            </button>
            <button
              onClick={() => handleInputChange('siteMode', 'polygon')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                inputs.siteMode === 'polygon' 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MapPin className="w-4 h-4" />
              Polygon
            </button>
          </div>

          {inputs.siteMode === 'rectangle' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="siteLength" className="text-xs text-muted-foreground">
                  Length (m)
                </Label>
                <Input
                  id="siteLength"
                  type="number"
                  value={inputs.siteLength}
                  onChange={(e) => handleInputChange('siteLength', e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="siteWidth" className="text-xs text-muted-foreground">
                  Width (m)
                </Label>
                <Input
                  id="siteWidth"
                  type="number"
                  value={inputs.siteWidth}
                  onChange={(e) => handleInputChange('siteWidth', e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Polygon boundary mode</p>
              <p className="text-xs">Click on the preview to add points</p>
            </div>
          )}

          {/* Site area display */}
          <div className="mt-3 p-2 bg-muted/30 rounded-lg flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Site Area</span>
            <span className="text-sm font-medium">
              {(parseFloat(inputs.siteLength) * parseFloat(inputs.siteWidth)).toLocaleString()} m²
            </span>
          </div>
        </InputSection>

        {/* Parking Configuration */}
        <InputSection 
          title="Parking Configuration" 
          icon={Car}
          defaultOpen={true}
        >
          {/* Parking Type */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Type</Label>
            <Select
              value={inputs.parkingType}
              onValueChange={(v) => handleInputChange('parkingType', v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARKING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visual Angle Picker */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-2 block flex items-center">
              Parking Angle
              <InfoTooltip content="Higher angles = more capacity. Lower angles = easier maneuvering." />
            </Label>
            <AnglePicker
              value={inputs.parkingAngle}
              onChange={(v) => handleInputChange('parkingAngle', v)}
            />
          </div>

          {/* Space Dimensions */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="spaceWidth" className="text-xs text-muted-foreground">
                Width (m)
              </Label>
              <Input
                id="spaceWidth"
                type="number"
                step="0.1"
                value={inputs.spaceWidth}
                onChange={(e) => handleInputChange('spaceWidth', e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="spaceLength" className="text-xs text-muted-foreground">
                Length (m)
              </Label>
              <Input
                id="spaceLength"
                type="number"
                step="0.1"
                value={inputs.spaceLength}
                onChange={(e) => handleInputChange('spaceLength', e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="aisleWidth" className="text-xs text-muted-foreground">
                Aisle (m)
              </Label>
              <Input
                id="aisleWidth"
                type="number"
                step="0.5"
                value={inputs.aisleWidth}
                onChange={(e) => handleInputChange('aisleWidth', e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground mt-2">
            Min aisle: 6.0m for two-way traffic
          </p>
        </InputSection>

        {/* Special Spaces */}
        <InputSection 
          title="Special Spaces & Compliance" 
          icon={Accessibility}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <PercentSlider
              label="Accessible"
              value={inputs.accessiblePercent}
              onChange={(v) => handleInputChange('accessiblePercent', v)}
              icon={<Accessibility className="w-3.5 h-3.5 text-blue-100" />}
              color="bg-blue-500"
              tooltip="Saudi code requires minimum 2% accessible spaces"
              min={2}
              max={15}
            />

            <PercentSlider
              label="EV Charging"
              value={inputs.evPercent}
              onChange={(v) => handleInputChange('evPercent', v)}
              icon={<Zap className="w-3.5 h-3.5 text-green-100" />}
              color="bg-green-500"
              tooltip="Future-ready recommendation: 10-15% for EV infrastructure"
              max={30}
            />

            <PercentSlider
              label="Compact"
              value={inputs.compactPercent}
              onChange={(v) => handleInputChange('compactPercent', v)}
              icon={<Car className="w-3.5 h-3.5 text-amber-100" />}
              color="bg-amber-500"
              tooltip="15% narrower spaces for small vehicles"
              max={25}
            />
          </div>
        </InputSection>

        {/* Multi-story Options */}
        {inputs.parkingType !== 'surface' && (
          <InputSection 
            title="Structure Options" 
            icon={Layers}
            defaultOpen={true}
          >
            <div>
              <Label htmlFor="floors" className="text-xs text-muted-foreground">
                Number of Floors
              </Label>
              <Input
                id="floors"
                type="number"
                min="1"
                max="10"
                value={inputs.floors}
                onChange={(e) => handleInputChange('floors', e.target.value)}
                className="h-9"
              />
            </div>
          </InputSection>
        )}
      </div>

      {/* Generate Button - Full Width */}
      <Button
        onClick={generateLayout}
        disabled={isGenerating}
        size="lg"
        className="w-full gap-2 h-12 text-base font-semibold flex-shrink-0"
      >
        {isGenerating ? (
          <>
            <RotateCw className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Layout
          </>
        )}
      </Button>

      {/* 3D/2D Visualization - Full Width Hero */}
      <div className="flex-shrink-0 h-[450px] bg-card border rounded-2xl overflow-hidden relative mt-6">
        {layout ? (
          viewMode === '2d' ? (
            <ParkingLayout2D
              layout={layout}
              siteLength={parseFloat(inputs.siteLength)}
              siteWidth={parseFloat(inputs.siteWidth)}
              showDimensions={true}
              showLabels={false}
            />
          ) : (
            <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <RotateCw className="w-10 h-10 animate-spin mb-4 opacity-50" />
                <p className="text-sm">Loading 3D Preview...</p>
              </div>
            }>
              <ParkingVisualization3D
                layout={layout}
                siteLength={parseFloat(inputs.siteLength)}
                siteWidth={parseFloat(inputs.siteWidth)}
                parkingType={inputs.parkingType}
                floors={parseInt(inputs.floors)}
              />
            </React.Suspense>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Car className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-lg font-medium">Generating Layout...</p>
          </div>
        )}
      </div>

      {/* Stats Bar - Full Width */}
      <div className="mt-4 flex-shrink-0 pb-4">
        <ParkingStatsBar
          stats={stats}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onExportDXF={() => toast({ title: "Export DXF", description: "DXF export coming soon" })}
          onExportPDF={() => toast({ title: "Export PDF", description: "PDF export coming soon" })}
        />
      </div>
    </div>
  );
};

// Main component
export const ParkingDesigner: React.FC<ParkingDesignerProps> = ({
  onCalculate,
  isCalculating,
  setIsCalculating,
  userId,
}) => {
  const [inputs, setInputs] = useState<ParkingInputs>(defaultInputs);
  const [layout, setLayout] = useState<ParkingLayout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full"
    >
      <ParkingSiteProvider>
        <UnifiedDesigner
          inputs={inputs}
          setInputs={setInputs}
          layout={layout}
          setLayout={setLayout}
          onCalculate={onCalculate}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </ParkingSiteProvider>
    </motion.div>
  );
};

export default ParkingDesigner;
