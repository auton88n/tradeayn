import { motion } from 'framer-motion';
import { Brain, Smile, CircleDot, Zap, AlertCircle, HelpCircle, MessageSquare, Plus, FileText, Image, Search, X, User, Settings, LogOut, Copy, Trash2, ChevronDown, ArrowUp, Heart, Eye, Building2, Ruler, Calculator, Layers } from 'lucide-react';

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
  // Core emotions (Row 1)
  const coreEmotions = [
    { color: 'hsl(193, 38%, 47%)', label: 'Calm', emoji: '😌', meaning: 'Peaceful' },
    { color: 'hsl(36, 100%, 65%)', label: 'Happy', emoji: '😊', meaning: 'Joyful' },
    { color: 'hsl(0, 100%, 67%)', label: 'Excited', emoji: '🤩', meaning: 'Energetic' },
    { color: 'hsl(239, 82%, 61%)', label: 'Thinking', emoji: '🤔', meaning: 'Processing' },
    { color: 'hsl(282, 56%, 62%)', label: 'Curious', emoji: '🧐', meaning: 'Exploring' },
  ];
  
  // Empathy emotions (Row 2)
  const empathyEmotions = [
    { color: 'hsl(349, 49%, 69%)', label: 'Comfort', emoji: '🤗', meaning: 'Nurturing' },
    { color: 'hsl(10, 61%, 78%)', label: 'Supportive', emoji: '💪', meaning: 'Encouraging' },
  ];
  
  // Negative/low energy emotions (Row 3)
  const negativeEmotions = [
    { color: 'hsl(6, 78%, 57%)', label: 'Frustrated', emoji: '😤', meaning: 'Tense' },
    { color: 'hsl(354, 80%, 42%)', label: 'Mad', emoji: '😠', meaning: 'Intense' },
    { color: 'hsl(271, 11%, 59%)', label: 'Sad', emoji: '😢', meaning: 'Melancholy' },
    { color: 'hsl(197, 9%, 58%)', label: 'Bored', emoji: '😑', meaning: 'Low Energy' },
  ];

  const EmotionCircle = ({ emotion, index, baseDelay = 0, small = false }: { emotion: typeof coreEmotions[0], index: number, baseDelay?: number, small?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: baseDelay + index * 0.06, type: 'spring', stiffness: 200 }}
      className="flex flex-col items-center gap-0.5"
    >
      <motion.div 
        className={`${small ? 'w-8 h-8' : 'w-9 h-9'} rounded-full flex items-center justify-center shadow-md`}
        style={{ 
          backgroundColor: emotion.color,
          boxShadow: `0 2px 12px ${emotion.color.replace(')', ', 0.35)')}` 
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.2 }}
      >
        <span className={small ? 'text-sm' : 'text-base'}>{emotion.emoji}</span>
      </motion.div>
      <span className="text-[9px] font-medium text-foreground leading-tight">{emotion.label}</span>
      <span className="text-[7px] text-muted-foreground leading-tight">{emotion.meaning}</span>
    </motion.div>
  );

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        {/* Row 1: Core emotions */}
        <div className="flex items-center gap-2">
          {coreEmotions.map((emotion, i) => (
            <EmotionCircle key={emotion.label} emotion={emotion} index={i} baseDelay={0} />
          ))}
        </div>
        
        {/* Row 2: Empathy emotions with warm background */}
        <motion.div 
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/20"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-[8px] text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider">Empathy</span>
          {empathyEmotions.map((emotion, i) => (
            <EmotionCircle key={emotion.label} emotion={emotion} index={i} baseDelay={0.5} />
          ))}
        </motion.div>
        
        {/* Row 3: Negative emotions */}
        <div className="flex items-center gap-2 opacity-75">
          {negativeEmotions.map((emotion, i) => (
            <EmotionCircle key={emotion.label} emotion={emotion} index={i} baseDelay={0.7} small />
          ))}
        </div>
      </div>
    </div>
  );
};

export const ChatIllustration = () => (
  <div className="w-full h-full flex items-center justify-center px-4">
    <div className="w-full max-w-md space-y-3">
      {/* Chat input mockup - matching actual design */}
      <div className="bg-muted/30 rounded-2xl p-4 border border-border/30 shadow-xl">
        {/* Text area */}
        <div className="mb-3">
          <div className="text-sm text-muted-foreground">
            Ask me anything...
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
            <div className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg">
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
      
      {/* Eng + New buttons row */}
      <div className="flex gap-2 justify-center">
        <div className="h-9 px-4 bg-muted/50 text-foreground rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium border border-border/50">
          <Calculator className="w-3.5 h-3.5" />
          Eng
        </div>
        <div className="h-9 px-4 bg-foreground text-background rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium">
          <Plus className="w-3.5 h-3.5" />
          New
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
      
      {/* Button Row - Eng + New */}
      <div className="p-2 flex gap-1.5">
        <motion.div 
          className="flex-1 h-9 bg-muted/50 text-foreground rounded-lg flex items-center justify-center gap-1 text-xs font-medium border border-border/50"
        >
          <Calculator className="w-3 h-3" />
          Eng
        </motion.div>
        <motion.div 
          className="flex-1 h-9 bg-foreground text-background rounded-lg flex items-center justify-center gap-1 text-xs font-medium"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Plus className="w-3 h-3" />
          New
        </motion.div>
      </div>
      
      {/* Search */}
      <div className="px-2 pb-2">
        <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-border/50 text-muted-foreground text-xs bg-muted/30">
          <Search className="w-3 h-3" />
          Search chats...
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
      {/* Header with circular progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm">Credits</div>
            <div className="text-[10px] text-muted-foreground">Free Plan</div>
          </div>
        </div>
        
        {/* Circular progress */}
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
            <motion.circle 
              cx="18" cy="18" r="14" fill="none" strokeWidth="3" 
              className="text-primary"
              strokeDasharray="88"
              initial={{ strokeDashoffset: 88 }}
              animate={{ strokeDashoffset: 22 }}
              transition={{ duration: 1, delay: 0.3 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold">3/5</span>
          </div>
        </div>
      </div>
      
      {/* Usage info */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Today's Usage</span>
          <span className="font-medium">2 remaining</span>
        </div>
        
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '60%' }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        
        <div className="text-[10px] text-muted-foreground text-center pt-1">
          Resets daily at midnight
        </div>
      </div>
    </div>
  </div>
);

export const ProfileIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-52 bg-muted/30 rounded-xl border border-border/50 p-3 shadow-lg">
      {/* User Info */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/30">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Your Name</p>
          <p className="text-[10px] text-muted-foreground">Free Plan</p>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="space-y-1">
        {/* Upgrade Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-xs font-medium"
        >
          <Zap className="w-3 h-3 text-violet-500" />
          <span className="text-violet-600 dark:text-violet-400">Upgrade Plan</span>
        </motion.div>
        
        {[
          { icon: Settings, label: 'Settings' },
          { icon: HelpCircle, label: 'Tutorial' },
          { icon: MessageSquare, label: 'Support' },
          { icon: LogOut, label: 'Sign Out', danger: true },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <item.icon className="w-3 h-3" />
            {item.label}
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export const EngineeringIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl scale-150" />
      
      {/* Main structure mockup */}
      <div className="relative w-64 bg-background rounded-xl border border-border/50 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-2.5 border-b border-border/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div>
            <div className="font-semibold text-xs">Engineering Tools</div>
            <div className="text-[10px] text-muted-foreground">7 Professional Calculators</div>
          </div>
        </div>
        
        {/* Calculator options - All 7 tools */}
        <div className="p-2 grid grid-cols-2 gap-1.5">
          {[
            { icon: Layers, label: 'Beam', color: 'text-cyan-500' },
            { icon: Building2, label: 'Column', color: 'text-blue-500' },
            { icon: Calculator, label: 'Slab', color: 'text-indigo-500' },
            { icon: Layers, label: 'Foundation', color: 'text-violet-500' },
            { icon: Building2, label: 'Retaining', color: 'text-purple-500' },
            { icon: Ruler, label: 'Grading', color: 'text-emerald-500' },
            { icon: Calculator, label: 'Parking', color: 'text-amber-500' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <item.icon className={`w-3 h-3 ${item.color}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Results preview */}
        <motion.div 
          className="p-2 border-t border-border/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-muted/20 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center">
                <Eye className="w-3 h-3 text-cyan-500" />
              </div>
              <span className="text-[10px]">3D Visualization</span>
            </div>
            <span className="text-emerald-500 text-[10px] font-medium">✓ Ready</span>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);
