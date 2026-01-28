import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Info, Loader2, Ruler, Weight, Layers, AlertTriangle } from 'lucide-react';
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
import { calculateSlab } from '@/lib/engineeringCalculations';
import { InputSection } from './ui/InputSection';
import { useLanguage } from '@/contexts/LanguageContext';
import { slabValidationRules, validateField, hasErrors } from '@/lib/inputValidation';
import { useEngineeringSessionOptional } from '@/contexts/EngineeringSessionContext';
import type { BuildingCodeId } from '@/lib/buildingCodes/types';

interface SlabCalculatorProps {
  onCalculate: (result: {
    type: 'slab';
    inputs: Record<string, number | string>;
    outputs: Record<string, number | string | object>;
    timestamp: Date;
  }) => void;
  isCalculating: boolean;
  setIsCalculating: (value: boolean) => void;
  userId?: string;
  resetKey?: number;
}

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

const slabTypes = [
  { value: 'one_way', label: 'One-Way Slab', description: 'Span ratio > 2' },
  { value: 'two_way', label: 'Two-Way Slab', description: 'Span ratio ≤ 2' },
];

const supportConditions = [
  { value: 'simply_supported', label: 'Simply Supported' },
  { value: 'one_edge_continuous', label: 'One Edge Continuous' },
  { value: 'two_edges_continuous', label: 'Two Edges Continuous' },
  { value: 'all_edges_continuous', label: 'All Edges Continuous' },
];

const getDefaultFormData = () => ({
  longSpan: '6.0',
  shortSpan: '4.0',
  deadLoad: '5.0',
  liveLoad: '3.0',
  concreteGrade: 'C30',
  steelGrade: 'Fy420',
  slabType: 'two_way',
  supportCondition: 'simply_supported',
  cover: '25',
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
    phi: 'φ = 0.90',
    isCSA: false,
  };
};

export interface SlabCalculatorRef {
  reset: () => void;
}

export const SlabCalculator = forwardRef<SlabCalculatorRef, SlabCalculatorProps>(
  ({ onCalculate, isCalculating, setIsCalculating, userId, resetKey }, ref) => {
  const { t } = useLanguage();
  const { saveCalculation } = useEngineeringHistory(userId);
  const session = useEngineeringSessionOptional();
  const buildingCode: BuildingCodeId = (session?.buildingCode as BuildingCodeId) || 'ACI';
  const codeInfo = getCodeInfo(buildingCode);
  
  const [formData, setFormData] = useState(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when resetKey changes
  useEffect(() => {
    if (resetKey !== undefined) {
      setFormData(getDefaultFormData());
      setErrors({});
    }
  }, [resetKey]);

  // Expose reset method via ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      setFormData(getDefaultFormData());
      setErrors({});
    }
  }));

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate on change
    const numValue = parseFloat(value);
    const rule = slabValidationRules[field];
    if (rule && !isNaN(numValue)) {
      const error = validateField(numValue, rule);
      setErrors(prev => {
        if (error) {
          return { ...prev, [field]: error };
        }
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateAllInputs = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.entries(slabValidationRules).forEach(([field, rule]) => {
      const value = parseFloat(formData[field as keyof typeof formData] as string);
      if (!isNaN(value)) {
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

    const longSpan = parseFloat(formData.longSpan);
    const shortSpan = parseFloat(formData.shortSpan);
    const deadLoad = parseFloat(formData.deadLoad);
    const liveLoad = parseFloat(formData.liveLoad);
    const cover = parseFloat(formData.cover);

    if (isNaN(longSpan) || longSpan <= 0) {
      toast.error(t('error.invalidInputDesc'));
      return;
    }
    if (isNaN(shortSpan) || shortSpan <= 0) {
      toast.error(t('error.invalidInputDesc'));
      return;
    }

    setIsCalculating(true);

    try {
      // Client-side calculation with building code
      const data = calculateSlab({
        longSpan,
        shortSpan,
        deadLoad,
        liveLoad,
        concreteGrade: formData.concreteGrade,
        steelGrade: formData.steelGrade,
        slabType: formData.slabType,
        supportCondition: formData.supportCondition,
        cover,
        buildingCode,
      });

      const result = {
        type: 'slab' as const,
        inputs: {
          longSpan,
          shortSpan,
          deadLoad,
          liveLoad,
          concreteGrade: formData.concreteGrade,
          steelGrade: formData.steelGrade,
          slabType: formData.slabType,
          supportCondition: formData.supportCondition,
          cover,
          buildingCode,
        },
        outputs: data,
        timestamp: new Date(),
      };

      onCalculate(result);

      // Save to history
      if (userId) {
        await saveCalculation(
          'slab',
          result.inputs,
          result.outputs
        );
      }

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

  const spanRatio = formData.longSpan && formData.shortSpan 
    ? (parseFloat(formData.longSpan) / parseFloat(formData.shortSpan)).toFixed(2)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border p-6 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Slab Calculator</h2>
          <p className="text-sm text-muted-foreground">One-way & Two-way slab design</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Geometry Section */}
        <InputSection title="Geometry" icon={Ruler} iconColor="text-blue-500">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="longSpan">Long Span (m)</Label>
              <Input
                id="longSpan"
                type="number"
                step="0.1"
                placeholder="6.0"
                value={formData.longSpan}
                onChange={(e) => handleInputChange('longSpan', e.target.value)}
                className={errors.longSpan ? 'border-destructive' : ''}
              />
              <FormError message={errors.longSpan} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortSpan">Short Span (m)</Label>
              <Input
                id="shortSpan"
                type="number"
                step="0.1"
                placeholder="4.0"
                value={formData.shortSpan}
                onChange={(e) => handleInputChange('shortSpan', e.target.value)}
                className={errors.shortSpan ? 'border-destructive' : ''}
              />
              <FormError message={errors.shortSpan} />
            </div>
          </div>
          
          {spanRatio && (
            <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Span ratio: {spanRatio} 
                ({parseFloat(spanRatio) > 2 ? 'One-way recommended' : 'Two-way recommended'})
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="slabType">Slab Type</Label>
            <Select
              value={formData.slabType}
              onValueChange={(value) => handleInputChange('slabType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {slabTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportCondition">Support Condition</Label>
            <Select
              value={formData.supportCondition}
              onValueChange={(value) => handleInputChange('supportCondition', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportConditions.map((cond) => (
                  <SelectItem key={cond.value} value={cond.value}>
                    {cond.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Concrete Cover (mm)</Label>
            <Input
              id="cover"
              type="number"
              placeholder="25"
              value={formData.cover}
              onChange={(e) => handleInputChange('cover', e.target.value)}
              className={errors.cover ? 'border-destructive' : ''}
            />
            <FormError message={errors.cover} />
          </div>
        </InputSection>

        {/* Loading Section */}
        <InputSection title="Loading" icon={Weight} iconColor="text-amber-500">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="deadLoad">Dead Load (kN/m²)</Label>
              <Input
                id="deadLoad"
                type="number"
                step="0.5"
                placeholder="5.0"
                value={formData.deadLoad}
                onChange={(e) => handleInputChange('deadLoad', e.target.value)}
                className={errors.deadLoad ? 'border-destructive' : ''}
              />
              <FormError message={errors.deadLoad} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liveLoad">Live Load (kN/m²)</Label>
              <Input
                id="liveLoad"
                type="number"
                step="0.5"
                placeholder="3.0"
                value={formData.liveLoad}
                onChange={(e) => handleInputChange('liveLoad', e.target.value)}
                className={errors.liveLoad ? 'border-destructive' : ''}
              />
              <FormError message={errors.liveLoad} />
            </div>
          </div>
        </InputSection>

        {/* Materials Section */}
        <InputSection title="Materials" icon={Layers} iconColor="text-emerald-500">
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
                    ⚠️ CSA requires ~38% more reinforcement than ACI
                  </p>
                )}
              </div>
            </div>
          </div>
        </InputSection>
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
            Calculate Slab Design
          </>
        )}
      </Button>
    </motion.div>
  );
});

SlabCalculator.displayName = 'SlabCalculator';

export default SlabCalculator;
