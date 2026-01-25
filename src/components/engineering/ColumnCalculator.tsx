import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ColumnVisualization3D from './ColumnVisualization3D';
import { useEngineeringHistory } from '@/hooks/useEngineeringHistory';
import { calculateColumn } from '@/lib/engineeringCalculations';
import { useLanguage } from '@/contexts/LanguageContext';

interface ColumnCalculatorProps {
  onCalculate: (result: any) => void;
  isCalculating: boolean;
  setIsCalculating: (value: boolean) => void;
  userId?: string;
  onInputChange?: (inputs: Record<string, any>) => void;
}

const ColumnCalculator: React.FC<ColumnCalculatorProps> = ({ 
  onCalculate, 
  isCalculating, 
  setIsCalculating, 
  userId,
  onInputChange 
}) => {
  const { t } = useLanguage();
  const { saveCalculation } = useEngineeringHistory(userId);
  const [inputs, setInputs] = useState({
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

  const handleInputChange = (field: string, value: string | number | boolean) => {
    const newInputs = { ...inputs, [field]: value };
    setInputs(newInputs);
    onInputChange?.(newInputs);
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      // Client-side calculation for instant results
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
      });

      // Save to history (non-blocking)
      saveCalculation('column', inputs, data);

      onCalculate({
        type: 'column',
        inputs,
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
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="momentX" className="text-xs">Moment X (kN.m)</Label>
                  <Input
                    id="momentX"
                    type="number"
                    value={inputs.momentX}
                    onChange={(e) => handleInputChange('momentX', parseFloat(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="momentY" className="text-xs">Moment Y (kN.m)</Label>
                  <Input
                    id="momentY"
                    type="number"
                    value={inputs.momentY}
                    onChange={(e) => handleInputChange('momentY', parseFloat(e.target.value))}
                    className="h-9"
                  />
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
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="columnDepth" className="text-xs">Depth (mm)</Label>
                  <Input
                    id="columnDepth"
                    type="number"
                    value={inputs.columnDepth}
                    onChange={(e) => handleInputChange('columnDepth', parseFloat(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="columnHeight" className="text-xs">Height (mm)</Label>
                  <Input
                    id="columnHeight"
                    type="number"
                    value={inputs.columnHeight}
                    onChange={(e) => handleInputChange('columnHeight', parseFloat(e.target.value))}
                    className="h-9"
                  />
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
                    className="h-9"
                  />
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
};

export default ColumnCalculator;
