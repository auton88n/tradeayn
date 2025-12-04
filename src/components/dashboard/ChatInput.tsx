import React, { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Paperclip, X, Plus, ChevronDown, SlidersHorizontal, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TypewriterText } from '@/components/TypewriterText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { cn } from '@/lib/utils';
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
  const {
    t,
    language,
    direction
  } = useLanguage();
  
  // Handle prefill value changes
  useEffect(() => {
    if (prefillValue) {
      setInputMessage(prefillValue);
      setShowPlaceholder(false);
      setHasStartedTyping(true);
      onPrefillConsumed?.();
      // Focus the textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        // Move cursor to end
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

  // Get mode-specific placeholder texts
  const getPlaceholderTexts = () => {
    try {
      const placeholders = t(`placeholders.${selectedMode}`);
      if (Array.isArray(placeholders)) {
        return placeholders;
      }
      if (typeof placeholders === 'string') {
        return JSON.parse(placeholders);
      }
    } catch (error) {
      console.error('Error getting placeholders:', error);
    }

    // Fallback
    return [t('dashboard.placeholders.askAyn') || 'Ask AYN anything...', t('dashboard.placeholders.increaseRevenue') || 'How can I increase my revenue?', t('dashboard.placeholders.marketTrends') || 'What are the latest market trends?'];
  };
  const placeholderTexts = getPlaceholderTexts();

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
    
    // Clear typing state
    setIsUserTyping(false);
    setIsAttentive(false);
    setHasStartedTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Pass the selected file to parent for upload
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

    // Detect first keystroke - trigger attention blink
    if (newValue.length > 0 && !hasStartedTyping) {
      setHasStartedTyping(true);
      setIsAttentive(true);
      triggerAttentionBlink();
      
      // Reset attentive state after a moment
      setTimeout(() => setIsAttentive(false), 500);
    }

    // Set user typing state
    if (newValue.trim().length > 0) {
      setIsUserTyping(true);
      
      // Clear typing state after user stops typing for 2 seconds
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

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + 'px';

    // Show scrollbar only when content exceeds max height
    textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  // Enable file attachments for all modes
  const supportsFileAttachment = true;
  return <div ref={ref} data-tutorial="chat-input" className={cn("input-area bottom-position", sidebarOpen ? "sidebar-open" : "sidebar-closed", transcriptOpen && "transcript-open", isDragOver && "drag-over")} style={{ direction: 'ltr' }} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
      {/* Drag Overlay */}
      {isDragOver && <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-3xl border-2 border-primary border-dashed flex flex-col items-center justify-center z-50 pointer-events-none">
          <Paperclip className="w-12 h-12 text-primary mb-2" />
          <p className="text-lg font-semibold">Drop your file here</p>
          <p className="text-sm text-muted-foreground mt-1">
            Images, PDFs, Word docs, text, or JSON files (max 10MB)
          </p>
        </div>}

      {/* Input Container - Two Row Layout */}
      <div className="input-container relative">
        {/* Hidden File Input */}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} accept="image/*,.pdf,.doc,.docx,.txt,.json" />

        {/* Row 1: Full-width Textarea */}
        <div className="w-full relative">
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
            className="w-full resize-none min-h-[44px] max-h-[200px] text-base bg-transparent border-0 outline-none focus:ring-0 px-1 py-2" 
          />

          {/* Typewriter Placeholder */}
          {showPlaceholder && !inputMessage.trim() && !isInputFocused && <div className="absolute top-[8px] left-[4px] pointer-events-none z-10 transition-all duration-300">
              <TypewriterText key={`${placeholderIndex}-${language}`} text={placeholderTexts[placeholderIndex]} speed={50} className="typewriter-text text-muted-foreground" showCursor={true} forceDirection="ltr" />
            </div>}

          {/* Selected File Chip (BELOW textarea) */}
          {selectedFile && <div className="mt-2 p-2 bg-muted rounded-lg flex items-center gap-2 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs truncate flex-1">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <Button variant="ghost" size="sm" onClick={onRemoveFile} className="h-5 w-5 p-0 flex-shrink-0 hover:bg-destructive/20">
                <X className="w-3 h-3" />
              </Button>
            </div>}
        </div>

 {/* Row 2: Toolbar - ABSOLUTE POSITIONING TO LOCK BUTTON POSITIONS */}
        <div className="relative w-full pt-2 mt-auto" style={{ height: '44px', direction: 'ltr' }}>
          {/* Plus Button - ABSOLUTE LEFT */}
          {supportsFileAttachment && (
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isDisabled || isUploading} 
              data-tutorial="attachment"
              className="toolbar-button w-8 h-8 md:w-9 md:h-9 absolute top-2 left-0" 
              title="Attach file"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {/* Mode Selector - ABSOLUTE CENTER-RIGHT */}
          <div className="absolute top-2" style={{ right: '52px' }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="mode-selector-button h-7 md:h-8 px-2 md:px-3 rounded-lg hover:bg-muted/80 transition-all">
                  <span className="text-xs md:text-sm font-medium truncate max-w-[80px] md:max-w-[120px]">
                    {modes.find(m => m.name === selectedMode)?.translatedName || 'Mode'}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 z-50 bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl
                  data-[state=open]:animate-in data-[state=closed]:animate-out 
                  data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                  data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                  data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
              >
                <div>
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
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Send Button - ABSOLUTE RIGHT */}
          <button 
            className={cn(
              "send-button-square w-8 h-8 md:w-9 md:h-9 transition-all duration-200 active:scale-95 hover:scale-105 absolute top-2 right-0", 
              getSendButtonClass(selectedMode)
            )}
            onClick={handleSend} 
            disabled={!inputMessage.trim() && !selectedFile || isDisabled || isUploading} 
            title="Send message"
          >
            <ArrowUp className="w-5 h-5 md:w-[22px] md:h-[22px]" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>;
});

ChatInput.displayName = 'ChatInput';