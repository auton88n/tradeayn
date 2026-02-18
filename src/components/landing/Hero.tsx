import { BarChart3, Upload, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  onGetStarted: (prefillMessage?: string) => void;
}

// Simplified Hero — no longer used on landing page (LandingPage.tsx has its own hero).
// Kept as a lightweight export in case it's imported elsewhere.
export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-20 pb-12 px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-6 max-w-3xl"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl tracking-[-0.03em]">
          Upload a chart.<br />
          <span className="text-amber-500">Get a pro analysis.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          AYN reads the technicals and returns a full trade setup — entry, stop loss, take profits, and R:R — in seconds.
        </p>
        <button
          onClick={() => onGetStarted()}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-base transition-colors shadow-lg shadow-amber-500/20"
        >
          <Upload className="w-4 h-4" />
          Analyze Your First Chart
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </section>
  );
};
