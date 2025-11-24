import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Reply } from 'lucide-react';
import { TypewriterText } from '@/components/TypewriterText';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  isTyping?: boolean;
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  isUploading: boolean;
  selectedFile: File | null;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  selectedMode: string;
  isDragOver: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  replyingTo: Message | null;
  onClearReply: () => void;
  placeholderTexts: string[];
  placeholderIndex: number;
  showPlaceholder: boolean;
  isInputFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  language: string;
  direction: 'ltr' | 'rtl';
  messagesLength: number;
  isTyping: boolean;
  showFileTypes: boolean;
  onShowFileTypes: (show: boolean) => void;
  onAttachmentClick: () => void;
  getSendButtonClass: (mode: string) => string;
}

export const ChatInput = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled,
  isUploading,
  selectedFile,
  onFileSelect,
  onFileRemove,
  selectedMode,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  replyingTo,
  onClearReply,
  placeholderTexts,
  placeholderIndex,
  showPlaceholder,
  isInputFocused,
  onFocus,
  onBlur,
  fileInputRef,
  inputRef,
  language,
  direction,
  messagesLength,
  isTyping,
  showFileTypes,
  onShowFileTypes,
  onAttachmentClick,
  getSendButtonClass
}: ChatInputProps) => {
  return (
    <div 
      dir="ltr"
      className={`input-area ${messagesLength > 0 ? 'bottom-position' : 'center-position'}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Reply indicator */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Reply className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Replying to: "{replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}"
            </span>
          </div>
          <button
            onClick={onClearReply}
            className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Note: Full-screen drag overlay now handled by MessageList component */}
      
      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mb-2 p-3 bg-muted rounded-xl border flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Paperclip className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={onFileRemove}
            className="w-6 h-6 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className={`input-container ${isDragOver ? 'drag-over' : ''}`}>
        {/* Enhanced Attachment Button with Drag & Drop Hints */}
        {(selectedMode.toLowerCase().includes('pdf') || selectedMode.toLowerCase().includes('vision') || selectedMode.toLowerCase().includes('general') || selectedMode.toLowerCase().includes('civil engineering')) ? (
          <div className="relative">
            <button 
              className={`attachment-button group relative ${messagesLength === 0 && !disabled ? 'animate-pulse' : ''}`}
              onClick={onAttachmentClick}
              onMouseEnter={() => onShowFileTypes(true)}
              onMouseLeave={() => onShowFileTypes(false)}
              disabled={disabled || isUploading}
              title="Attach file or drag & drop anywhere"
            >
              <Paperclip className="w-4 h-4" />
              
              {/* Visual Hint Badge for Empty Chat */}
              {messagesLength === 0 && !disabled && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              )}
            </button>
            
            {/* Enhanced File Types Tooltip with Drag Hint */}
            {showFileTypes && !isDragOver && (
              <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-lg shadow-xl p-4 min-w-[260px] z-50 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Paperclip className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-sm font-semibold text-foreground">Click or drag & drop</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-muted-foreground">Images:</span>
                    <span className="text-foreground font-medium">JPG, PNG, GIF, WebP</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-muted-foreground">Documents:</span>
                    <span className="text-foreground font-medium">PDF, DOC, DOCX</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-muted-foreground">Text:</span>
                    <span className="text-foreground font-medium">TXT files</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-muted-foreground">Data:</span>
                    <span className="text-foreground font-medium">JSON files</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-primary bg-primary/5 rounded-md py-2 px-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Drag files anywhere in chat
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Max size: <strong>10MB</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.json"
          onChange={onFileSelect}
          className="hidden"
        />
        
        {/* Input Field */}
        <div className="flex-1 relative">
          <Textarea
            ref={inputRef}
            unstyled={true}
            className="message-input resize-none min-h-[40px] max-h-[200px] overflow-hidden"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              // Auto-resize textarea
              const textarea = e.target as HTMLTextAreaElement;
              textarea.style.height = 'auto';
              const newHeight = Math.min(textarea.scrollHeight, 200);
              textarea.style.height = newHeight + 'px';
              
              // Show scrollbar only when content exceeds max height
              if (textarea.scrollHeight > 200) {
                textarea.style.overflowY = 'auto';
              } else {
                textarea.style.overflowY = 'hidden';
              }
            }}
            onKeyPress={onKeyPress}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder=""
            disabled={disabled || isUploading}
            rows={1}
          />
          
          {/* Typewriter Animation Placeholder */}
          {showPlaceholder && !value.trim() && !isInputFocused && (
            <div className={`absolute ${direction === 'rtl' ? 'right-[var(--input-left-offset)]' : 'left-[var(--input-left-offset)]'} top-[var(--input-vertical-offset)] pointer-events-none z-10 ${direction === 'rtl' ? 'text-right' : 'text-left'} transition-all duration-300 ease-in-out`}>
              <TypewriterText
                key={`${selectedMode}-${placeholderIndex}-${language}-${direction}`}
                text={placeholderTexts[placeholderIndex]}
                speed={50}
                className="typewriter-text text-muted-foreground"
                showCursor={true}
              />
            </div>
          )}
          
          {/* File Selected Indicator */}
          {selectedFile && (
            <div className="absolute -top-12 left-0 bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm flex items-center gap-2">
              <Paperclip className="w-3 h-3" />
              <span>{selectedFile.name}</span>
              <button 
                onClick={() => {
                  onFileRemove();
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-primary-foreground hover:text-primary-foreground/80"
              >
                ×
              </button>
            </div>
          )}
        </div>
        
        {/* Send Button */}
        <button
          className={`send-button ${getSendButtonClass(selectedMode)}`}
          onClick={onSend}
          disabled={(!value.trim() && !selectedFile) || disabled || isTyping || isUploading}
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      
      {/* Character Count */}
      {value.length > 0 && (
        <div className="text-xs text-muted-foreground text-right mt-1 px-2">
          {value.length} characters
        </div>
      )}
    </div>
  );
};
