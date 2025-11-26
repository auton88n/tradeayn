import React from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import type { Message, FileAttachment, AIMode, AIModeConfig } from '@/types/dashboard.types';

interface ChatAreaProps {
  // Message display
  messages: Message[];
  isTyping: boolean;
  userName?: string;
  userAvatar?: string;
  onCopyMessage: (content: string) => void;
  onReplyToMessage: (message: Message) => void;
  
  // Message sending
  onSendMessage: (content: string, fileToUpload?: File | null) => Promise<void>;
  isDisabled: boolean;
  selectedMode: AIMode;
  
  // File handling
  selectedFile: File | null;
  isUploading: boolean;
  isDragOver: boolean;
  onFileSelect: (file: File | null) => void;
  onRemoveFile: () => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  
  // Sidebar state
  sidebarOpen?: boolean;
  
  // Mode management
  modes: AIModeConfig[];
  onModeChange: (mode: AIMode) => void;
}

export const ChatArea = ({
  messages,
  isTyping,
  userName,
  userAvatar,
  onCopyMessage,
  onReplyToMessage,
  onSendMessage,
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
  sidebarOpen = true,
  modes,
  onModeChange
}: ChatAreaProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <MessageList
        messages={messages}
        isTyping={isTyping}
        userName={userName}
        userAvatar={userAvatar}
        onCopy={onCopyMessage}
        onReply={onReplyToMessage}
      />

      {/* Input Area */}
      <ChatInput
        onSend={onSendMessage}
        isDisabled={isDisabled}
        selectedMode={selectedMode}
        selectedFile={selectedFile}
        isUploading={isUploading}
        isDragOver={isDragOver}
        onFileSelect={onFileSelect}
        onRemoveFile={onRemoveFile}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fileInputRef={fileInputRef}
        hasMessages={messages.length > 0}
        sidebarOpen={sidebarOpen}
        modes={modes}
        onModeChange={onModeChange}
      />
    </div>
  );
};
