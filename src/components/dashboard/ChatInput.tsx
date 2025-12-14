import React, { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, ChevronDown, ArrowUp, FileText, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { analyzeUserEmotion, UserEmotion } from '@/utils/userEmotionDetection';
import { detectLanguage, DetectedLanguage } from '@/utils/languageDetection';
import type { AIMode } from '@/types/dashboard.types';

interface ChatInputProps {
  onSend: (message: string, file?: File | null) => void;
  isDisabled?: boolean;
  selectedMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  selectedFile?: File | null;
  isUploading?: boolean;
  isDragOver?: boolean;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onFileSelect?: (file: File | null) => void;
  onRemoveFile?: () => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  hasMessages?: boolean;
  sidebarOpen?: boolean;
  transcriptOpen?: boolean;
  modes?: Array<{
    name: string;
    translatedName: string;
    icon: React.ComponentType<{
      className?: string;
    }>;
  }>;
  prefillValue?: string;
  onPrefillConsumed?: () => void;
  onLanguageChange?: (language: DetectedLanguage) => void;
  // Real-time emotion feedback callback
  onEmotionDetected?: (emotion: UserEmotion | null, inputText: string) => void;
}
const modes = [{
  name: 'General',
  translatedName: 'General',
  icon: '🧠'
}, {
  name: 'Research',
  translatedName: 'Research',
  icon: '🔬'
}, {
  name: 'PDF Analysis',
  translatedName: 'PDF Analysis',
  icon: '📄'
}, {
  name: 'Vision',
  translatedName: 'Vision',
  icon: '👁️'
}, {
  name: 'Civil Engineering',
  translatedName: 'Civil Engineering',
  icon: '🏗️'
}];
const placeholders = ["Ask me anything...", "What's on your mind?", "How can I help you today?", "Type your question here..."];
const getSendButtonClass = (mode: string) => {
  const modeName = mode.toLowerCase();
  if (modeName.includes('general')) return 'bg-foreground text-background';
  if (modeName.includes('research')) return 'bg-green-600 text-white';
  if (modeName.includes('pdf')) return 'bg-purple-600 text-white';
  if (modeName.includes('vision')) return 'bg-orange-600 text-white';
  if (modeName.includes('civil')) return 'bg-teal-600 text-white';
  return 'bg-foreground text-background';
};
const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(({
  onSend,
  isDisabled = false,
  selectedMode = 'General' as AIMode,
  onModeChange,
  selectedFile = null,
  isUploading = false,
  isDragOver = false,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onRemoveFile,
  fileInputRef,
  prefillValue = '',
  onPrefillConsumed,
  onLanguageChange,
  onEmotionDetected
}, ref) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [detectedEmotion, setDetectedEmotion] = useState<UserEmotion | null>(null);
  const [detectedLang, setDetectedLang] = useState<DetectedLanguage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const languageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    setIsUserTyping,
    setIsAttentive,
    updateActivity,
    triggerAttentionBlink
  } = useAYNEmotion();
  const { playSound, playModeChange } = useSoundContext();

  // Handle prefilled input
  useEffect(() => {
    if (prefillValue) {
      setInputMessage(prefillValue);
      setShowPlaceholder(false);
      // Auto-resize textarea after React updates DOM
      setTimeout(() => {
        if (textareaRef.current) {
          // First reset to auto to get accurate scrollHeight
          textareaRef.current.style.height = 'auto';
          const scrollHeight = textareaRef.current.scrollHeight;
          // Then set to actual content height, respecting max (280px)
          textareaRef.current.style.height = Math.max(44, Math.min(scrollHeight, 200)) + 'px';
          textareaRef.current.focus();
        }
      }, 0);
      if (onPrefillConsumed) onPrefillConsumed();
    }
  }, [prefillValue, onPrefillConsumed]);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder(prev => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simplified typing detection with emotion and language analysis
  useEffect(() => {
    if (inputMessage.trim()) {
      setIsUserTyping(true);
      setIsAttentive(true);
      updateActivity();
      
      // Analyze emotion after a brief pause
      if (emotionTimeoutRef.current) {
        clearTimeout(emotionTimeoutRef.current);
      }
      emotionTimeoutRef.current = setTimeout(() => {
        if (inputMessage.trim().length > 3) {
          const result = analyzeUserEmotion(inputMessage);
          if (result.emotion !== 'neutral' && result.intensity > 0.3) {
            setDetectedEmotion(result.emotion);
            // Notify parent for real-time eye feedback
            if (onEmotionDetected) {
              onEmotionDetected(result.emotion, inputMessage);
            }
          } else {
            setDetectedEmotion(null);
            if (onEmotionDetected) {
              onEmotionDetected(null, inputMessage);
            }
          }
        }
      }, 300);

      // Detect language after a brief pause
      if (languageTimeoutRef.current) {
        clearTimeout(languageTimeoutRef.current);
      }
      languageTimeoutRef.current = setTimeout(() => {
        if (inputMessage.trim().length > 2) {
          const langResult = detectLanguage(inputMessage);
          setDetectedLang(langResult);
          if (onLanguageChange) {
            onLanguageChange(langResult);
          }
        }
      }, 200);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsUserTyping(false);
      }, 1000);
    } else {
      setIsUserTyping(false);
      setDetectedEmotion(null);
      setDetectedLang(null);
      if (onEmotionDetected) {
        onEmotionDetected(null, '');
      }
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (emotionTimeoutRef.current) {
        clearTimeout(emotionTimeoutRef.current);
      }
      if (languageTimeoutRef.current) {
        clearTimeout(languageTimeoutRef.current);
      }
    };
  }, [inputMessage, setIsUserTyping, setIsAttentive, updateActivity, onLanguageChange, onEmotionDetected]);
  // Emotion indicator config
  const emotionIndicators: Record<UserEmotion, { emoji: string; color: string; label: string }> = {
    happy: { emoji: '😊', color: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30', label: 'Happy' },
    sad: { emoji: '😔', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30', label: 'Sad' },
    frustrated: { emoji: '😤', color: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30', label: 'Frustrated' },
    excited: { emoji: '🎉', color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30', label: 'Excited' },
    anxious: { emoji: '😰', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30', label: 'Anxious' },
    confused: { emoji: '🤔', color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30', label: 'Confused' },
    neutral: { emoji: '😐', color: 'bg-muted text-muted-foreground border-border', label: 'Neutral' },
    angry: { emoji: '😡', color: 'bg-red-600/20 text-red-700 dark:text-red-400 border-red-600/30', label: 'Angry' },
    grieving: { emoji: '💔', color: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30', label: 'Grieving' },
    overwhelmed: { emoji: '😫', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30', label: 'Overwhelmed' },
  };

  const handleSend = useCallback(() => {
    if (!inputMessage.trim() && !selectedFile) return;
    if (isDisabled || isUploading) return;
    playSound('message-send');
    onSend(inputMessage.trim(), selectedFile);
    setInputMessage('');
    setShowPlaceholder(true);
    setDetectedEmotion(null);
    setDetectedLang(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    setTimeout(() => {
      triggerAttentionBlink();
    }, 100);
  }, [inputMessage, selectedFile, isDisabled, isUploading, onSend, triggerAttentionBlink, playSound]);
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Value comes from RTL textarea but content is LTR
    const value = e.target.value;
    setInputMessage(value);
    setShowPlaceholder(!value);

    // Auto-resize with increased max-height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(44, Math.min(textareaRef.current.scrollHeight, 200)) + 'px';
    }
  }, []);
  const handleFileClick = useCallback(() => {
    fileInputRef?.current?.click();
  }, [fileInputRef]);
  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFile) onRemoveFile();
  }, [onRemoveFile]);
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  }, [onFileSelect]);
  return <div className={cn("relative w-full transition-all duration-300 px-3 pb-3", isDragOver && "bg-primary/5")} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center z-10">
            <p className="text-primary font-medium">Drop file here</p>
          </motion.div>}
      </AnimatePresence>

      {/* Main container */}
      <div className={cn("relative bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden transition-all duration-300", isDragOver && "border-primary shadow-xl", isInputFocused && "border-border/80 shadow-xl")}>
        {/* Row 1: Input area with flexbox layout */}
        <div className="flex items-end gap-3 px-4 pt-3 pb-2">
          <div className="relative flex-1 min-w-0">
            <Textarea 
              ref={textareaRef} 
              value={inputMessage} 
              onChange={handleTextareaChange} 
              onKeyDown={handleKeyPress} 
              onFocus={() => setIsInputFocused(true)} 
              onBlur={() => setIsInputFocused(false)} 
              disabled={isDisabled || isUploading} 
              className={cn(
                "w-full resize-none min-h-[44px] max-h-[200px]",
                "text-base bg-transparent",
                "border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-foreground placeholder:text-muted-foreground",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "leading-relaxed",
                "overflow-y-auto",
                "px-2 py-2"
              )}
            />

            {/* Typewriter placeholder */}
            {showPlaceholder && !inputMessage && !isInputFocused && (
              <div className="absolute top-[10px] left-[10px] pointer-events-none">
                <motion.span 
                  key={currentPlaceholder} 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 0.5, y: 0 }} 
                  exit={{ opacity: 0, y: -5 }} 
                  transition={{ duration: 0.3 }} 
                  className="text-muted-foreground text-base md:text-lg"
                >
                  {placeholders[currentPlaceholder]}
                </motion.span>
              </div>
            )}
          </div>

          {/* Send button - flexbox aligned to bottom */}
          <AnimatePresence>
            {inputMessage.trim() && !isDisabled && (
              <motion.button 
                initial={{ scale: 0, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0, opacity: 0 }} 
                transition={{ duration: 0.15, ease: "easeOut" }} 
                onClick={handleSend} 
                disabled={isDisabled || isUploading} 
                className={cn(
                  "shrink-0 mb-1",
                  "w-10 h-10 rounded-xl",
                  "flex items-center justify-center",
                  "transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  "shadow-lg hover:shadow-xl",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                  getSendButtonClass(selectedMode)
                )}
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* File chip */}
        <AnimatePresence>
          {selectedFile && <motion.div initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: 'auto',
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} className="px-5 pb-2 overflow-hidden">
              <motion.div initial={{
            scale: 0.9,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} exit={{
            scale: 0.9,
            opacity: 0
          }} className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50 w-fit max-w-[300px]">
                {getFileIcon(selectedFile)}
                <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</span>
                <button onClick={handleRemoveFile} className="p-0.5 hover:bg-muted rounded transition-colors">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </motion.div>
            </motion.div>}
        </AnimatePresence>

        {/* Row 2: Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-muted/20">
          {/* Left: Action buttons + Emotion indicator */}
          <div className="flex items-center gap-2">
            <button onClick={handleFileClick} disabled={isDisabled || isUploading} className={cn("p-2 rounded-lg", "hover:bg-muted/60", "transition-all duration-200", "disabled:opacity-50 disabled:cursor-not-allowed")}>
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>
            
            {/* Emotion indicator */}
            <AnimatePresence>
              {detectedEmotion && detectedEmotion !== 'neutral' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    emotionIndicators[detectedEmotion].color
                  )}
                >
                  <span>{emotionIndicators[detectedEmotion].emoji}</span>
                  <span>AYN senses: {emotionIndicators[detectedEmotion].label}</span>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Mode indicator - General only */}
          <div className="h-8 px-3 rounded-lg border border-border/50 flex items-center gap-1.5 bg-muted/30">
            <span className="text-sm">🧠</span>
            <span className="text-sm font-medium text-foreground">General</span>
          </div>
        </div>
      </div>

      {/* AI Disclaimer */}
      <p className="text-xs text-muted-foreground/60 text-center mt-2">
        AYN is AI and can make mistakes. Always verify critical details.
      </p>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.json,.csv,.xlsx,.png,.jpg,.jpeg,.gif,.webp" onChange={handleFileInputChange} />
    </div>;
});
ChatInput.displayName = 'ChatInput';
export default ChatInput;