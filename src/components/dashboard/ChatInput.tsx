import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Reply, FileText, Image, Eye, Plus } from 'lucide-react';
import { TypewriterText } from '@/components/TypewriterText';
import { FilePreviewModal } from './FilePreviewModal';
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
const getFileIcon = (file: File) => {
  if (file.type.includes('pdf')) return <FileText className="w-3 h-3 text-primary" />;
  if (file.type.includes('image')) return <Image className="w-3 h-3 text-primary" />;
  if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) return <FileText className="w-3 h-3 text-primary" />;
  return <Paperclip className="w-3 h-3 text-primary" />;
};

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
  // Create preview URL for all file types
  const [filePreviewUrl, setFilePreviewUrl] = React.useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  
  React.useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(url);
      
      // Cleanup: revoke object URL when file changes or component unmounts
      return () => {
        // Only revoke if modal is closed to prevent download issues
        if (!isPreviewOpen) {
          URL.revokeObjectURL(url);
        }
        setFilePreviewUrl(null);
      };
    } else {
      setFilePreviewUrl(null);
    }
  }, [selectedFile, isPreviewOpen]);
  
  const isImageFile = selectedFile?.type.startsWith('image/');
  
  const handleFileChipClick = () => {
    if (selectedFile) {
      setIsPreviewOpen(true);
    }
  };
  
  return <div dir="ltr" className={`input-area ${messagesLength > 0 ? 'bottom-position' : 'center-position'}`} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
      {/* Reply indicator */}
      {replyingTo && <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Reply className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Replying to: "{replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}"
            </span>
          </div>
          <button onClick={onClearReply} className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>}
      
      {/* Note: Full-screen drag overlay now handled by MessageList component */}
      
      {/* Hidden File Input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.json" onChange={onFileSelect} className="hidden" />

      {/* File Preview Card - Above Input (Claude Style) */}
      {selectedFile && (
        <div className="file-preview-card">
          <div className="file-preview-content" onClick={handleFileChipClick}>
            {isImageFile && filePreviewUrl ? (
              <img src={filePreviewUrl} alt={selectedFile.name} className="file-preview-thumbnail" />
            ) : (
              <div className="file-preview-icon">
                {getFileIcon(selectedFile)}
              </div>
            )}
            <div className="file-preview-info">
              <span className="file-preview-name">{selectedFile.name}</span>
              <span className="file-preview-size">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <button onClick={onFileRemove} className="file-preview-remove" title={language === 'ar' ? 'إزالة الملف' : 'Remove file'}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={selectedFile}
        previewUrl={filePreviewUrl}
      />

      {/* Input Bar Container - Plus Button + Input */}
      <div className="input-bar-container">
        {/* Plus Button - Claude Style */}
        {(selectedMode.toLowerCase().includes('pdf') || selectedMode.toLowerCase().includes('vision') || selectedMode.toLowerCase().includes('general') || selectedMode.toLowerCase().includes('civil engineering')) && (
          <button 
            className="plus-button" 
            onClick={onAttachmentClick}
            disabled={disabled || isUploading}
            title="Attach files"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        <div className={`input-container ${isDragOver ? 'drag-over' : ''}`}>
          {/* Input Wrapper */}
          <div className="input-wrapper">
            {/* Text Input Area */}
            <Textarea ref={inputRef} unstyled={true} className="message-input resize-none min-h-[40px] max-h-[200px] overflow-hidden" value={value} onChange={e => {
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
            }} onKeyPress={onKeyPress} onFocus={onFocus} onBlur={onBlur} placeholder="" disabled={disabled || isUploading} rows={1} />
            
            {/* Typewriter Animation Placeholder */}
            {showPlaceholder && !value.trim() && !isInputFocused && !selectedFile && <div className={`absolute ${direction === 'rtl' ? 'right-[var(--input-left-offset)]' : 'left-[var(--input-left-offset)]'} top-[var(--input-vertical-offset)] pointer-events-none z-10 ${direction === 'rtl' ? 'text-right' : 'text-left'} transition-all duration-300 ease-in-out`}>
                <TypewriterText key={`${selectedMode}-${placeholderIndex}-${language}-${direction}`} text={placeholderTexts[placeholderIndex]} speed={50} className="typewriter-text text-muted-foreground" showCursor={true} />
              </div>}
          </div>
          
          {/* Send Button */}
          <button className={`send-button ${getSendButtonClass(selectedMode)}`} onClick={onSend} disabled={!value.trim() && !selectedFile || disabled || isTyping || isUploading} title="Send message">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Character Count */}
      {value.length > 0 && <div className="text-xs text-muted-foreground text-right mt-1 px-2">
          {value.length} characters
        </div>}
    </div>;
};