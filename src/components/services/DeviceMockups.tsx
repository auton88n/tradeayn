import { motion } from 'framer-motion';

const DeviceMockups = () => {
  return (
    <div className="relative h-[200px] flex items-center justify-center">
      {/* Laptop */}
      <motion.div 
        className="relative"
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        viewport={{ once: true }}
      >
        {/* Screen */}
        <div className="w-[180px] h-[110px] bg-foreground rounded-t-lg p-1">
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 rounded-sm overflow-hidden">
            {/* Browser Chrome */}
            <div className="flex items-center gap-1 px-2 py-1 bg-muted/50">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 h-2 bg-background rounded mx-2" />
            </div>
            {/* Content */}
            <div className="p-2 space-y-1">
              <div className="h-2 w-12 bg-primary/30 rounded" />
              <div className="h-1 w-full bg-muted/50 rounded" />
              <div className="h-1 w-3/4 bg-muted/50 rounded" />
              <div className="flex gap-1 mt-2">
                <div className="h-6 w-6 bg-primary/20 rounded" />
                <div className="h-6 w-6 bg-primary/20 rounded" />
                <div className="h-6 w-6 bg-primary/20 rounded" />
              </div>
            </div>
          </div>
        </div>
        {/* Base */}
        <div className="w-[200px] h-2 bg-muted rounded-b-lg mx-auto" />
        <div className="w-[60px] h-1 bg-muted/50 rounded-b mx-auto" />
      </motion.div>
      
      {/* Phone - Overlapping */}
      <motion.div 
        className="absolute right-4 bottom-2 w-[60px] h-[100px] bg-foreground rounded-xl p-0.5 shadow-xl"
        initial={{ x: 20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        viewport={{ once: true }}
      >
        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg overflow-hidden">
          {/* Notch */}
          <div className="w-6 h-1.5 bg-foreground rounded-b mx-auto" />
          {/* Content */}
          <div className="p-1.5 space-y-1 mt-1">
            <div className="h-1 w-8 bg-primary/40 rounded" />
            <div className="h-0.5 w-full bg-muted/50 rounded" />
            <div className="h-0.5 w-3/4 bg-muted/50 rounded" />
            <div className="h-4 w-full bg-muted/30 rounded mt-1" />
          </div>
        </div>
      </motion.div>
      
      {/* Chat Bubble */}
      <motion.div 
        className="absolute -left-2 top-4 bg-background shadow-lg rounded-xl p-2 border border-border/50"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-[8px]">🤖</span>
          </div>
          <p className="text-[9px] text-muted-foreground">How can I help?</p>
        </div>
      </motion.div>
    </div>
  );
};

export default DeviceMockups;
