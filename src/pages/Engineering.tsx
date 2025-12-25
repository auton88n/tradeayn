import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  Building2, 
  Columns3, 
  ArrowLeft,
  Sparkles,
  FileDown,
  History,
  HardHat,
  Box,
  Mountain,
  GitCompare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BeamCalculator } from '@/components/engineering/BeamCalculator';
import { FoundationCalculator } from '@/components/engineering/FoundationCalculator';
import ColumnCalculator from '@/components/engineering/ColumnCalculator';
import SlabCalculator from '@/components/engineering/SlabCalculator';
import RetainingWallCalculator from '@/components/engineering/RetainingWallCalculator';
import { CalculationResults } from '@/components/engineering/CalculationResults';
import { CalculationHistoryModal } from '@/components/engineering/CalculationHistoryModal';
import { CalculationComparison } from '@/components/engineering/CalculationComparison';
import { useEngineeringHistory } from '@/hooks/useEngineeringHistory';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type CalculatorType = 'beam' | 'foundation' | 'column' | 'slab' | 'retaining_wall' | null;

interface CalculationResult {
  type: CalculatorType;
  inputs: Record<string, number | string>;
  outputs: Record<string, number | string | object>;
  timestamp: Date;
}

const calculatorOptions = [
  {
    id: 'grading' as const,
    title: 'AI Grading Designer',
    description: 'Upload survey data, AI generates cut/fill design with DXF export',
    icon: Mountain,
    gradient: 'from-emerald-500 to-teal-500',
    available: true,
    isPage: true,
    path: '/engineering/grading',
  },
  {
    id: 'beam' as const,
    title: 'Beam Design',
    description: 'Calculate reinforced concrete beam dimensions and reinforcement',
    icon: Columns3,
    gradient: 'from-blue-500 to-cyan-500',
    available: true,
  },
  {
    id: 'foundation' as const,
    title: 'Foundation Design',
    description: 'Design isolated footings based on soil bearing capacity',
    icon: Building2,
    gradient: 'from-amber-500 to-orange-500',
    available: true,
  },
  {
    id: 'column' as const,
    title: 'Column Design',
    description: 'Axial load capacity and biaxial bending analysis',
    icon: Box,
    gradient: 'from-purple-500 to-pink-500',
    available: true,
  },
  {
    id: 'slab' as const,
    title: 'Slab Design',
    description: 'Design one-way and two-way slabs with mesh reinforcement',
    icon: Calculator,
    gradient: 'from-green-500 to-emerald-500',
    available: true,
  },
  {
    id: 'retaining_wall' as const,
    title: 'Retaining Wall',
    description: 'Cantilever wall design with lateral earth pressure analysis',
    icon: Building2,
    gradient: 'from-rose-500 to-orange-500',
    available: true,
  },
];

const Engineering = () => {
  const navigate = useNavigate();
  const [selectedCalculator, setSelectedCalculator] = useState<CalculatorType>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  
  const { calculationHistory, fetchHistory } = useEngineeringHistory(userId);

  // Get current user ID and fetch history
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId, fetchHistory]);

  const handleCalculationComplete = (result: CalculationResult) => {
    setCalculationResult(result);
  };

  const handleBack = () => {
    if (calculationResult) {
      setCalculationResult(null);
    } else if (selectedCalculator) {
      setSelectedCalculator(null);
    } else {
      navigate('/');
    }
  };

  const handleNewCalculation = () => {
    setCalculationResult(null);
  };

  return (
    <>
      <SEO 
        title="Civil Engineering Calculator | Structural Design Tool"
        description="Professional civil engineering calculator for beam design, foundation design, and structural analysis. Saudi Building Code compliant calculations."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                    <HardHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">Civil Engineering Calculator</h1>
                    <p className="text-xs text-muted-foreground">
                      {selectedCalculator 
                        ? calculatorOptions.find(c => c.id === selectedCalculator)?.title 
                        : 'Structural Design Tools'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setIsCompareOpen(true)}
                  disabled={!userId || calculationHistory.length < 2}
                  title={calculationHistory.length < 2 ? "Need at least 2 calculations to compare" : "Compare calculations"}
                >
                  <GitCompare className="w-4 h-4" />
                  Compare
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2" 
                  onClick={() => setIsHistoryOpen(true)}
                  disabled={!userId}
                >
                  <History className="w-4 h-4" />
                  History
                </Button>
                <Button variant="outline" size="sm" className="gap-2" disabled>
                  <FileDown className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {/* Calculator Selection */}
            {!selectedCalculator && !calculationResult && (
              <motion.div
                key="selector"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Hero Section */}
                <div className="text-center mb-12">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI-Powered Structural Analysis
                  </motion.div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Professional Engineering Calculations
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Design reinforced concrete structures with real engineering formulas, 
                    3D visualization, and DXF export capabilities.
                  </p>
                </div>

                {/* Calculator Cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {calculatorOptions.map((calc, index) => (
                    <motion.button
                      key={calc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      onClick={() => {
                        if (calc.available) {
                          if ((calc as any).isPage) {
                            navigate((calc as any).path);
                          } else {
                            setSelectedCalculator(calc.id as CalculatorType);
                          }
                        }
                      }}
                      disabled={!calc.available}
                      className={cn(
                        "group relative p-6 rounded-2xl border text-left transition-all duration-300",
                        calc.available 
                          ? "bg-card hover:bg-card/80 border-border hover:border-primary/50 hover:shadow-xl cursor-pointer"
                          : "bg-muted/50 border-border/50 cursor-not-allowed opacity-60"
                      )}
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                        `bg-gradient-to-br ${calc.gradient}`
                      )}>
                        <calc.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{calc.title}</h3>
                      <p className="text-muted-foreground text-sm">{calc.description}</p>
                      
                      {!calc.available && (
                        <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-muted rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
                >
                  {[
                    { title: '3D Visualization', desc: 'Interactive beam and foundation models' },
                    { title: 'DXF Export', desc: 'Download CAD-ready drawings' },
                    { title: 'AI Analysis', desc: 'Smart design recommendations' },
                  ].map((feature, i) => (
                    <div key={i} className="text-center p-4">
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Beam Calculator */}
            {selectedCalculator === 'beam' && !calculationResult && (
              <motion.div
                key="beam"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BeamCalculator 
                  onCalculate={handleCalculationComplete}
                  isCalculating={isCalculating}
                  setIsCalculating={setIsCalculating}
                  userId={userId}
                />
              </motion.div>
            )}

            {/* Foundation Calculator */}
            {selectedCalculator === 'foundation' && !calculationResult && (
              <motion.div
                key="foundation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <FoundationCalculator 
                  onCalculate={handleCalculationComplete}
                  isCalculating={isCalculating}
                  setIsCalculating={setIsCalculating}
                  userId={userId}
                />
              </motion.div>
            )}

            {/* Column Calculator */}
            {selectedCalculator === 'column' && !calculationResult && (
              <motion.div
                key="column"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ColumnCalculator 
                  onCalculationComplete={handleCalculationComplete}
                  onBack={() => setSelectedCalculator(null)}
                  userId={userId}
                />
              </motion.div>
            )}

            {/* Slab Calculator */}
            {selectedCalculator === 'slab' && !calculationResult && (
              <motion.div
                key="slab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SlabCalculator 
                  onCalculate={handleCalculationComplete}
                  isCalculating={isCalculating}
                  setIsCalculating={setIsCalculating}
                  userId={userId}
                />
              </motion.div>
            )}

            {/* Retaining Wall Calculator */}
            {selectedCalculator === 'retaining_wall' && !calculationResult && (
              <motion.div
                key="retaining_wall"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RetainingWallCalculator 
                  onCalculate={handleCalculationComplete}
                  isCalculating={isCalculating}
                  setIsCalculating={setIsCalculating}
                  userId={userId}
                />
              </motion.div>
            )}

            {calculationResult && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <CalculationResults 
                  result={calculationResult}
                  onNewCalculation={handleNewCalculation}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* History Modal */}
        <CalculationHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          userId={userId}
          onLoadCalculation={(calc) => {
            setCalculationResult({
              type: calc.calculation_type as CalculatorType,
              inputs: calc.inputs,
              outputs: calc.outputs,
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

export default Engineering;
