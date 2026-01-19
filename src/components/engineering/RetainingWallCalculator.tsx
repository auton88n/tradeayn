import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Info, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEngineeringHistory } from '@/hooks/useEngineeringHistory';
import { calculateRetainingWall } from '@/lib/engineeringCalculations';

interface RetainingWallCalculatorProps {
  onCalculate: (result: {
    type: 'retaining_wall';
    inputs: Record<string, number | string>;
    outputs: Record<string, number | string | object>;
    timestamp: Date;
  }) => void;
  isCalculating: boolean;
  setIsCalculating: (value: boolean) => void;
  userId?: string;
}

const concreteGrades = [
  { value: 'C25', label: 'C25 (25 MPa)' },
  { value: 'C30', label: 'C30 (30 MPa)' },
  { value: 'C35', label: 'C35 (35 MPa)' },
];

const steelGrades = [
  { value: 'Fy420', label: 'Fy420 (420 MPa)' },
  { value: 'Fy500', label: 'Fy500 (500 MPa)' },
];

const soilTypes = [
  { value: 'loose_sand', label: 'Loose Sand', unitWeight: 16, friction: 28 },
  { value: 'medium_sand', label: 'Medium Dense Sand', unitWeight: 18, friction: 32 },
  { value: 'dense_sand', label: 'Dense Sand', unitWeight: 20, friction: 36 },
  { value: 'soft_clay', label: 'Soft Clay', unitWeight: 16, friction: 20 },
  { value: 'stiff_clay', label: 'Stiff Clay', unitWeight: 19, friction: 25 },
  { value: 'gravel', label: 'Sandy Gravel', unitWeight: 20, friction: 35 },
];

export const RetainingWallCalculator = ({ 
  onCalculate, 
  isCalculating, 
  setIsCalculating, 
  userId 
}: RetainingWallCalculatorProps) => {
  const { saveCalculation } = useEngineeringHistory(userId);
  
  const [formData, setFormData] = useState({
    wallHeight: '3.0',
    stemThicknessTop: '250',
    stemThicknessBottom: '400',
    baseWidth: '1800',
    baseThickness: '400',
    toeWidth: '200',
    soilType: 'medium_sand',
    surchargeLoad: '10',
    concreteGrade: 'C30',
    steelGrade: 'Fy420',
    allowableBearingPressure: '150',
    backfillSlope: '0',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate recommended dimensions
      if (field === 'wallHeight' && value) {
        const h = parseFloat(value);
        if (!isNaN(h) && h > 0) {
          // Recommended base width: 0.5-0.7 * H
          updated.baseWidth = updated.baseWidth || (h * 0.6 * 1000).toFixed(0);
          // Recommended toe width: 0.1-0.15 * B
          const b = parseFloat(updated.baseWidth) / 1000;
          updated.toeWidth = updated.toeWidth || (b * 0.12 * 1000).toFixed(0);
          // Stem thickness at bottom: ~0.1*H
          updated.stemThicknessBottom = (Math.max(300, h * 100)).toFixed(0);
        }
      }
      
      return updated;
    });
  };

  const handleSoilTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, soilType: value }));
  };

  const selectedSoil = soilTypes.find(s => s.value === formData.soilType) || soilTypes[1];

  const handleCalculate = async () => {
    const wallHeight = parseFloat(formData.wallHeight);
    const stemThicknessTop = parseFloat(formData.stemThicknessTop);
    const stemThicknessBottom = parseFloat(formData.stemThicknessBottom);
    const baseWidth = parseFloat(formData.baseWidth);
    const baseThickness = parseFloat(formData.baseThickness);
    const toeWidth = parseFloat(formData.toeWidth);
    const surchargeLoad = parseFloat(formData.surchargeLoad);
    const allowableBearingPressure = parseFloat(formData.allowableBearingPressure);
    const backfillSlope = parseFloat(formData.backfillSlope);

    if (isNaN(wallHeight) || wallHeight <= 0) {
      toast.error('Please enter a valid wall height');
      return;
    }
    if (isNaN(baseWidth) || baseWidth <= 0) {
      toast.error('Please enter a valid base width');
      return;
    }

    setIsCalculating(true);

    try {
      // Client-side calculation for instant results
      const data = calculateRetainingWall({
        wallHeight,
        stemThicknessTop,
        stemThicknessBottom,
        baseWidth,
        baseThickness,
        toeWidth,
        soilUnitWeight: selectedSoil.unitWeight,
        soilFrictionAngle: selectedSoil.friction,
        surchargeLoad,
        concreteGrade: formData.concreteGrade,
        steelGrade: formData.steelGrade,
        allowableBearingPressure,
        backfillSlope,
      });

      const result = {
        type: 'retaining_wall' as const,
        inputs: {
          wallHeight,
          stemThicknessTop,
          stemThicknessBottom,
          baseWidth,
          baseThickness,
          toeWidth,
          soilType: formData.soilType,
          soilUnitWeight: selectedSoil.unitWeight,
          soilFrictionAngle: selectedSoil.friction,
          surchargeLoad,
          concreteGrade: formData.concreteGrade,
          steelGrade: formData.steelGrade,
          allowableBearingPressure,
          backfillSlope,
        },
        outputs: data,
        timestamp: new Date(),
      };

      onCalculate(result);

      if (userId) {
        await saveCalculation('retaining_wall', result.inputs, result.outputs);
      }

      toast.success('Retaining wall calculation complete!');
    } catch (err) {
      console.error('Calculation error:', err);
      toast.error('Calculation failed. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border p-6 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Retaining Wall Calculator</h2>
          <p className="text-sm text-muted-foreground">Cantilever retaining wall design with stability analysis</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Wall Geometry */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Wall Geometry
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="wallHeight">Wall Height (m)</Label>
            <Input
              id="wallHeight"
              type="number"
              step="0.1"
              placeholder="3.0"
              value={formData.wallHeight}
              onChange={(e) => handleInputChange('wallHeight', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="stemThicknessTop">Stem Top (mm)</Label>
              <Input
                id="stemThicknessTop"
                type="number"
                placeholder="250"
                value={formData.stemThicknessTop}
                onChange={(e) => handleInputChange('stemThicknessTop', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stemThicknessBottom">Stem Bottom (mm)</Label>
              <Input
                id="stemThicknessBottom"
                type="number"
                placeholder="400"
                value={formData.stemThicknessBottom}
                onChange={(e) => handleInputChange('stemThicknessBottom', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="baseWidth">Base Width (mm)</Label>
              <Input
                id="baseWidth"
                type="number"
                placeholder="1800"
                value={formData.baseWidth}
                onChange={(e) => handleInputChange('baseWidth', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseThickness">Base Thick (mm)</Label>
              <Input
                id="baseThickness"
                type="number"
                placeholder="400"
                value={formData.baseThickness}
                onChange={(e) => handleInputChange('baseThickness', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toeWidth">Toe Width (mm)</Label>
              <Input
                id="toeWidth"
                type="number"
                placeholder="200"
                value={formData.toeWidth}
                onChange={(e) => handleInputChange('toeWidth', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backfillSlope">Backfill Slope (°)</Label>
            <Input
              id="backfillSlope"
              type="number"
              placeholder="0"
              value={formData.backfillSlope}
              onChange={(e) => handleInputChange('backfillSlope', e.target.value)}
            />
          </div>
        </div>

        {/* Soil & Materials */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Soil & Materials
          </h3>

          <div className="space-y-2">
            <Label htmlFor="soilType">Backfill Soil Type</Label>
            <Select value={formData.soilType} onValueChange={handleSoilTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {soilTypes.map((soil) => (
                  <SelectItem key={soil.value} value={soil.value}>
                    {soil.label} (γ={soil.unitWeight}, φ={soil.friction}°)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="surchargeLoad">Surcharge (kN/m²)</Label>
              <Input
                id="surchargeLoad"
                type="number"
                placeholder="10"
                value={formData.surchargeLoad}
                onChange={(e) => handleInputChange('surchargeLoad', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowableBearingPressure">Bearing Cap. (kN/m²)</Label>
              <Input
                id="allowableBearingPressure"
                type="number"
                placeholder="150"
                value={formData.allowableBearingPressure}
                onChange={(e) => handleInputChange('allowableBearingPressure', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="concreteGrade">Concrete Grade</Label>
              <Select
                value={formData.concreteGrade}
                onValueChange={(value) => handleInputChange('concreteGrade', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {concreteGrades.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="steelGrade">Steel Grade</Label>
              <Select
                value={formData.steelGrade}
                onValueChange={(value) => handleInputChange('steelGrade', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {steelGrades.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info Box */}
          <div className={cn(
            "p-3 rounded-lg bg-amber-500/10 border border-amber-500/30",
            "flex items-start gap-2 text-sm"
          )}>
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-muted-foreground">
              <p className="font-medium text-foreground">Stability Requirements</p>
              <p>FOS Overturning ≥ 2.0, Sliding ≥ 1.5, Bearing ≥ 3.0</p>
            </div>
          </div>
        </div>
      </div>

      <Button
        className="w-full mt-6 gap-2 h-12 text-base"
        onClick={handleCalculate}
        disabled={isCalculating}
      >
        {isCalculating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <Calculator className="w-5 h-5" />
            Analyze Retaining Wall
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default RetainingWallCalculator;
