import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
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
import { calculateBeam } from '@/lib/engineeringCalculations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEngineeringSessionOptional } from '@/contexts/EngineeringSessionContext';
import { beamValidationRules, validateInput, validateAllInputs } from '@/lib/inputValidation';
import { getCodeInfoText } from '@/lib/designValidation';
import { FormError } from '@/components/ui/form-error';

interface BeamCalculatorProps {
  onCalculate: (result: {
    type: 'beam';
    inputs: Record<string, number | string>;
    outputs: Record<string, number | string | object>;
    timestamp: Date;
  }) => void;
  isCalculating: boolean;
  setIsCalculating: (value: boolean) => void;
  userId?: string;
  onReset?: () => void;
}

export interface BeamCalculatorRef {
  reset: () => void;
}

const defaultFormData = {
  span: '6.0',
  deadLoad: '15.0',
  liveLoad: '10.0',
  beamWidth: '300',
  concreteGrade: 'C30',
  steelGrade: 'Fy420',
  supportType: 'simply_supported',
  exposureClass: 'XC1',
};

const concreteGrades = [
  { value: 'C25', fck: 25, label: 'C25 (25 MPa)' },
  { value: 'C30', fck: 30, label: 'C30 (30 MPa)' },
  { value: 'C35', fck: 35, label: 'C35 (35 MPa)' },
  { value: 'C40', fck: 40, label: 'C40 (40 MPa)' },
];

const steelGrades = [
  { value: 'Fy420', fy: 420, label: 'Fy420 (420 MPa)' },
  { value: 'Fy500', fy: 500, label: 'Fy500 (500 MPa)' },
];

const supportTypes = [
  { value: 'simply_supported', label: 'Simply Supported', momentFactor: 8 },
  { value: 'continuous', label: 'Continuous (Interior)', momentFactor: 10 },
  { value: 'cantilever', label: 'Cantilever', momentFactor: 2 },
];

export const BeamCalculator = forwardRef<BeamCalculatorRef, BeamCalculatorProps>(
  ({ onCalculate, isCalculating, setIsCalculating, userId, onReset }, ref) => {
  const { t } = useLanguage();
  const { saveCalculation } = useEngineeringHistory(userId);
  const session = useEngineeringSessionOptional();
  const buildingCode = session?.buildingCode || 'ACI';
  
  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Expose reset method via ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      setFormData(defaultFormData);
      setErrors({});
      onReset?.();
    },
  }));

  // Get dynamic code info
  const codeInfo = getCodeInfoText(buildingCode);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const rule = beamValidationRules[field];
    if (rule && value !== '') {
      const result = validateInput(value, rule);
      setErrors(prev => {
        if (result.isValid) {
          const { [field]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [field]: result.error || '' };
      });
    }
  };

  const handleCalculate = async () => {
    // Validate all inputs
    const allErrors = validateAllInputs(formData, beamValidationRules);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast.error('Please fix validation errors before calculating');
      return;
    }

    const span = parseFloat(formData.span);
    const deadLoad = parseFloat(formData.deadLoad);
    const liveLoad = parseFloat(formData.liveLoad);
    const beamWidth = parseFloat(formData.beamWidth);

    if (isNaN(span) || span <= 0) {
      toast.error(t('error.invalidInputDesc'));
      return;
    }

    setIsCalculating(true);

    try {
      // Client-side calculation with building code
      const data = calculateBeam({
        span,
        deadLoad,
        liveLoad,
        beamWidth,
        concreteGrade: formData.concreteGrade,
        steelGrade: formData.steelGrade,
        supportType: formData.supportType,
        buildingCode,
      });

      const inputs = {
        span,
        deadLoad,
        liveLoad,
        beamWidth,
        concreteGrade: formData.concreteGrade,
        steelGrade: formData.steelGrade,
        supportType: formData.supportType,
        exposureClass: formData.exposureClass,
        buildingCode,
      };

      // Save to history (non-blocking)
      saveCalculation('beam', inputs, data);

      onCalculate({
        type: 'beam',
        inputs,
        outputs: data as unknown as Record<string, number | string | object>,
        timestamp: new Date(),
      });

      toast.success(t('common.success'));
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Calculation error:', err);
      }
      toast.error(t('error.calculationFailedDesc'));
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Beam Design Calculator</h2>
            <p className="text-sm text-muted-foreground">Reinforced Concrete Beam Design</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Geometry Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Geometry
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="span">Span Length (m)</Label>
                <Input
                  id="span"
                  type="number"
                  placeholder="e.g., 6.0"
                  value={formData.span}
                  onChange={(e) => handleInputChange('span', e.target.value)}
                  step="0.1"
                  min="0.5"
                  max="30"
                  className={errors.span ? 'border-destructive' : ''}
                />
                <FormError message={errors.span} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beamWidth">Beam Width (mm)</Label>
                <Input
                  id="beamWidth"
                  type="number"
                  placeholder="e.g., 300"
                  value={formData.beamWidth}
                  onChange={(e) => handleInputChange('beamWidth', e.target.value)}
                  step="25"
                  min="150"
                  max="2000"
                  className={errors.beamWidth ? 'border-destructive' : ''}
                />
                <FormError message={errors.beamWidth} />
              </div>
            </div>
          </div>

          {/* Loads Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Applied Loads
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadLoad">Dead Load (kN/m)</Label>
                <Input
                  id="deadLoad"
                  type="number"
                  placeholder="e.g., 15.0"
                  value={formData.deadLoad}
                  onChange={(e) => handleInputChange('deadLoad', e.target.value)}
                  step="0.5"
                  min="0"
                  max="500"
                  className={errors.deadLoad ? 'border-destructive' : ''}
                />
                <FormError message={errors.deadLoad} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="liveLoad">Live Load (kN/m)</Label>
                <Input
                  id="liveLoad"
                  type="number"
                  placeholder="e.g., 10.0"
                  value={formData.liveLoad}
                  onChange={(e) => handleInputChange('liveLoad', e.target.value)}
                  step="0.5"
                  min="0"
                  max="500"
                  className={errors.liveLoad ? 'border-destructive' : ''}
                />
                <FormError message={errors.liveLoad} />
              </div>
            </div>
          </div>

          {/* Materials Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Materials
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Concrete Grade</Label>
                <Select value={formData.concreteGrade} onValueChange={(v) => handleInputChange('concreteGrade', v)}>
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
                <Label>Steel Grade</Label>
                <Select value={formData.steelGrade} onValueChange={(v) => handleInputChange('steelGrade', v)}>
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
          </div>

          {/* Support Conditions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Support Conditions
            </h3>
            <div className="space-y-2">
              <Label>Support Type</Label>
              <Select value={formData.supportType} onValueChange={(v) => handleInputChange('supportType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info Box - Dynamic based on building code */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl",
            buildingCode === 'CSA' 
              ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
              : "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
          )}>
            <Info className={cn(
              "w-5 h-5 shrink-0 mt-0.5",
              buildingCode === 'CSA' ? "text-red-500" : "text-blue-500"
            )} />
            <div className={cn(
              "text-sm",
              buildingCode === 'CSA' ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"
            )}>
              <p className="font-medium mb-1">Calculation Method: {codeInfo.name}</p>
              <p className={buildingCode === 'CSA' ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}>
                Load factors: {codeInfo.factors} • Resistance: {codeInfo.phi}
              </p>
              {buildingCode === 'CSA' && (
                <p className="text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {codeInfo.note}
                </p>
              )}
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={isCalculating || Object.keys(errors).length > 0}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5 mr-2" />
                Calculate Beam Design
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
});

BeamCalculator.displayName = 'BeamCalculator';
