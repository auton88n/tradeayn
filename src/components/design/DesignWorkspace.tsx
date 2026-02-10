import React, { useState, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DesignSidebar, DesignToolType } from './DesignSidebar';
import { EngineeringBottomChat } from '@/components/engineering/workspace/EngineeringBottomChat';
import { SEO } from '@/components/shared/SEO';
import { HardHat } from 'lucide-react';

// Reuse existing lazy-loaded components
// const ParkingDesigner = lazy(() => import('@/components/engineering/ParkingDesigner').then(m => ({ default: m.ParkingDesigner })));
const ComplianceWizard = lazy(() => import('@/components/engineering/compliance/ComplianceWizard'));
// const DrawingGenerator = lazy(() => import('@/components/engineering/drawings/DrawingGenerator'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-pulse flex flex-col items-center gap-3">
      <HardHat className="w-8 h-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

interface DesignWorkspaceProps {
  userId: string;
}

export const DesignWorkspace: React.FC<DesignWorkspaceProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState<DesignToolType>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentInputs, setCurrentInputs] = useState<Record<string, any>>({});
  const [currentOutputs, setCurrentOutputs] = useState<Record<string, any> | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleBack = () => {
    if (selectedTool) {
      setSelectedTool(null);
      setCurrentInputs({});
      setCurrentOutputs(null);
    } else {
      navigate('/');
    }
  };

  const handleInputChange = useCallback((inputs: Record<string, any>) => {
    setCurrentInputs(inputs);
  }, []);

  const handleCalculationComplete = useCallback((result: any) => {
    setCurrentOutputs(result.outputs);
    setIsCalculating(false);
  }, []);

  const handleSwitchCalculator = useCallback((type: string) => {
    setSelectedTool(type as DesignToolType);
    setCurrentInputs({});
    setCurrentOutputs(null);
  }, []);

  const renderToolForm = () => {
    switch (selectedTool) {
      // case 'drawings':
      //   return (
      //     <Suspense fallback={<LoadingFallback />}>
      //       <DrawingGenerator />
      //     </Suspense>
      //   );
      case 'compliance':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ComplianceWizard userId={userId} />
          </Suspense>
        );
      // case 'parking': (hidden for now)
      //   return null;
      default:
        return null;
    }
  };

  const renderSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center p-8"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6"
      >
        <Sparkles className="w-4 h-4" />
        AI-Powered Design Tools
      </motion.div>
      
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
        Design Studio
      </h2>
      <p className="text-muted-foreground max-w-2xl text-center mb-8">
        Select a tool from the sidebar to get started with
        building code compliance checks.
      </p>

      <div className="grid md:grid-cols-3 gap-6 max-w-3xl">
        {[
          { title: 'Code Compliance', desc: 'Check against building codes' },
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
        title="Design Studio | Architectural & Compliance Tools"
        description="AI-powered design tools for architectural drawings and building code compliance checks."
      />

      <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <header className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xl z-40">
          <div className="px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <Palette className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Design Studio</h1>
                <p className="text-xs text-muted-foreground">
                  {selectedTool 
                    ? selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1).replace('_', ' ')
                    : 'Design & Compliance Tools'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          <DesignSidebar
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              {!selectedTool ? (
                renderSelection()
              ) : (
                <motion.div
                  key={selectedTool}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 md:p-6"
                >
                  <div className="max-w-4xl mx-auto space-y-6">
                    {renderToolForm()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Bottom Chat */}
        <EngineeringBottomChat
          onCalculate={() => setIsCalculating(true)}
          onCompare={() => {}}
          onHistory={() => {}}
          onReset={() => { setCurrentInputs({}); setCurrentOutputs(null); }}
          onSave={() => {}}
          onExportPDF={() => {}}
          onExportDXF={() => {}}
          isCalculating={isCalculating}
          hasResults={!!currentOutputs}
          canCompare={false}
          calculatorType={selectedTool}
          currentInputs={currentInputs}
          currentOutputs={currentOutputs}
          onSetInput={(field, value) => setCurrentInputs(prev => ({ ...prev, [field]: value }))}
          onSetMultipleInputs={(inputs) => setCurrentInputs(prev => ({ ...prev, ...inputs }))}
          onSwitchCalculator={handleSwitchCalculator}
          sidebarCollapsed={sidebarCollapsed}
        />
      </div>
    </>
  );
};

export default DesignWorkspace;
