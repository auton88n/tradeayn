import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Loader2, Ruler, Weight, Layers, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import ZoomableVisualization from './ZoomableVisualization';
import FuturisticInputSection from './FuturisticInputSection';
import FuturisticInput from './FuturisticInput';
import { BeamVisualization3D } from './BeamVisualization3D';

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
  const [is3DView, setIs3DView] = useState(true);
  
  const [formData, setFormData] = useState({
    span: '6',
    deadLoad: '15',
    liveLoad: '10',
    beamWidth: '300',
    beamDepth: '500',
    concreteGrade: 'C30',
    steelGrade: 'Fy420',
    supportType: 'simply_supported',
    exposureClass: 'XC1',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4"
    >
      {/* 3D Visualization - Hero Section */}
      <ZoomableVisualization
        title="Beam Structure"
        is3D={is3DView}
        onViewModeChange={setIs3DView}
        className="h-[220px]"
      >
        <BeamVisualization3D
          outputs={{
            span: parseFloat(formData.span) || 6,
            beamWidth: parseFloat(formData.beamWidth) || 300,
            beamDepth: parseFloat(formData.beamDepth) || 500,
            supportType: formData.supportType,
            deadLoad: parseFloat(formData.deadLoad) || 15,
            liveLoad: parseFloat(formData.liveLoad) || 10,
          }}
        />
      </ZoomableVisualization>

      {/* Input Sections - Collapsible */}
      <div className="space-y-3">
        {/* Geometry */}
        <FuturisticInputSection 
          title="Geometry" 
          icon={<Ruler className="w-3.5 h-3.5" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-2 gap-3">
            <FuturisticInput
              label="Span Length"
              unit="m"
              type="number"
              placeholder="6.0"
              value={formData.span}
              onChange={(e) => handleInputChange('span', e.target.value)}
              step="0.1"
              min="0"
            />
            <FuturisticInput
              label="Beam Width"
              unit="mm"
              type="number"
              placeholder="300"
              value={formData.beamWidth}
              onChange={(e) => handleInputChange('beamWidth', e.target.value)}
              step="25"
              min="200"
            />
          </div>
        </FuturisticInputSection>

        {/* Loads */}
        <FuturisticInputSection 
          title="Applied Loads" 
          icon={<Weight className="w-3.5 h-3.5" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-2 gap-3">
            <FuturisticInput
              label="Dead Load"
              unit="kN/m"
              type="number"
              placeholder="15.0"
              value={formData.deadLoad}
              onChange={(e) => handleInputChange('deadLoad', e.target.value)}
              step="0.5"
              min="0"
            />
            <FuturisticInput
              label="Live Load"
              unit="kN/m"
              type="number"
              placeholder="10.0"
              value={formData.liveLoad}
              onChange={(e) => handleInputChange('liveLoad', e.target.value)}
              step="0.5"
              min="0"
            />
          </div>
        </FuturisticInputSection>

        {/* Materials */}
        <FuturisticInputSection 
          title="Materials" 
          icon={<Layers className="w-3.5 h-3.5" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Concrete Grade
              </Label>
              <Select value={formData.concreteGrade} onValueChange={(v) => handleInputChange('concreteGrade', v)}>
                <SelectTrigger className="h-9 bg-slate-800/60 border-slate-700/60 text-sm focus:border-cyan-500/50 focus:ring-cyan-500/20">
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
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Steel Grade
              </Label>
              <Select value={formData.steelGrade} onValueChange={(v) => handleInputChange('steelGrade', v)}>
                <SelectTrigger className="h-9 bg-slate-800/60 border-slate-700/60 text-sm focus:border-cyan-500/50 focus:ring-cyan-500/20">
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
        </FuturisticInputSection>

        {/* Configuration */}
        <FuturisticInputSection 
          title="Configuration" 
          icon={<Settings2 className="w-3.5 h-3.5" />}
          defaultOpen={false}
        >
          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Support Type
            </Label>
            <Select value={formData.supportType} onValueChange={(v) => handleInputChange('supportType', v)}>
              <SelectTrigger className="h-9 bg-slate-800/60 border-slate-700/60 text-sm focus:border-cyan-500/50 focus:ring-cyan-500/20">
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
        </FuturisticInputSection>

        {/* Design Code Info */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-xl",
          "bg-cyan-500/5 border border-cyan-500/20"
        )}>
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
          <div>
            <p className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">ACI 318 / Eurocode 2</p>
            <p className="text-[10px] text-slate-400">
              Load factors: 1.4 DL + 1.6 LL
            </p>
          </div>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={isCalculating}
          className={cn(
            "w-full h-11 font-semibold text-sm",
            "bg-gradient-to-r from-cyan-500 to-blue-500",
            "hover:from-cyan-400 hover:to-blue-400",
            "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
            "hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]",
            "transition-all duration-300",
            "border border-cyan-400/30"
          )}
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Structure...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Beam Design
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};
