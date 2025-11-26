import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X } from 'lucide-react';
import { TypewriterText } from '@/components/TypewriterText';
import { useLanguage } from '@/contexts/LanguageContext';
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
  sidebarOpen = true
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

      {/* Input Container */}
      <div className="input-container relative">
        {/* Attachment Button */}
        {supportsFileAttachment && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || isUploading}
            className="attachment-button flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          accept="image/*,.pdf,.doc,.docx,.txt,.json"
        />

        {/* Textarea with Placeholder */}
        <div className="relative flex-1">
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
            className="message-input resize-none min-h-[44px] max-h-[200px]"
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
          className={cn("send-button", getSendButtonClass(selectedMode))}
          onClick={handleSend}
          disabled={(!inputMessage.trim() && !selectedFile) || isDisabled || isUploading}
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
