import { motion } from 'framer-motion';
import { Brain, Smile, CircleDot, Zap, AlertCircle, HelpCircle, MessageSquare, Plus, FileText, Image, Search, X, User, Settings, LogOut, Copy, Trash2, ChevronDown, ArrowUp, Heart, Eye } from 'lucide-react';

export const MeetAynIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div
      className="relative"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl scale-150" />
      
      {/* Eye container */}
      <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-2xl">
        {/* Iris */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          {/* Pupil with brain */}
          <div className="w-12 h-12 rounded-full bg-foreground/90 flex items-center justify-center">
            <Brain className="w-6 h-6 text-background" />
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

export const EmotionsIllustration = () => {
  const emotions = [
    { color: 'rgb(34, 197, 94)', label: 'Happy', icon: Smile },
    { color: 'rgb(59, 130, 246)', label: 'Thinking', icon: CircleDot },
    { color: 'rgb(249, 115, 22)', label: 'Excited', icon: Zap },
    { color: 'rgb(239, 68, 68)', label: 'Frustrated', icon: AlertCircle },
    { color: 'rgb(168, 85, 247)', label: 'Curious', icon: HelpCircle },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="grid grid-cols-5 gap-4">
        {emotions.map((emotion, i) => (
          <motion.div
            key={emotion.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-2"
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: emotion.color }}
            >
              <emotion.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">{emotion.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const ChatIllustration = () => (
  <div className="w-full h-full flex items-center justify-center px-4">
    <div className="w-full max-w-md">
      {/* Chat input mockup - matching actual design */}
      <div className="bg-muted/30 rounded-2xl p-4 border border-border/30 shadow-xl">
        {/* Text area */}
        <div className="mb-3">
          <div className="text-sm text-muted-foreground">
            What business challenge are you facing?
          </div>
        </div>
        
        {/* Bottom toolbar */}
        <div className="flex items-center justify-between">
          {/* Plus button */}
          <div className="w-10 h-10 rounded-xl border border-border/50 bg-background flex items-center justify-center">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Mode selector */}
            <div className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground">
              General
              <ChevronDown className="w-4 h-4" />
            </div>
            
            {/* Send button */}
            <motion.div 
              className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowUp className="w-5 h-5 text-background" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const FilesIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="flex items-center gap-4">
      {[
        { icon: FileText, label: 'PDF', color: 'text-red-500' },
        { icon: Image, label: 'Image', color: 'text-blue-500' },
        { icon: FileText, label: 'Doc', color: 'text-green-500' },
      ].map((file, i) => (
        <motion.div
          key={file.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.15 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-16 h-20 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center shadow-md">
            <file.icon className={`w-8 h-8 ${file.color}`} />
          </div>
          <span className="text-xs text-muted-foreground">{file.label}</span>
        </motion.div>
      ))}
    </div>
  </div>
);


export const NavigationIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-56 bg-background rounded-xl border border-border/50 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-2.5 border-b border-border/30">
        <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
          <Brain className="w-4 h-4 text-background" />
        </div>
        <div>
          <div className="font-semibold text-xs">AYN AI</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground">Active</span>
          </div>
        </div>
      </div>
      
      {/* New Chat Button */}
      <div className="p-2">
        <motion.div 
          className="w-full py-2 px-3 bg-foreground text-background rounded-full flex items-center justify-center gap-1.5 text-xs font-medium"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Plus className="w-3 h-3" />
          New Chat
        </motion.div>
      </div>
      
      {/* Search */}
      <div className="px-2 pb-2">
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full border border-border/50 text-muted-foreground text-xs">
          <Search className="w-3 h-3" />
          Search...
        </div>
      </div>
      
      {/* Recent Chats */}
      <div className="px-2 pb-2">
        <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
          Recent Chats
        </div>
        <div className="flex flex-col items-center justify-center py-3 text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center mb-1">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-[10px]">No recent chats</span>
        </div>
      </div>
    </div>
  </div>
);

export const HistoryIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-56 bg-background rounded-xl border border-border/50 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center relative">
            <MessageSquare className="w-4 h-4" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-medium">
              2
            </div>
          </div>
          <div>
            <div className="font-semibold text-xs">Chat</div>
            <div className="text-[10px] text-muted-foreground">2 messages</div>
          </div>
        </div>
        <X className="w-3 h-3 text-muted-foreground" />
      </div>
      
      {/* Messages */}
      <div className="p-2 space-y-2">
        {/* User message */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-end"
        >
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] font-medium">You</span>
            <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center">
              <User className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="bg-foreground text-background px-2.5 py-1 rounded-xl rounded-br-sm text-xs">
            hello
          </div>
        </motion.div>
        
        {/* AYN message */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-start"
        >
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
              <Brain className="w-2.5 h-2.5 text-background" />
            </div>
            <span className="text-[10px] font-medium">AYN</span>
            <span className="text-[10px]">😌</span>
          </div>
          <div className="bg-muted/50 px-2.5 py-1 rounded-xl rounded-bl-sm text-xs max-w-[160px]">
            😄 How's your day?
          </div>
        </motion.div>
      </div>
      
      {/* Footer buttons */}
      <div className="p-2 border-t border-border/30 flex gap-1.5">
        <button className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-border/50 text-[10px]">
          <Copy className="w-3 h-3" />
          Copy
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-red-200 text-red-500 text-[10px]">
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>
    </div>
  </div>
);

export const EmpathyIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* Warm ambient glow */}
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={{ opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <div className="w-48 h-48 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-400/20 blur-3xl" />
    </motion.div>
    
    {/* Eye with warm glow */}
    <div className="relative">
      <motion.div
        className="relative w-28 h-28 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-2xl"
        style={{
          boxShadow: '0 0 60px rgba(245, 158, 11, 0.4), 0 0 100px rgba(244, 63, 94, 0.2)'
        }}
      >
        {/* Iris with warm color */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/40 to-rose-400/30 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-foreground/90 flex items-center justify-center">
            <Heart className="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </motion.div>
      
      {/* Floating ember particles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(35, 95%, 70%) 0%, transparent 100%)',
            boxShadow: '0 0 8px hsl(30, 90%, 60%)',
            left: '50%',
            top: '50%',
          }}
          animate={{
            x: [0, Math.cos((i / 4) * Math.PI * 2) * 50],
            y: [0, Math.sin((i / 4) * Math.PI * 2) * 50 - 30],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
    
    {/* Labels */}
    <div className="absolute bottom-4 flex gap-4">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-xs text-amber-600 dark:text-amber-400">Comfort</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30">
        <div className="w-2 h-2 rounded-full bg-rose-400" />
        <span className="text-xs text-rose-600 dark:text-rose-400">Support</span>
      </div>
    </div>
  </div>
);

export const MicroBehaviorsIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-6">
      {/* Pupil dilation demo */}
      <div className="flex items-center gap-8">
        {/* Normal pupil */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-foreground" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">Normal</span>
        </div>
        
        {/* Arrow */}
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground"
        >
          →
        </motion.div>
        
        {/* Dilated pupil */}
        <div className="flex flex-col items-center gap-2">
          <motion.div 
            className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <motion.div 
                className="rounded-full bg-foreground"
                animate={{ width: [16, 24, 16], height: [16, 24, 16] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
          <span className="text-[10px] text-muted-foreground">Engaged</span>
        </div>
      </div>
      
      {/* Blink patterns */}
      <div className="flex items-center gap-4">
        {[
          { label: 'Slow Blink', desc: 'Comfort', delay: 0 },
          { label: 'Quick Blink', desc: 'Attention', delay: 0.3 },
          { label: 'Double Blink', desc: 'Understanding', delay: 0.6 },
        ].map((blink, i) => (
          <motion.div
            key={blink.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: blink.delay }}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-muted/30 border border-border/30"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] font-medium">{blink.label}</span>
            <span className="text-[8px] text-muted-foreground">{blink.desc}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export const CreditsIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-56 bg-background rounded-xl border border-border/50 shadow-lg overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="font-semibold text-sm">Monthly Credits</div>
          <div className="text-[10px] text-muted-foreground">Resets Jan 1</div>
        </div>
      </div>
      
      {/* Usage display */}
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">24 / 100</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '24%' }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-primary">76</div>
            <div className="text-[9px] text-muted-foreground">Remaining</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-green-500">✓</div>
            <div className="text-[9px] text-muted-foreground">Active</div>
          </div>
        </div>
        
        {/* Color states */}
        <div className="flex justify-center gap-2 pt-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[8px] text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[8px] text-muted-foreground">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[8px] text-muted-foreground">Low</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ProfileIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-48 bg-muted/30 rounded-xl border border-border/50 p-3 shadow-lg">
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/30">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Your Name</p>
          <p className="text-[10px] text-muted-foreground">Company</p>
        </div>
      </div>
      
      <div className="space-y-1">
        {[
          { icon: Settings, label: 'Settings' },
          { icon: LogOut, label: 'Sign Out' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/50"
          >
            <item.icon className="w-3 h-3" />
            {item.label}
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);
