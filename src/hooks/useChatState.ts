import { useState } from 'react';

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

interface UseChatStateReturn {
  // Message state
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  
  // Input state
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  
  // Loading states
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Mode state
  selectedMode: string;
  setSelectedMode: React.Dispatch<React.SetStateAction<string>>;
  
  // File state
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  isDragOver: boolean;
  setIsDragOver: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Reply state
  replyingTo: Message | null;
  setReplyingTo: React.Dispatch<React.SetStateAction<Message | null>>;
  
  // Placeholder state
  placeholderIndex: number;
  setPlaceholderIndex: React.Dispatch<React.SetStateAction<number>>;
  showPlaceholder: boolean;
  setShowPlaceholder: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Input focus
  isInputFocused: boolean;
  setIsInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Session state
  currentSessionId: string;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string>>;
  
  // File types dropdown
  showFileTypes: boolean;
  setShowFileTypes: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useChatState = (): UseChatStateReturn => {
  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Loading states
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Mode state
  const [selectedMode, setSelectedMode] = useState<string>('Nen Mode ⚡');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFileTypes, setShowFileTypes] = useState(false);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Placeholder state
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  
  // Input focus
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Session state
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => crypto.randomUUID());

  return {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isTyping,
    setIsTyping,
    isUploading,
    setIsUploading,
    selectedMode,
    setSelectedMode,
    selectedFile,
    setSelectedFile,
    isDragOver,
    setIsDragOver,
    replyingTo,
    setReplyingTo,
    placeholderIndex,
    setPlaceholderIndex,
    showPlaceholder,
    setShowPlaceholder,
    isInputFocused,
    setIsInputFocused,
    currentSessionId,
    setCurrentSessionId,
    showFileTypes,
    setShowFileTypes,
  };
};
