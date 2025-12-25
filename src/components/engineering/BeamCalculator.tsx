import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Info, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEngineeringHistory } from '@/hooks/useEngineeringHistory';

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

const supportTypes = [
  { value: 'simply_supported', label: 'Simply Supported', momentFactor: 8 },
  { value: 'continuous', label: 'Continuous (Interior)', momentFactor: 10 },
  { value: 'cantilever', label: 'Cantilever', momentFactor: 2 },
];

export const BeamCalculator = ({ onCalculate, isCalculating, setIsCalculating, userId }: BeamCalculatorProps) => {
  const { saveCalculation } = useEngineeringHistory(userId);
  
  const [formData, setFormData] = useState({
    span: '',
    deadLoad: '',
    liveLoad: '',
    beamWidth: '300',
    concreteGrade: 'C30',
    steelGrade: 'Fy420',
    supportType: 'simply_supported',
    exposureClass: 'XC1',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    // Validate inputs
    const span = parseFloat(formData.span);
    const deadLoad = parseFloat(formData.deadLoad);
    const liveLoad = parseFloat(formData.liveLoad);
    const beamWidth = parseFloat(formData.beamWidth);

    if (isNaN(span) || span <= 0) {
      toast.error('Please enter a valid span length');
      return;
    }
    if (isNaN(deadLoad) || deadLoad < 0) {
      toast.error('Please enter a valid dead load');
      return;
    }
    if (isNaN(liveLoad) || liveLoad < 0) {
      toast.error('Please enter a valid live load');
      return;
    }

    setIsCalculating(true);

    try {
      const { data, error } = await supabase.functions.invoke('calculate-beam', {
        body: {
          span,
          deadLoad,
          liveLoad,
          beamWidth,
          concreteGrade: formData.concreteGrade,
          steelGrade: formData.steelGrade,
          supportType: formData.supportType,
          exposureClass: formData.exposureClass,
        },
      });

      if (error) throw error;

      const inputs = {
        span,
        deadLoad,
        liveLoad,
        beamWidth,
        concreteGrade: formData.concreteGrade,
        steelGrade: formData.steelGrade,
        supportType: formData.supportType,
        exposureClass: formData.exposureClass,
      };

      // Save to history (non-blocking)
      saveCalculation('beam', inputs, data);

      onCalculate({
        type: 'beam',
        inputs,
        outputs: data,
        timestamp: new Date(),
      });

      toast.success('Calculation complete!');
    } catch (err) {
      console.error('Calculation error:', err);
      toast.error('Calculation failed. Please try again.');
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
                  min="0"
                />
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
                  min="200"
                />
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
                />
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
                />
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

          {/* Info Box */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl",
            "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
          )}>
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Calculation Method</p>
              <p className="text-blue-600 dark:text-blue-400">
                Uses ACI 318 / Eurocode 2 methods with load factors: 1.4 DL + 1.6 LL. 
                Results are for reference only - professional verification required.
              </p>
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
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
};
