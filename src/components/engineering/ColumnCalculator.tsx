import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Loader2, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import ColumnVisualization3D from './ColumnVisualization3D';
import { useEngineeringHistory } from '@/hooks/useEngineeringHistory';
import { calculateColumn } from '@/lib/engineeringCalculations';
import { useLanguage } from '@/contexts/LanguageContext';
import { columnValidationRules, validateField, hasErrors } from '@/lib/inputValidation';
import { useEngineeringSessionOptional } from '@/contexts/EngineeringSessionContext';
import { cn } from '@/lib/utils';
import type { BuildingCodeId } from '@/lib/buildingCodes/types';

interface ColumnCalculatorProps {
  onCalculate: (result: any) => void;
  isCalculating: boolean;
  setIsCalculating: (value: boolean) => void;
  userId?: string;
  onInputChange?: (inputs: Record<string, any>) => void;
  resetKey?: number;
}

const getDefaultInputs = () => ({
  axialLoad: 1500,
  momentX: 80,
  momentY: 60,
  columnWidth: 400,
  columnDepth: 400,
  columnHeight: 3500,
  concreteGrade: 'C30',
  steelGrade: '420',
  coverThickness: 40,
  columnType: 'tied',
  slendernessCheck: true
});

// Helper component for form errors
const FormError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="text-destructive text-xs mt-1">{message}</p>;
};

// Get code-specific info
const getCodeInfo = (buildingCode: BuildingCodeId) => {
  if (buildingCode === 'CSA') {
    return {
      name: 'CSA A23.3-24 / NBCC 2020',
      factors: '1.25D + 1.5L',
      phi: 'φc = 0.65',
      isCSA: true,
    };
  }
  return {
    name: 'ACI 318-25 / ASCE 7-22',
    factors: '1.2D + 1.6L',
    phi: 'φ = 0.65 (compression)',
    isCSA: false,
  };
};

export interface ColumnCalculatorRef {
  reset: () => void;
}

const ColumnCalculator = forwardRef<ColumnCalculatorRef, ColumnCalculatorProps>(({ 
  onCalculate, 
  isCalculating, 
  setIsCalculating, 
  userId,
  onInputChange,
  resetKey
}, ref) => {
  const { t } = useLanguage();
  const { saveCalculation } = useEngineeringHistory(userId);
  const session = useEngineeringSessionOptional();
  const buildingCode: BuildingCodeId = (session?.buildingCode as BuildingCodeId) || 'ACI';
  const codeInfo = getCodeInfo(buildingCode);
  
  const [inputs, setInputs] = useState(getDefaultInputs());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when resetKey changes
  useEffect(() => {
    if (resetKey !== undefined) {
      setInputs(getDefaultInputs());
      setErrors({});
    }
  }, [resetKey]);

  // Expose reset method via ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      setInputs(getDefaultInputs());
      setErrors({});
    }
  }));

  const handleInputChange = (field: string, value: string | number | boolean) => {
    const newInputs = { ...inputs, [field]: value };
    setInputs(newInputs);
    onInputChange?.(newInputs);
    
    // Validate numeric fields
    if (typeof value === 'number') {
      const rule = columnValidationRules[field];
      if (rule) {
        const error = validateField(value, rule);
        setErrors(prev => {
          if (error) {
            return { ...prev, [field]: error };
          }
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  const validateAllInputs = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.entries(columnValidationRules).forEach(([field, rule]) => {
      const value = inputs[field as keyof typeof inputs];
      if (typeof value === 'number') {
        const error = validateField(value, rule);
        if (error) newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return !hasErrors(newErrors);
  };

  const handleCalculate = async () => {
    if (!validateAllInputs()) {
      toast.error(t('error.invalidInputDesc'));
      return;
    }

    setIsCalculating(true);
    try {
      // Client-side calculation with building code
      const data = calculateColumn({
        axialLoad: inputs.axialLoad,
        momentX: inputs.momentX,
        momentY: inputs.momentY,
        columnWidth: inputs.columnWidth,
        columnDepth: inputs.columnDepth,
        columnHeight: inputs.columnHeight,
        concreteGrade: inputs.concreteGrade,
        steelGrade: inputs.steelGrade,
        coverThickness: inputs.coverThickness,
        columnType: inputs.columnType,
      }, buildingCode);

      // Save to history (non-blocking)
      saveCalculation('column', { ...inputs, buildingCode }, data);

      onCalculate({
        type: 'column',
        inputs: { ...inputs, buildingCode },
        outputs: data,
        timestamp: new Date()
      });

      toast.success(t('common.success'));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Calculation error:', error);
      }
      toast.error(t('error.calculationFailedDesc'));
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 p-6"
    >
      <div className="grid grid-cols-1 gap-6">
        {/* Input Form */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-orange-500" />
              Column Design Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Load Inputs */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Applied Loads</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="axialLoad" className="text-xs">Axial Load (kN)</Label>
                  <Input
                    id="axialLoad"
                    type="number"
                    value={inputs.axialLoad}
                    onChange={(e) => handleInputChange('axialLoad', parseFloat(e.target.value))}
                    className={cn("h-9", errors.axialLoad && 'border-destructive')}
                  />
                  <FormError message={errors.axialLoad} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="momentX" className="text-xs">Moment X (kN.m)</Label>
                  <Input
                    id="momentX"
                    type="number"
                    value={inputs.momentX}
                    onChange={(e) => handleInputChange('momentX', parseFloat(e.target.value))}
                    className={cn("h-9", errors.momentX && 'border-destructive')}
                  />
                  <FormError message={errors.momentX} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="momentY" className="text-xs">Moment Y (kN.m)</Label>
                  <Input
                    id="momentY"
                    type="number"
                    value={inputs.momentY}
                    onChange={(e) => handleInputChange('momentY', parseFloat(e.target.value))}
                    className={cn("h-9", errors.momentY && 'border-destructive')}
                  />
                  <FormError message={errors.momentY} />
                </div>
              </div>
            </div>

            {/* Column Dimensions */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Column Dimensions</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="columnWidth" className="text-xs">Width (mm)</Label>
                  <Input
                    id="columnWidth"
                    type="number"
                    value={inputs.columnWidth}
                    onChange={(e) => handleInputChange('columnWidth', parseFloat(e.target.value))}
                    className={cn("h-9", errors.columnWidth && 'border-destructive')}
                  />
                  <FormError message={errors.columnWidth} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="columnDepth" className="text-xs">Depth (mm)</Label>
                  <Input
                    id="columnDepth"
                    type="number"
                    value={inputs.columnDepth}
                    onChange={(e) => handleInputChange('columnDepth', parseFloat(e.target.value))}
                    className={cn("h-9", errors.columnDepth && 'border-destructive')}
                  />
                  <FormError message={errors.columnDepth} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="columnHeight" className="text-xs">Height (mm)</Label>
                  <Input
                    id="columnHeight"
                    type="number"
                    value={inputs.columnHeight}
                    onChange={(e) => handleInputChange('columnHeight', parseFloat(e.target.value))}
                    className={cn("h-9", errors.columnHeight && 'border-destructive')}
                  />
                  <FormError message={errors.columnHeight} />
                </div>
              </div>
            </div>

            {/* Material Properties */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Material Properties</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Concrete Grade</Label>
                  <Select value={inputs.concreteGrade} onValueChange={(v) => handleInputChange('concreteGrade', v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C25">C25 (25 MPa)</SelectItem>
                      <SelectItem value="C30">C30 (30 MPa)</SelectItem>
                      <SelectItem value="C35">C35 (35 MPa)</SelectItem>
                      <SelectItem value="C40">C40 (40 MPa)</SelectItem>
                      <SelectItem value="C45">C45 (45 MPa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Steel Grade (MPa)</Label>
                  <Select value={inputs.steelGrade} onValueChange={(v) => handleInputChange('steelGrade', v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Grade 400</SelectItem>
                      <SelectItem value="420">Grade 420</SelectItem>
                      <SelectItem value="500">Grade 500</SelectItem>
                      <SelectItem value="520">Grade 520</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Column Configuration */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Column Configuration</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Column Type</Label>
                  <Select value={inputs.columnType} onValueChange={(v) => handleInputChange('columnType', v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tied">Tied Column</SelectItem>
                      <SelectItem value="spiral">Spiral Column</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="coverThickness" className="text-xs">Cover (mm)</Label>
                  <Input
                    id="coverThickness"
                    type="number"
                    value={inputs.coverThickness}
                    onChange={(e) => handleInputChange('coverThickness', parseFloat(e.target.value))}
                    className={cn("h-9", errors.coverThickness && 'border-destructive')}
                  />
                  <FormError message={errors.coverThickness} />
                </div>
              </div>
            </div>

            {/* Dynamic Info Box based on building code */}
            <div className={cn(
              "p-3 rounded-lg border",
              codeInfo.isCSA 
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                : "bg-muted/50 border-border"
            )}>
              <div className="flex items-start gap-2 text-sm">
                {codeInfo.isCSA ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                )}
                <div className="text-muted-foreground">
                  <p className="font-medium text-foreground">Design Code: {codeInfo.name}</p>
                  <p>Load factors: {codeInfo.factors}, {codeInfo.phi}</p>
                  {codeInfo.isCSA && (
                    <p className="text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ CSA uses lower resistance factors - expect more reinforcement
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full mt-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Column Design
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 3D Visualization */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm">Column Cross-Section Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ColumnVisualization3D
              width={inputs.columnWidth}
              depth={inputs.columnDepth}
              height={inputs.columnHeight}
              cover={inputs.coverThickness}
              columnType={inputs.columnType}
            />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
});

ColumnCalculator.displayName = 'ColumnCalculator';

export default ColumnCalculator;
