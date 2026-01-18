import React, { useState, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardHat, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalculatorSidebar, CalculatorType } from './CalculatorSidebar';
import { BottomToolbar } from './BottomToolbar';
import { SplitViewLayout } from './SplitViewLayout';
import { FloatingAIButton } from './FloatingAIButton';
import { CalculationHistoryModal } from '@/components/engineering/CalculationHistoryModal';
import { CalculationComparison } from '@/components/engineering/CalculationComparison';
import { useEngineeringHistory } from '@/hooks/useEngineeringHistory';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';

// Lazy load calculator components
const BeamCalculator = lazy(() => import('@/components/engineering/BeamCalculator').then(m => ({ default: m.BeamCalculator })));
const FoundationCalculator = lazy(() => import('@/components/engineering/FoundationCalculator').then(m => ({ default: m.FoundationCalculator })));
const ColumnCalculator = lazy(() => import('@/components/engineering/ColumnCalculator'));
const SlabCalculator = lazy(() => import('@/components/engineering/SlabCalculator'));
const RetainingWallCalculator = lazy(() => import('@/components/engineering/RetainingWallCalculator'));
const ParkingDesigner = lazy(() => import('@/components/engineering/ParkingDesigner').then(m => ({ default: m.ParkingDesigner })));

// Lazy load 3D visualizations
const BeamVisualization3D = lazy(() => import('@/components/engineering/BeamVisualization3D').then(m => ({ default: m.BeamVisualization3D })));
const FoundationVisualization3D = lazy(() => import('@/components/engineering/FoundationVisualization3D').then(m => ({ default: m.FoundationVisualization3D })));
const ColumnVisualization3D = lazy(() => import('@/components/engineering/ColumnVisualization3D').then(m => ({ default: m.ColumnVisualization3D })));
const SlabVisualization3D = lazy(() => import('@/components/engineering/SlabVisualization3D').then(m => ({ default: m.SlabVisualization3D })));
const RetainingWallVisualization3D = lazy(() => import('@/components/engineering/RetainingWallVisualization3D').then(m => ({ default: m.RetainingWallVisualization3D })));
const ParkingVisualization3D = lazy(() => import('@/components/engineering/ParkingVisualization3D').then(m => ({ default: m.ParkingVisualization3D })));

interface CalculationResult {
  type: CalculatorType;
  inputs: Record<string, number | string>;
  outputs: Record<string, number | string | object>;
  timestamp: Date;
}

interface EngineeringWorkspaceProps {
  userId: string;
}

// Loading fallback for lazy components
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-pulse flex flex-col items-center gap-3">
      <HardHat className="w-8 h-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export const EngineeringWorkspace: React.FC<EngineeringWorkspaceProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [selectedCalculator, setSelectedCalculator] = useState<CalculatorType>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  
  // Current inputs/outputs for live preview
  const [currentInputs, setCurrentInputs] = useState<Record<string, any>>({});
  const [currentOutputs, setCurrentOutputs] = useState<Record<string, any> | null>(null);

  const { calculationHistory } = useEngineeringHistory(userId);

  const handleCalculationComplete = useCallback((result: CalculationResult) => {
    setCalculationResult(result);
    setCurrentOutputs(result.outputs as Record<string, any>);
  }, []);

  const handleInputChange = useCallback((inputs: Record<string, any>) => {
    setCurrentInputs(inputs);
  }, []);

  const handleBack = () => {
    if (calculationResult) {
      setCalculationResult(null);
    } else if (selectedCalculator) {
      setSelectedCalculator(null);
      setCurrentInputs({});
      setCurrentOutputs(null);
    } else {
      navigate('/');
    }
  };

  const handleCalculate = useCallback(() => {
    // Trigger calculation from current calculator
    // This will be connected to individual calculator's calculate method
    setIsCalculating(true);
    // The actual calculation is handled by each calculator component
  }, []);

  const handleReset = useCallback(() => {
    setCurrentInputs({});
    setCurrentOutputs(null);
    setCalculationResult(null);
  }, []);

  // Render calculator form
  const renderCalculatorForm = () => {
    const commonProps = {
      onCalculate: handleCalculationComplete,
      isCalculating,
      setIsCalculating,
      userId,
      onInputChange: handleInputChange,
    };

    switch (selectedCalculator) {
      case 'beam':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <BeamCalculator {...commonProps} />
          </Suspense>
        );
      case 'foundation':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FoundationCalculator {...commonProps} />
          </Suspense>
        );
      case 'column':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ColumnCalculator 
              onCalculationComplete={handleCalculationComplete}
              onBack={() => setSelectedCalculator(null)}
              userId={userId}
            />
          </Suspense>
        );
      case 'slab':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SlabCalculator {...commonProps} />
          </Suspense>
        );
      case 'retaining_wall':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <RetainingWallCalculator {...commonProps} />
          </Suspense>
        );
      case 'parking':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ParkingDesigner {...commonProps} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  // Render live preview
  const renderPreview = () => {
    if (!selectedCalculator) return null;

    const previewInputs = calculationResult?.inputs || currentInputs;
    const previewOutputs = calculationResult?.outputs || currentOutputs;

    const has3DData = Object.keys(previewInputs).length > 0;

    if (!has3DData) return null;

    switch (selectedCalculator) {
      case 'beam':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <BeamVisualization3D 
              inputs={previewInputs as any}
              outputs={previewOutputs as any}
            />
          </Suspense>
        );
      case 'foundation':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FoundationVisualization3D 
              inputs={previewInputs as any}
              outputs={previewOutputs as any}
            />
          </Suspense>
        );
      case 'column':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ColumnVisualization3D 
              inputs={previewInputs as any}
              outputs={previewOutputs as any}
            />
          </Suspense>
        );
      case 'slab':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SlabVisualization3D 
              inputs={previewInputs as any}
              outputs={previewOutputs as any}
            />
          </Suspense>
        );
      case 'retaining_wall':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <RetainingWallVisualization3D 
              inputs={previewInputs as any}
              outputs={previewOutputs as any}
            />
          </Suspense>
        );
      case 'parking':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ParkingVisualization3D 
              outputs={previewOutputs as any}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

  // Calculator selection view
  const renderCalculatorSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center p-8"
    >
      {/* Hero */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
      >
        <Sparkles className="w-4 h-4" />
        AI-Powered Structural Analysis
      </motion.div>
      
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
        Professional Engineering Calculations
      </h2>
      <p className="text-muted-foreground max-w-2xl text-center mb-8">
        Select a calculator from the sidebar to begin designing reinforced concrete structures
        with real engineering formulas, 3D visualization, and DXF export.
      </p>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 max-w-3xl">
        {[
          { title: '3D Visualization', desc: 'Interactive beam and foundation models' },
          { title: 'DXF Export', desc: 'Download CAD-ready drawings' },
          { title: 'AI Analysis', desc: 'Smart design recommendations' },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="text-center p-6 rounded-xl border border-border/50 bg-card/50"
          >
            <h4 className="font-semibold mb-1">{feature.title}</h4>
            <p className="text-sm text-muted-foreground">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <>
      <SEO 
        title="Civil Engineering Calculator | Structural Design Tool"
        description="Professional civil engineering calculator for beam design, foundation design, and structural analysis. Saudi Building Code compliant calculations."
      />

      <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <header className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xl z-40">
          <div className="px-4 py-3 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <HardHat className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Civil Engineering Studio</h1>
                <p className="text-xs text-muted-foreground">
                  {selectedCalculator 
                    ? `${selectedCalculator.charAt(0).toUpperCase() + selectedCalculator.slice(1).replace('_', ' ')} Design`
                    : 'Structural Design Tools'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0 pb-16">
          {/* Sidebar */}
          <CalculatorSidebar
            selectedCalculator={selectedCalculator}
            onSelectCalculator={setSelectedCalculator}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onNavigate={navigate}
          />

          {/* Workspace */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {!selectedCalculator ? (
                renderCalculatorSelection()
              ) : (
                <SplitViewLayout
                  key={selectedCalculator}
                  formContent={renderCalculatorForm()}
                  previewContent={renderPreview()}
                  hasPreview={Object.keys(currentInputs).length > 0 || !!calculationResult}
                />
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Bottom Toolbar */}
        <BottomToolbar
          onCalculate={handleCalculate}
          onCompare={() => setIsCompareOpen(true)}
          onHistory={() => setIsHistoryOpen(true)}
          onReset={handleReset}
          isCalculating={isCalculating}
          hasResults={!!calculationResult}
          canCompare={calculationHistory.length >= 2}
          calculatorType={selectedCalculator}
        />

        {/* Floating AI Chat */}
        <FloatingAIButton
          calculatorType={selectedCalculator}
          inputs={currentInputs}
          outputs={currentOutputs}
        />

        {/* History Modal */}
        <CalculationHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          userId={userId}
          onLoadCalculation={(calc) => {
            setSelectedCalculator(calc.calculation_type as CalculatorType);
            setCurrentInputs(calc.inputs as Record<string, any>);
            setCurrentOutputs(calc.outputs as Record<string, any>);
            setCalculationResult({
              type: calc.calculation_type as CalculatorType,
              inputs: calc.inputs as Record<string, any>,
              outputs: calc.outputs as Record<string, any>,
              timestamp: new Date(calc.created_at),
            });
            setIsHistoryOpen(false);
          }}
        />

        {/* Comparison Modal */}
        <AnimatePresence>
          {isCompareOpen && (
            <CalculationComparison
              calculations={calculationHistory}
              onClose={() => setIsCompareOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default EngineeringWorkspace;
