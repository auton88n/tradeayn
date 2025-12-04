import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Paperclip, X, Plus, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TypewriterText } from '@/components/TypewriterText';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatInputProps } from '@/types/dashboard.types';

// Helper function to get send button class based on mode
const getSendButtonClass = (mode: string) => {
  const modeName = mode.toLowerCase();
  if (modeName.includes('nen')) return 'mode-blue';
  if (modeName.includes('research')) return 'mode-green';
  if (modeName.includes('pdf')) return 'mode-purple';
  if (modeName.includes('vision')) return 'mode-orange';
  if (modeName.includes('civil')) return 'mode-teal';
  return 'mode-default';
};

export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(({
  onSend,
  isDisabled,
  selectedMode,
  selectedFile,
  isUploading,
  isDragOver,
  onFileSelect,
  onRemoveFile,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  fileInputRef,
  hasMessages,
  sidebarOpen = true,
  transcriptOpen = false,
  modes,
  onModeChange,
  prefillValue,
  onPrefillConsumed
}, ref) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle prefill value changes
  useEffect(() => {
    if (prefillValue) {
      setInputMessage(prefillValue);
      setShowPlaceholder(false);
      setHasStartedTyping(true);
      onPrefillConsumed?.();
      setTimeout(() => {
        textareaRef.current?.focus();
        const len = prefillValue.length;
        textareaRef.current?.setSelectionRange(len, len);
      }, 100);
    }
  }, [prefillValue, onPrefillConsumed]);
  
  const {
    setIsUserTyping, 
    setIsAttentive, 
    triggerAttentionBlink,
    updateActivity 
  } = useAYNEmotion();

  // Hardcoded English placeholder texts
  const placeholderTexts = [
    'Ask AYN anything...',
    'How can I increase my revenue?',
    'What are the latest market trends?'
  ];

  // Manage placeholder visibility
  useEffect(() => {
    setShowPlaceholder(!inputMessage.trim());
  }, [inputMessage]);

  // Rotate placeholder texts
  useEffect(() => {
    if (!showPlaceholder || inputMessage.trim()) return;
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholderTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [showPlaceholder, inputMessage, placeholderTexts.length]);

  // Handle send
  const handleSend = async () => {
    if (!inputMessage.trim() && !selectedFile || isDisabled || isUploading) return;
    const content = inputMessage.trim();
    setInputMessage('');
    
    setIsUserTyping(false);
    setIsAttentive(false);
    setHasStartedTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSend(content, selectedFile ? selectedFile : null);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle textarea change with auto-resize and typing detection
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputMessage(newValue);
    updateActivity();

    if (newValue.length > 0 && !hasStartedTyping) {
      setHasStartedTyping(true);
      setIsAttentive(true);
      triggerAttentionBlink();
      setTimeout(() => setIsAttentive(false), 500);
    }

    if (newValue.trim().length > 0) {
      setIsUserTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsUserTyping(false);
      }, 2000);
    } else {
      setIsUserTyping(false);
      setHasStartedTyping(false);
    }

    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + 'px';
    textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
  };
  
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const supportsFileAttachment = true;
  const hasContent = inputMessage.trim() || selectedFile;

  return (
    <div 
      ref={ref} 
      data-tutorial="chat-input" 
      className={cn(
        "input-area bottom-position", 
        sidebarOpen ? "sidebar-open" : "sidebar-closed", 
        transcriptOpen && "transcript-open", 
        isDragOver && "drag-over"
      )} 
      onDragEnter={onDragEnter} 
      onDragLeave={onDragLeave} 
      onDragOver={onDragOver} 
      onDrop={onDrop}
    >
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-3xl border-2 border-primary border-dashed flex flex-col items-center justify-center z-50 pointer-events-none">
          <Paperclip className="w-12 h-12 text-primary mb-2" />
          <p className="text-lg font-semibold">Drop your file here</p>
          <p className="text-sm text-muted-foreground mt-1">
            Images, PDFs, Word docs, text, or JSON files (max 10MB)
          </p>
        </div>
      )}

      {/* Input Container - Two Row Layout */}
      <div className="input-container relative">
        {/* Hidden File Input */}
        <input 
          ref={fileInputRef} 
          type="file" 
          className="hidden" 
          onChange={handleFileInputChange} 
          accept="image/*,.pdf,.doc,.docx,.txt,.json" 
        />

        {/* ROW 1: Input Area with Send Button in Corner */}
        <div className="relative px-5 pt-4 pb-3">
          <Textarea 
            ref={textareaRef} 
            value={inputMessage} 
            onChange={handleTextareaChange} 
            onKeyPress={handleKeyPress} 
            onFocus={() => setIsInputFocused(true)} 
            onBlur={() => setIsInputFocused(false)} 
            placeholder="" 
            disabled={isDisabled || isUploading} 
            rows={1} 
            unstyled={true} 
            className={cn(
              "w-full resize-none min-h-[52px] max-h-[200px] text-base bg-transparent border-0 outline-none focus:ring-0 py-2",
              hasContent ? "pr-14" : "pr-1"
            )} 
          />

          {/* Typewriter Placeholder */}
          {showPlaceholder && !inputMessage.trim() && !isInputFocused && (
            <div className="absolute top-[18px] left-[20px] pointer-events-none z-10 transition-all duration-300">
              <TypewriterText 
                key={placeholderIndex} 
                text={placeholderTexts[placeholderIndex]} 
                speed={50} 
                className="typewriter-text text-muted-foreground" 
                showCursor={true} 
              />
            </div>
          )}

          {/* Selected File Chip */}
          {selectedFile && (
            <div className="mt-2 p-2 bg-muted rounded-lg flex items-center gap-2 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs truncate flex-1">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRemoveFile} 
                className="h-5 w-5 p-0 flex-shrink-0 hover:bg-destructive/20"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Send Button - Only appears when there's content */}
          <AnimatePresence>
            {hasContent && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                className={cn(
                  "send-button-square w-9 h-9 transition-all duration-200 active:scale-95 hover:scale-105 absolute bottom-3 right-4",
                  getSendButtonClass(selectedMode)
                )}
                onClick={handleSend}
                disabled={!hasContent || isDisabled || isUploading}
                title="Send message"
              >
                <ArrowUp className="w-[22px] h-[22px]" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ROW 2: Toolbar with Border Separator */}
        <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-border/50">
          {/* Left: Plus + Settings buttons */}
          <div className="flex items-center gap-1">
            {supportsFileAttachment && (
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isDisabled || isUploading} 
                data-tutorial="attachment"
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-muted/80 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                title="Attach file"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button 
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted/80 transition-all"
              )}
              title="Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Mode Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-3 rounded-lg hover:bg-muted/80 transition-all"
              >
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {modes.find(m => m.name === selectedMode)?.translatedName || 'Mode'}
                </span>
                <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 z-50 bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl"
            >
              {modes.map(mode => (
                <DropdownMenuItem 
                  key={mode.name} 
                  onClick={() => onModeChange(mode.name)} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <mode.icon className="w-4 h-4 mr-2" />
                  <span>{mode.translatedName}</span>
                  {selectedMode === mode.name && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
