import { motion } from 'framer-motion';
import { Calculator, Ruler, Box, FileText, Building2, Layers } from 'lucide-react';

const EngineeringMockup = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center py-4">
      {/* Central 3D beam/structure icon */}
      <motion.div
        className="relative"
        animate={{ rotateY: [0, 10, 0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl scale-150" />
        
        {/* Main structure container */}
        <div className="relative w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center shadow-2xl backdrop-blur-sm">
          <Building2 className="w-16 h-16 text-cyan-400" />
          
          {/* Dimension lines */}
          <motion.div
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-16 border-l-2 border-dashed border-cyan-400/50"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-2 border-b-2 border-dashed border-cyan-400/50"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </div>
        
        {/* Orbiting elements */}
        {[
          { icon: Calculator, delay: 0, angle: 0 },
          { icon: Ruler, delay: 0.5, angle: 72 },
          { icon: Box, delay: 1, angle: 144 },
          { icon: FileText, delay: 1.5, angle: 216 },
          { icon: Layers, delay: 2, angle: 288 },
        ].map(({ icon: Icon, delay, angle }, i) => (
          <motion.div
            key={i}
            className="absolute w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center shadow-lg"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [
                Math.cos((angle * Math.PI) / 180) * 70 - 20,
                Math.cos(((angle + 360) * Math.PI) / 180) * 70 - 20,
              ],
              y: [
                Math.sin((angle * Math.PI) / 180) * 70 - 20,
                Math.sin(((angle + 360) * Math.PI) / 180) * 70 - 20,
              ],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
              delay,
            }}
          >
            <Icon className="w-5 h-5 text-cyan-500" />
          </motion.div>
        ))}
      </motion.div>
      
      {/* Floating calculation results */}
      <motion.div
        className="absolute bottom-2 right-2 px-3 py-2 rounded-xl bg-background/80 border border-border/50 backdrop-blur-sm shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
      >
        <div className="text-[10px] font-mono text-cyan-500">
          Mu = 245.8 kN·m
        </div>
        <div className="text-[10px] font-mono text-emerald-500">
          ✓ Safe
        </div>
      </motion.div>
    </div>
  );
};

export default EngineeringMockup;
