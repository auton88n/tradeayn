import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Plus, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TypewriterText } from '@/components/TypewriterText';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { ChatInputProps } from '@/types/dashboard.types';

// Removed getSendButtonClass - now using monochrome design

export const ChatInput = ({
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
  modes,
  onModeChange
}: ChatInputProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t, language, direction } = useLanguage();

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
    return [
      t('dashboard.placeholders.askAyn') || 'Ask AYN anything...',
      t('dashboard.placeholders.increaseRevenue') || 'How can I increase my revenue?',
      t('dashboard.placeholders.marketTrends') || 'What are the latest market trends?'
    ];
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
    if ((!inputMessage.trim() && !selectedFile) || isDisabled || isUploading) return;

    const content = inputMessage.trim();
    setInputMessage('');
    
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

  // Handle textarea change with auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + 'px';
    
    // Show scrollbar only when content exceeds max height
    textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  // Enable file attachments for all modes
  const supportsFileAttachment = true;

  return (
    <div 
      className={cn(
        "input-area",
        hasMessages ? "bottom-position" : "center-position",
        sidebarOpen ? "sidebar-open" : "sidebar-closed",
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

      {/* Monochrome Premium Input Container */}
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Floating shadow (monochrome) */}
        <div className="absolute -bottom-2 left-8 right-8 h-6 bg-black/20 dark:bg-white/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Main input container */}
        <div className="relative group">
          {/* Subtle border glow (monochrome) */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-black/50 via-black/30 to-black/50 dark:from-white/30 dark:via-white/20 dark:to-white/30 rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur-sm transition-opacity duration-300" />
          
          {/* Glass container */}
          <div className="relative backdrop-blur-2xl bg-white/90 dark:bg-black/90 border-2 border-gray-200 dark:border-gray-800 rounded-full shadow-2xl transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] group-hover:border-gray-300 dark:group-hover:border-gray-700 group-focus-within:border-black dark:group-focus-within:border-white">
            <div className="flex items-center gap-3 px-5 py-3.5">
              
              {/* Mode Selector Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 flex-shrink-0 group/mode">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-pulse" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-black/50 dark:bg-white/50 animate-ping" />
                    </div>
                    <span className="text-sm font-bold text-black dark:text-white">
                      {modes.find(m => m.name === selectedMode)?.translatedName || 'Mode'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover/mode:text-black dark:group-hover/mode:text-white transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 z-50 bg-popover">
                  {modes.map((mode) => (
                    <DropdownMenuItem
                      key={mode.name}
                      onClick={() => onModeChange(mode.name)}
                      className="cursor-pointer"
                    >
                      <mode.icon className="w-4 h-4 mr-2" />
                      <span>{mode.translatedName}</span>
                      {selectedMode === mode.name && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Plus Button */}
              {supportsFileAttachment && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isDisabled || isUploading}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 border-2 border-gray-200 dark:border-gray-800 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90 flex-shrink-0 group/plus disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0"
                >
                  <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover/plus:text-black dark:group-hover/plus:text-white transition-colors" />
                </button>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
                accept="image/*,.pdf,.doc,.docx,.txt,.json"
              />

              {/* Input Field */}
              <div className="relative flex-1 min-w-0">
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
                  className="w-full resize-none bg-transparent border-0 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none text-base py-1 px-2 max-h-[120px] font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                />

                {/* Typewriter Placeholder */}
                {showPlaceholder && !inputMessage.trim() && !isInputFocused && (
                  <div 
                    className={cn(
                      "absolute top-[10px] pointer-events-none z-10 transition-all duration-300",
                      direction === 'rtl' ? 'right-[4px]' : 'left-[4px]'
                    )}
                  >
                    <TypewriterText
                      key={`${placeholderIndex}-${language}-${direction}`}
                      text={placeholderTexts[placeholderIndex]}
                      speed={50}
                      className="typewriter-text text-muted-foreground"
                      showCursor={true}
                    />
                  </div>
                )}

                {/* Selected File Chip (BELOW textarea) */}
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
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={(!inputMessage.trim() && !selectedFile) || isDisabled || isUploading}
                className="relative w-11 h-11 rounded-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-700 flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:scale-100 shadow-xl shadow-black/20 dark:shadow-white/10 disabled:shadow-none flex-shrink-0 overflow-hidden group/send disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 text-white dark:text-black relative z-10 transition-transform group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5" />
                
                {/* Shine effect (white light) */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/send:translate-x-full transition-transform duration-700 ease-in-out" />
                
                {/* Pulse effect when enabled (monochrome) */}
                {inputMessage.trim() && (
                  <div className="absolute inset-0 rounded-full bg-black dark:bg-white animate-ping opacity-20" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
