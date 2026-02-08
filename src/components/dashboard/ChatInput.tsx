import React, { useState, useRef, useEffect, forwardRef, useCallback, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, ChevronDown, ArrowUp, FileText, X, Image as ImageIcon, AlertTriangle, MessageSquarePlus, Loader2, FileImage, FileCode, FileSpreadsheet, FileArchive, FileAudio, FileVideo, File, RefreshCw, Check, Volume2, VolumeX, Brain, Sparkles, Mic, MicOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAYNEmotion } from '@/stores/emotionStore';
import { useSoundStore } from '@/stores/soundStore';
import { detectLanguage, DetectedLanguage } from '@/lib/languageDetection';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TranscriptMessage } from '@/components/transcript/TranscriptMessage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { AIMode, Message } from '@/types/dashboard.types';
interface Suggestion {
  id: string;
  content: string;
  emoji: string;
  isVisible: boolean;
}
interface ChatInputProps {
  onSend: (message: string, file?: File | null) => void;
  suggestions?: Suggestion[];
  onSuggestionClick?: (content: string, emoji: string, position: {
    x: number;
    y: number;
  }) => void;
  isDisabled?: boolean;
  selectedMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  selectedFile?: File | null;
  isUploading?: boolean;
  uploadProgress?: number;
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
  onTranscriptToggle?: () => void;
  onTranscriptClear?: () => void;
  transcriptMessages?: Message[];
  modes?: Array<{
    name: string;
    translatedName: string;
    description?: string;
    icon: React.ComponentType<{
      className?: string;
    }>;
    color?: string;
  }>;
  prefillValue?: string;
  onPrefillConsumed?: () => void;
  onLanguageChange?: (language: DetectedLanguage) => void;
  // Empathy callback - pass typing content up for emotion detection
  onTypingContentChange?: (content: string) => void;
  // Message limit props
  hasReachedLimit?: boolean;
  messageCount?: number;
  maxMessages?: number;
  onStartNewChat?: () => void;
  // Upload retry props
  uploadFailed?: boolean;
  onRetryUpload?: () => void;
  // Maintenance mode
  maintenanceActive?: boolean;
  // Credits exhausted - blocks sending
  creditsExhausted?: boolean;
}
// Default modes - only used as fallback
const defaultModes = [{
  name: 'General',
  translatedName: 'AYN',
  icon: '🧠'
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
// Get file extension from filename
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// FileTypeIcon component - shows different icons based on file extension
const FileTypeIcon = ({
  filename,
  className
}: {
  filename: string;
  className?: string;
}) => {
  const ext = getFileExtension(filename);

  // PDF files
  if (ext === 'pdf') {
    return <FileText className={cn(className, "text-red-400")} />;
  }

  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic'].includes(ext)) {
    return <FileImage className={cn(className, "text-emerald-400")} />;
  }

  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'swift', 'kt'].includes(ext)) {
    return <FileCode className={cn(className, "text-blue-400")} />;
  }

  // Spreadsheet files
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(ext)) {
    return <FileSpreadsheet className={cn(className, "text-green-400")} />;
  }

  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
    return <FileArchive className={cn(className, "text-amber-400")} />;
  }

  // Audio files
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)) {
    return <FileAudio className={cn(className, "text-purple-400")} />;
  }

  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv'].includes(ext)) {
    return <FileVideo className={cn(className, "text-pink-400")} />;
  }

  // Document files (Word, etc.)
  if (['doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(ext)) {
    return <FileText className={cn(className, "text-blue-400")} />;
  }

  // Default file icon
  return <File className={cn(className, "text-neutral-400")} />;
};
const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return <FileImage className="w-4 h-4 text-emerald-400" />;
  return <FileText className="w-4 h-4 text-neutral-400" />;
};
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(({
  onSend,
  suggestions = [],
  onSuggestionClick,
  isDisabled = false,
  selectedMode = 'General' as AIMode,
  onModeChange,
  selectedFile = null,
  isUploading = false,
  uploadProgress = 0,
  isDragOver = false,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onRemoveFile,
  fileInputRef,
  transcriptOpen = false,
  onTranscriptToggle,
  onTranscriptClear,
  transcriptMessages = [],
  modes,
  prefillValue = '',
  onPrefillConsumed,
  onLanguageChange,
  onTypingContentChange,
  hasReachedLimit = false,
  messageCount = 0,
  maxMessages = 100,
  onStartNewChat,
  uploadFailed = false,
  onRetryUpload,
  maintenanceActive = false,
  creditsExhausted = false
}, ref) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const visibleSuggestions = suggestions.filter(s => s.isVisible);

  // Sort messages chronologically (oldest first)
  const sortedTranscriptMessages = useMemo(() => [...transcriptMessages].sort((a, b) => {
    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return timeA - timeB;
  }), [transcriptMessages]);

  // Auto-scroll history to bottom when messages change or panel opens
  useEffect(() => {
    if (transcriptOpen && historyScrollRef.current) {
      requestAnimationFrame(() => {
        const el = historyScrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }, [transcriptMessages.length, transcriptOpen]);

  // Track scroll position for scroll-to-bottom button
  const handleHistoryScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distFromBottom > 100);
  }, []);
  const scrollHistoryToBottom = useCallback(() => {
    historyScrollRef.current?.scrollTo({
      top: historyScrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  // Handle clear with confirmation
  const handleClearClick = useCallback(() => {
    setShowClearConfirm(true);
  }, []);
  const handleClearConfirm = useCallback(() => {
    setShowClearConfirm(false);
    onTranscriptClear?.();
  }, [onTranscriptClear]);
  const handleSuggestionClickInternal = (suggestion: Suggestion, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onSuggestionClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    onSuggestionClick(suggestion.content, suggestion.emoji, {
      x,
      y
    });
  };
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [detectedLang, setDetectedLang] = useState<DetectedLanguage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const languageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    setIsUserTyping,
    setIsAttentive,
    updateActivity,
    triggerAttentionBlink,
    bumpActivity
  } = useAYNEmotion();
  const soundContext = useSoundStore();
  const playSound = soundContext?.playSound;
  const playModeChange = soundContext?.playModeChange;

  // Voice-to-text integration
  const {
    isSupported: voiceSupported,
    isListening: isVoiceListening,
    transcript: voiceTranscript,
    interimTranscript: voiceInterim,
    error: voiceError,
    startListening: startVoice,
    stopListening: stopVoice,
    resetTranscript: resetVoice
  } = useSpeechRecognition();

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

  // Voice transcript integration - append transcript to input as it comes in
  useEffect(() => {
    if (voiceTranscript || voiceInterim) {
      const displayText = voiceTranscript + (voiceInterim ? voiceInterim : '');
      setInputMessage(displayText);
      setShowPlaceholder(!displayText);

      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.max(44, Math.min(textareaRef.current.scrollHeight, 200)) + 'px';
      }
    }
  }, [voiceTranscript, voiceInterim]);

  // Trigger AYN eye attention when voice listening starts
  useEffect(() => {
    if (isVoiceListening) {
      triggerAttentionBlink();
      setIsAttentive(true);
    }
  }, [isVoiceListening, triggerAttentionBlink, setIsAttentive]);

  // Handle voice toggle
  const handleVoiceToggle = useCallback(() => {
    if (isVoiceListening) {
      stopVoice();
    } else {
      startVoice();
    }
  }, [isVoiceListening, startVoice, stopVoice]);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder(prev => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Track typing state to only trigger context updates on start/stop
  const wasTypingRef = useRef(false);

  // Optimized typing detection - only update context on START/STOP transitions
  useEffect(() => {
    const hasContent = inputMessage.trim().length > 0;

    // Only notify when STARTING to type (first character)
    if (hasContent && !wasTypingRef.current) {
      setIsUserTyping(true);
      setIsAttentive(true);
      updateActivity();
      wasTypingRef.current = true;
    }

    // Handle empty input - stopped typing
    if (!hasContent && wasTypingRef.current) {
      setIsUserTyping(false);
      setDetectedLang(null);
      onTypingContentChange?.('');
      wasTypingRef.current = false;
    }

    // Stop typing timeout (debounced)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
      wasTypingRef.current = false;
    }, 1000);

    // Detect language after a brief pause (keep 200ms debounce)
    if (hasContent) {
      if (languageTimeoutRef.current) clearTimeout(languageTimeoutRef.current);
      languageTimeoutRef.current = setTimeout(() => {
        if (inputMessage.trim().length > 2) {
          const langResult = detectLanguage(inputMessage);
          setDetectedLang(langResult);
          onLanguageChange?.(langResult);
        }
      }, 200);
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (languageTimeoutRef.current) clearTimeout(languageTimeoutRef.current);
    };
  }, [inputMessage, setIsUserTyping, setIsAttentive, updateActivity, onLanguageChange, onTypingContentChange]);
  const handleSend = useCallback(() => {
    if (!inputMessage.trim() && !selectedFile) return;
    if (isDisabled || isUploading) return;
    // Sound removed - consolidated to absorption in CenterStageLayout
    bumpActivity(); // Increase activity level on message send
    onSend(inputMessage.trim(), selectedFile);
    setInputMessage('');
    setShowPlaceholder(true);
    setDetectedLang(null);

    // NOTE: File removal is handled by CenterStageLayout after animation
    // Do NOT call onRemoveFile here to avoid race condition

    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    setTimeout(() => {
      triggerAttentionBlink();
    }, 100);
  }, [inputMessage, selectedFile, isDisabled, isUploading, onSend, triggerAttentionBlink, playSound, bumpActivity]);
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
  return <div className={cn("relative w-full transition-all duration-300 px-0 pb-3")} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>

      {/* Main container */}
      <div className={cn("relative bg-background/95 backdrop-blur-xl border border-border rounded-t-2xl shadow-lg overflow-hidden transition-all duration-300", isDragOver && "border-primary shadow-xl", isInputFocused && "border-border/80 shadow-xl")}>
        
        {/* Chat History Section - inside the card at the top */}
        <AnimatePresence>
        {transcriptOpen && sortedTranscriptMessages.length > 0 && <motion.div initial={{
          opacity: 0,
          maxHeight: 0
        }} animate={{
          opacity: 1,
          maxHeight: 500
        }} exit={{
          opacity: 0,
          maxHeight: 0
        }} transition={{
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1]
        }} className="overflow-hidden">
              {/* History Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-foreground/10">
                    <Brain className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span className="font-medium text-sm">AYN AI </span>
                </div>
                <div className="flex items-center gap-1">
                  {onTranscriptClear && <Button variant="ghost" size="sm" onClick={handleClearClick} className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground">
                      Clear
                    </Button>}
                  <Button variant="ghost" size="icon" onClick={onTranscriptToggle} className="h-7 w-7">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="relative pb-3">
                <div className="max-h-[340px] overflow-y-auto" ref={historyScrollRef} onScroll={handleHistoryScroll}>
                  <div className="p-3 space-y-1 flex flex-col justify-end min-h-full">
                    {sortedTranscriptMessages.map(msg => <TranscriptMessage key={msg.id} content={msg.content} sender={msg.sender} timestamp={msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)} status={msg.status} onReply={text => {
                  setInputMessage(`> ${text.split('\n')[0]}\n`);
                  textareaRef.current?.focus();
                }} />)}
                  </div>
                </div>

                {/* Scroll to bottom button */}
                <AnimatePresence>
                  {showScrollDown && <motion.button initial={{
                opacity: 0,
                scale: 0.8
              }} animate={{
                opacity: 1,
                scale: 1
              }} exit={{
                opacity: 0,
                scale: 0.8
              }} onClick={scrollHistoryToBottom} className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 h-8 w-8 rounded-full bg-foreground/90 text-background flex items-center justify-center shadow-lg hover:bg-foreground transition-colors" aria-label="Scroll to bottom">
                      <ChevronDown className="h-4 w-4" />
                    </motion.button>}
                </AnimatePresence>
              </div>
            </motion.div>}
        </AnimatePresence>
        
        {/* Drag overlay - INSIDE the card container for proper sizing */}
        <AnimatePresence>
          {isDragOver && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center z-30 pointer-events-none">
              <p className="text-primary font-medium">Drop file here</p>
            </motion.div>}
        </AnimatePresence>

        {/* Limit reached overlay */}
        <AnimatePresence>
          {hasReachedLimit && !maintenanceActive && !creditsExhausted && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 rounded-2xl">
            <p className="text-sm text-muted-foreground">
              you exceeded your limit open new chat
            </p>
              {onStartNewChat && <Button onClick={onStartNewChat} size="sm" className="gap-2">
                  <MessageSquarePlus className="w-4 h-4" />
                  New Chat
                </Button>}
            </motion.div>}
        </AnimatePresence>

        {/* Credits exhausted overlay */}
        <AnimatePresence>
          {creditsExhausted && !maintenanceActive && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 rounded-2xl px-4">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Credits Exhausted</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                You've used all your credits for this period.
              </p>
              <Button onClick={() => window.location.href = '/pricing'} size="sm" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                <Sparkles className="w-4 h-4" />
                Upgrade Plan
              </Button>
            </motion.div>}
        </AnimatePresence>
        {/* Row 1: Input area with flexbox layout */}
        <div className="flex items-end gap-3 px-4 pt-3 pb-2">
          <div className="relative flex-1 min-w-0">
            <Textarea ref={textareaRef} value={inputMessage} onChange={handleTextareaChange} onKeyDown={handleKeyPress} onFocus={() => setIsInputFocused(true)} onBlur={() => setIsInputFocused(false)} disabled={isDisabled || isUploading} className={cn("w-full resize-none min-h-[44px] max-h-[200px]", "text-base bg-transparent", "border-0 focus-visible:ring-0 focus-visible:ring-offset-0", "text-foreground placeholder:text-muted-foreground", "disabled:opacity-50 disabled:cursor-not-allowed", "leading-relaxed", "overflow-y-auto", "px-2 py-2")} />

            {/* Typewriter placeholder */}
            {showPlaceholder && !inputMessage && !isInputFocused && <div className="absolute top-[10px] left-[10px] pointer-events-none">
                <motion.span key={currentPlaceholder} initial={{
              opacity: 0,
              y: 5
            }} animate={{
              opacity: 0.5,
              y: 0
            }} exit={{
              opacity: 0,
              y: -5
            }} transition={{
              duration: 0.3
            }} className="text-muted-foreground text-base md:text-lg">
                  {placeholders[currentPlaceholder]}
                </motion.span>
              </div>}
          </div>

          {/* Send button - flexbox aligned to bottom */}
          <AnimatePresence>
            {(inputMessage.trim() || selectedFile) && !isDisabled && <motion.button initial={{
            scale: 0,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} exit={{
            scale: 0,
            opacity: 0
          }} transition={{
            duration: 0.15,
            ease: "easeOut"
          }} onClick={handleSend} disabled={isDisabled || isUploading} className={cn("shrink-0 mb-1", "w-10 h-10 rounded-xl", "flex items-center justify-center", "transition-all duration-200", "shadow-lg hover:shadow-xl", "disabled:cursor-not-allowed disabled:hover:scale-100", isUploading ? "bg-muted cursor-wait opacity-70" : cn("hover:scale-105 active:scale-95", getSendButtonClass(selectedMode)))}>
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <ArrowUp className="w-5 h-5" strokeWidth={2.5} />}
              </motion.button>}
          </AnimatePresence>
        </div>

        {/* Premium File Chip with Upload Progress */}
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
        }} className="px-4 pb-3 overflow-hidden">
              <motion.div initial={{
            scale: 0.95,
            opacity: 0,
            y: 5
          }} animate={{
            scale: 1,
            opacity: 1,
            y: 0
          }} exit={{
            scale: 0.95,
            opacity: 0,
            y: -5
          }} transition={{
            duration: 0.2,
            ease: "easeOut"
          }} className={cn("relative inline-flex items-center gap-2.5", "px-3.5 py-2.5 rounded-2xl", "bg-neutral-900 dark:bg-neutral-950", "border border-neutral-700/50", "shadow-lg shadow-black/20", "max-w-[320px]", "overflow-hidden")}>
                {/* Progress bar background */}
                {isUploading && <motion.div initial={{
              width: '0%'
            }} animate={{
              width: `${uploadProgress}%`
            }} className="absolute inset-0 bg-primary/20 rounded-2xl" transition={{
              duration: 0.3,
              ease: "easeOut"
            }} />}
                
                {/* Failed upload indicator */}
                {uploadFailed && !isUploading && <div className="absolute inset-0 bg-red-500/10 rounded-2xl" />}
                
                {/* File Icon based on file type or status */}
                <div className={cn("relative shrink-0", isUploading && "animate-pulse")}>
                  {isUploading ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : uploadFailed ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <FileTypeIcon filename={selectedFile.name} className="w-4 h-4" />}
                </div>
                
                {/* Filename - truncated */}
                <span className={cn("text-sm truncate max-w-[100px] font-medium relative z-10", uploadFailed ? "text-red-300" : "text-neutral-200")}>
                  {selectedFile.name}
                </span>
                
                {/* File size, Upload progress, or Failed status */}
                <span className={cn("text-xs shrink-0 relative z-10 min-w-[48px] text-right", uploadFailed ? "text-red-400" : "text-neutral-500")}>
                  {isUploading ? `${uploadProgress}%` : uploadFailed ? 'Failed' : formatFileSize(selectedFile.size)}
                </span>
                
                {/* Retry button - shown when upload failed */}
                {uploadFailed && !isUploading && onRetryUpload && <button onClick={e => {
              e.stopPropagation();
              onRetryUpload();
            }} className="p-1 rounded-full bg-amber-500/20 hover:bg-amber-500/40 transition-colors shrink-0 relative z-10" title="Retry upload">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 hover:text-amber-300 transition-colors" />
                  </button>}
                
                {/* Remove button - hidden while uploading */}
                {!isUploading && <button onClick={handleRemoveFile} className="p-1 rounded-full hover:bg-neutral-700/60 transition-colors shrink-0 relative z-10">
                    <X className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-200 transition-colors" />
                  </button>}
              </motion.div>
            </motion.div>}
        </AnimatePresence>

        {/* Row 2: Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-muted/20">
          {/* Left: Action buttons */}
          <div className="flex items-center gap-2">
            <button onClick={handleFileClick} disabled={isDisabled || isUploading} className={cn("p-2 rounded-lg", "hover:bg-muted/60", "transition-all duration-200", "disabled:opacity-50 disabled:cursor-not-allowed")}>
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>
            
            {/* Voice Input Button - only show if supported */}
            {voiceSupported && <button onClick={handleVoiceToggle} disabled={isDisabled || isUploading} className={cn("relative p-2 rounded-lg", "transition-all duration-200", "disabled:opacity-50 disabled:cursor-not-allowed", isVoiceListening ? "bg-red-500/20 hover:bg-red-500/30" : "hover:bg-muted/60")} title={isVoiceListening ? "Stop voice input" : "Start voice input"}>
                {isVoiceListening ? <>
                    {/* Pulsing animation when listening */}
                    <motion.div className="absolute inset-0 rounded-lg bg-red-500/30" animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5]
              }} transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }} />
                    <Mic className="w-4 h-4 text-red-500 relative z-10" />
                    {/* Recording indicator dot */}
                    <motion.span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full z-10" animate={{
                opacity: [1, 0.5, 1]
              }} transition={{
                duration: 0.8,
                repeat: Infinity
              }} />
                  </> : <Mic className="w-4 h-4 text-muted-foreground" />}
              </button>}
            
            {/* Sound Toggle Indicator */}
            <button onClick={() => soundContext?.toggleEnabled()} className={cn("p-2 rounded-lg", "hover:bg-muted/60", "transition-all duration-200")} title={soundContext?.enabled ? "Sound on - click to mute" : "Sound off - click to enable"}>
              {soundContext?.enabled ? <Volume2 className="w-4 h-4 text-muted-foreground" /> : <VolumeX className="w-4 h-4 text-muted-foreground/50" />}
            </button>
          </div>

          {/* History Toggle Button */}
          {transcriptMessages.length > 0 && onTranscriptToggle && <button onClick={onTranscriptToggle} className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full", "border border-border bg-card/80 backdrop-blur-sm", "text-sm text-muted-foreground shadow-sm", "hover:bg-muted/50 hover:text-foreground hover:shadow-md", "active:scale-95 transition-all cursor-pointer", transcriptOpen && "bg-muted/60")}>
              <Clock className="h-4 w-4" />
              <span>History</span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{transcriptMessages.length}</span>
            </button>}

          {/* Message counter */}
          {messageCount > 0 && <div className={cn("text-xs px-2 py-1 rounded-md", hasReachedLimit ? "bg-destructive/10 text-destructive" : messageCount >= maxMessages * 0.8 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
              {messageCount}/{maxMessages}
            </div>}

          {/* AYN Mode Label - no dropdown */}
          <div className="h-9 px-3 rounded-xl flex items-center gap-2 text-muted-foreground">
            <Brain className="w-5 h-5 text-foreground" />
            <span className="text-sm font-medium">AYN</span>
          </div>
        </div>
      </div>

      {/* AI Disclaimer */}
      <p className="text-xs text-muted-foreground/60 text-center mt-2">
        AYN is AI and can make mistakes. Always verify critical details.
      </p>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.xlsx,.xls,.csv,.txt,.json,.xml,.html,.htm,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg" onChange={handleFileInputChange} />

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all messages and start a new chat. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
});
ChatInput.displayName = 'ChatInput';
export default ChatInput;