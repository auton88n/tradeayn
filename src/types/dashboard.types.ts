// ============================================
// MESSAGE TYPES
// ============================================

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  isTyping?: boolean;
  attachment?: FileAttachment;
}

export interface FileAttachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

// ============================================
// USER TYPES
// ============================================

export interface UserProfile {
  user_id: string;
  contact_person?: string;
  company_name?: string;
  business_type?: string;
  business_context?: string;
  avatar_url?: string;
}

export interface UserAccess {
  is_active: boolean;
  expires_at?: string;
}

// ============================================
// CHAT SESSION TYPES
// ============================================

export interface ChatSession {
  sessionId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatHistory {
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  sessionId: string;
}

// ============================================
// AI MODE TYPES
// ============================================

export type AIMode = 
  | 'General' 
  | 'Nen Mode ⚡' 
  | 'Research Pro' 
  | 'PDF Analyst' 
  | 'Vision Lab'
  | 'Civil Engineering';

export interface AIModeConfig {
  name: AIMode;
  translatedName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  webhookUrl: string;
}

// ============================================
// VISUAL CANVAS TYPES
// ============================================

export type CanvasPanelPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface VisualPanel {
  id: string;
  type: 'image' | 'chart' | 'diagram';
  content: string; // base64 image or data
  title?: string;
  position: CanvasPanelPosition;
  createdAt: Date;
  prompt?: string; // Original prompt used to generate
}

export interface VisualResponseState {
  panels: VisualPanel[];
  isGenerating: boolean;
  error: string | null;
}

// ============================================
// WEBHOOK PAYLOAD TYPES
// ============================================

export interface WebhookPayload {
  message: string;
  userId: string;
  userEmail: string;
  mode: AIMode;
  sessionId: string;
  conversationHistory: ConversationHistoryItem[];
  userProfile: Partial<UserProfile>;
  allowPersonalization: boolean;
  detectedLanguage: 'ar' | 'en';
  concise: boolean;
  timestamp: string;
  has_attachment: boolean;
  file_data: FileAttachment | null;
}

export interface ConversationHistoryItem {
  content: string;
  sender: 'user' | 'ayn';
  timestamp: string;
  has_attachment?: boolean;
  attachment?: FileAttachment | null;
}

// ============================================
// DASHBOARD STATE TYPES
// ============================================

export interface DashboardState {
  // Messages
  messages: Message[];
  isTyping: boolean;
  
  // Session
  currentSessionId: string;
  recentChats: ChatHistory[];
  
  // UI State
  selectedMode: AIMode;
  showChatSelection: boolean;
  selectedChats: Set<number>;
  activeTab: 'chat' | 'admin';
  
  // File Upload
  selectedFile: File | null;
  isUploading: boolean;
  isDragOver: boolean;
  
  // User
  userProfile: UserProfile | null;
  hasAccess: boolean;
  hasAcceptedTerms: boolean;
  isAdmin: boolean;
  
  // Settings
  allowPersonalization: boolean;
  
  // Maintenance
  maintenanceConfig: MaintenanceConfig;
}

export interface MaintenanceConfig {
  enableMaintenance: boolean;
  maintenanceMessage: string;
  maintenanceStartTime: string;
  maintenanceEndTime: string;
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseMessagesReturn {
  messages: Message[];
  isTyping: boolean;
  loadMessages: () => Promise<void>;
  sendMessage: (content: string, attachment?: FileAttachment | null) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export interface UseFileUploadReturn {
  selectedFile: File | null;
  isUploading: boolean;
  isDragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadFile: (file: File) => Promise<FileAttachment | null>;
  handleFileSelect: (file: File | null) => void;
  removeFile: () => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export interface UseChatSessionReturn {
  currentSessionId: string;
  recentChats: ChatHistory[];
  selectedChats: Set<number>;
  showChatSelection: boolean;
  setSelectedChats: (chats: Set<number>) => void;
  setShowChatSelection: (show: boolean) => void;
  loadRecentChats: () => Promise<void>;
  startNewChat: () => void;
  loadChat: (chatHistory: ChatHistory) => Message[];
  deleteSelectedChats: () => Promise<void>;
  toggleChatSelection: (index: number) => void;
  selectAllChats: () => void;
}

export interface UseAuthReturn {
  hasAccess: boolean;
  hasAcceptedTerms: boolean;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  checkAccess: () => Promise<void>;
  checkAdminRole: () => Promise<void>;
  loadUserProfile: () => Promise<void>;
  acceptTerms: () => void;
}

export interface UseVisualResponsesReturn {
  panels: VisualPanel[];
  isGenerating: boolean;
  error: string | null;
  generateImage: (prompt: string) => Promise<void>;
  closePanel: (panelId: string) => void;
  clearAllPanels: () => void;
  detectVisualIntent: (message: string) => boolean;
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface MessageBubbleProps {
  message: Message;
  onCopy: (content: string) => void;
  onReply: (message: Message) => void;
  userName?: string;
  userAvatar?: string;
}

export interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  userName?: string;
  userAvatar?: string;
  onCopy: (content: string) => void;
  onReply: (message: Message) => void;
}

export interface ChatInputProps {
  onSend: (content: string, fileToUpload?: File | null) => Promise<void>;
  isDisabled: boolean;
  selectedMode: AIMode;
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
  hasMessages: boolean;
  sidebarOpen?: boolean;
  transcriptOpen?: boolean;
  modes: AIModeConfig[];
  onModeChange: (mode: AIMode) => void;
  prefillValue?: string;
  onPrefillConsumed?: () => void;
}

export interface SidebarProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  isTyping: boolean;
  hasAccess: boolean;
  selectedMode: AIMode;
  modes: AIModeConfig[];
  recentChats: ChatHistory[];
  showChatSelection: boolean;
  selectedChats: Set<number>;
  onModeSelect: (mode: AIMode) => void;
  onNewChat: () => void;
  onLoadChat: (chat: ChatHistory) => void;
  onToggleChatSelection: (index: number) => void;
  onSelectAllChats: () => void;
  onDeleteSelected: () => Promise<void>;
  onShowChatSelection: (show: boolean) => void;
  onLogout: () => Promise<void>;
  onAvatarUpdated?: () => void;
  isAdmin?: boolean;
  onAdminPanelClick?: () => void;
  onStartTutorial?: () => void;
  isTutorialProfileStep?: boolean;
}

export interface CanvasPanelProps {
  panel: VisualPanel;
  eyePosition: { x: number; y: number };
  onClose: (panelId: string) => void;
  isGenerating?: boolean;
}

export interface VisualCanvasProps {
  panels: VisualPanel[];
  eyePosition: { x: number; y: number };
  onClosePanel: (panelId: string) => void;
  isGenerating?: boolean;
}
