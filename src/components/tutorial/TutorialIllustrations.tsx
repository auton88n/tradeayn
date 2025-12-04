import { motion } from 'framer-motion';
import { Brain, Smile, CircleDot, Zap, AlertCircle, HelpCircle, MessageSquare, Plus, FileText, Image, Lightbulb, Menu, History, User, Settings, LogOut } from 'lucide-react';

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
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-full max-w-xs">
      {/* Chat input mockup */}
      <div className="bg-muted/50 rounded-2xl p-3 border border-border/50 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-background/50 rounded-lg px-3 py-2 text-sm text-muted-foreground">
            Type your message here...
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <motion.div 
            className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </motion.div>
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

export const SuggestionsIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="flex flex-col gap-3">
      {['Tell me more about...', 'How can I improve...', 'What are the next steps?'].map((text, i) => (
        <motion.div
          key={text}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.2 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50 shadow-sm"
        >
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-foreground">{text}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

export const NavigationIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-48 bg-muted/30 rounded-xl border border-border/50 p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/30">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium">AYN AI</span>
      </div>
      
      <div className="space-y-2">
        {['New Chat', 'Recent Chat 1', 'Recent Chat 2'].map((item, i) => (
          <motion.div
            key={item}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`px-3 py-2 rounded-lg text-xs ${i === 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
          >
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export const HistoryIllustration = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-56 bg-muted/30 rounded-xl border border-border/50 p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
        <History className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Transcript</span>
      </div>
      
      <div className="space-y-2">
        {[
          { sender: 'You', text: 'Hello AYN!' },
          { sender: 'AYN', text: 'Hi! How can I help?' },
        ].map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className={`p-2 rounded-lg text-xs ${
              msg.sender === 'You' 
                ? 'bg-primary/10 ml-4' 
                : 'bg-muted/50 mr-4'
            }`}
          >
            <span className="font-medium text-[10px] text-muted-foreground">{msg.sender}</span>
            <p className="text-foreground">{msg.text}</p>
          </motion.div>
        ))}
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
