import { motion } from 'framer-motion';

const MobileMockup = () => {
  return (
    <div className="relative flex justify-center items-center py-8">
      {/* iPhone Frame */}
      <motion.div 
        className="relative w-[220px] h-[440px] bg-foreground rounded-[40px] p-2 shadow-2xl"
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        viewport={{ once: true }}
      >
        {/* Screen */}
        <div className="w-full h-full bg-background rounded-[32px] overflow-hidden relative">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-b-2xl z-10" />
          
          {/* Status Bar */}
          <div className="flex justify-between items-center px-6 pt-2 text-[10px] text-muted-foreground">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-muted rounded-sm" />
              <div className="w-4 h-2 bg-muted rounded-sm" />
              <div className="w-6 h-2 bg-muted rounded-sm" />
            </div>
          </div>
          
          {/* App Content */}
          <div className="p-4 pt-8 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-primary/60" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Welcome back</p>
                <p className="text-sm font-semibold text-foreground">Carolina</p>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Followers', value: '124K' },
                { label: 'Posts', value: '847' },
                { label: 'Likes', value: '2.1M' },
              ].map((stat, i) => (
                <div key={i} className="bg-muted/50 rounded-xl p-2 text-center">
                  <p className="text-xs font-bold text-foreground">{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            
            {/* Content Cards */}
            <div className="space-y-2">
              {[1, 2, 3].map((_, i) => (
                <motion.div 
                  key={i}
                  className="flex items-center gap-3 bg-muted/30 rounded-xl p-2"
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-muted to-muted-foreground/20" />
                  <div className="flex-1">
                    <div className="h-2 w-16 bg-muted rounded" />
                    <div className="h-1.5 w-12 bg-muted/50 rounded mt-1" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-primary/20" />
                </motion.div>
              ))}
            </div>
            
            {/* Bottom Nav */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex justify-around items-center bg-muted/50 rounded-2xl p-3">
                {[1, 2, 3, 4].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-6 h-6 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted'}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Floating Elements */}
      <motion.div 
        className="absolute -right-4 top-16 bg-background shadow-lg rounded-xl p-3 border border-border/50"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-green-500 text-xs">↑</span>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Engagement</p>
            <p className="text-xs font-bold text-green-500">+24%</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MobileMockup;
