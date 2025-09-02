import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSaveInsight } from '@/components/SavedInsights';
import { 
  Copy, 
  Reply, 
  Bookmark, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp,
  Brain
} from 'lucide-react';

interface EnhancedMessage {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  metadata?: {
    mood?: string;
    businessType?: string;
    insights?: string[];
    actionItems?: string[];
    followUp?: string;
  };
}

interface EnhancedChatProps {
  messages: EnhancedMessage[];
  onReplyToText?: (selectedText: string, originalMessage: EnhancedMessage) => void;
  onQuickAction?: (action: string, message: EnhancedMessage) => void;
  userProfile?: any;
  userId: string;
}

export const EnhancedChat = ({ 
  messages, 
  onReplyToText, 
  onQuickAction, 
  userProfile,
  userId 
}: EnhancedChatProps) => {
  const [selectedText, setSelectedText] = useState('');
  const [showQuickActions, setShowQuickActions] = useState<{ [key: string]: boolean }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const { saveInsight } = useSaveInsight(userId);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString().trim());
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copied!",
        description: "Text copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text.",
        variant: "destructive"
      });
    }
  };

  const handleReplyToSelected = (message: EnhancedMessage) => {
    if (selectedText && onReplyToText) {
      onReplyToText(selectedText, message);
      setSelectedText('');
    }
  };

  const handleSaveInsight = async (text: string, category: string = 'general') => {
    await saveInsight(text, category);
  };

  const toggleQuickActions = (messageId: string) => {
    setShowQuickActions(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const toggleSection = (messageId: string, section: string) => {
    const key = `${messageId}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getMoodEmoji = (mood: string) => {
    const moods = {
      'excited': '🚀',
      'concerned': '⚠️',
      'analytical': '🤔',
      'realistic': '💡',
      'competitive': '🔥'
    };
    return moods[mood as keyof typeof moods] || '💼';
  };

  const extractSections = (content: string) => {
    const sections = {
      analysis: '',
      insights: '',
      actions: '',
      bottomLine: ''
    };

    // Extract sections based on markdown headers
    const analysisMatch = content.match(/\*\*Current Situation Analysis:\*\*([\s\S]*?)(?=###|$)/);
    if (analysisMatch) sections.analysis = analysisMatch[1].trim();

    const insightsMatch = content.match(/### 📊 What I'm Seeing:([\s\S]*?)(?=###|$)/);
    if (insightsMatch) sections.insights = insightsMatch[1].trim();

    const actionsMatch = content.match(/### 🎯 Immediate Action Items:([\s\S]*?)(?=###|$)/);
    if (actionsMatch) sections.actions = actionsMatch[1].trim();

    const bottomLineMatch = content.match(/### 💡 Bottom Line:([\s\S]*?)(?=---)/);
    if (bottomLineMatch) sections.bottomLine = bottomLineMatch[1].trim();

    return sections;
  };

  const QuickActionButtons = ({ message }: { message: EnhancedMessage }) => {
    const actions = [
      { label: "Tell me more about this", action: "elaborate" },
      { label: "I disagree with this", action: "disagree" },
      { label: "How do I implement this?", action: "implement" },
      { label: "Show me examples", action: "examples" },
      { label: "What's the ROI?", action: "roi" }
    ];

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onQuickAction?.(action.action, message)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4" onMouseUp={handleTextSelection}>
      {messages.map((message) => {
        const isAyn = message.sender === 'ayn';
        const sections = isAyn ? extractSections(message.content) : null;
        
        return (
          <div 
            key={message.id} 
            className={`flex gap-3 ${isAyn ? 'justify-start' : 'justify-end'}`}
          >
            {isAyn && (
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className={`max-w-[70%] ${isAyn ? 'bg-card' : 'bg-primary text-primary-foreground'} rounded-lg p-4 shadow-sm border`}>
              {/* Message Header for AYN */}
              {isAyn && message.metadata && (
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                  <span className="text-lg">{getMoodEmoji(message.metadata.mood || 'analytical')}</span>
                  <span className="font-semibold text-sm">AYN Business Consultant</span>
                  {message.metadata.businessType && (
                    <Badge variant="secondary" className="text-xs">
                      {message.metadata.businessType}
                    </Badge>
                  )}
                </div>
              )}

              {/* Enhanced AYN Response */}
              {isAyn && sections?.analysis ? (
                <div className="space-y-4">
                  {/* Main Analysis */}
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>

                  {/* Action Items Section */}
                  {message.metadata?.actionItems && message.metadata.actionItems.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <button
                        onClick={() => toggleSection(message.id, 'actions')}
                        className="flex items-center gap-2 font-medium text-sm mb-2 hover:text-primary"
                      >
                        <span>🎯 Quick Actions</span>
                        {expandedSections[`${message.id}-actions`] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      
                      {expandedSections[`${message.id}-actions`] && (
                        <div className="space-y-2">
                          {message.metadata.actionItems.map((item, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-primary font-medium">{index + 1}.</span>
                              <span className="text-sm">{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}

              {/* Message Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(message.content)}
                  className="h-7 px-2"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>

                {isAyn && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveInsight(message.content, 'general')}
                      className="h-7 px-2"
                    >
                      <Bookmark className="w-3 h-3 mr-1" />
                      Save
                    </Button>

                    {selectedText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReplyToSelected(message)}
                        className="h-7 px-2 bg-primary/10"
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Reply to "{selectedText.slice(0, 20)}..."
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleQuickActions(message.id)}
                      className="h-7 px-2"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Quick Reply
                    </Button>
                  </>
                )}
              </div>

              {/* Quick Action Buttons */}
              {isAyn && showQuickActions[message.id] && (
                <QuickActionButtons message={message} />
              )}

              {/* Follow-up Suggestion */}
              {isAyn && message.metadata?.followUp && (
                <div className="mt-3 p-2 bg-muted/30 rounded-lg border-l-2 border-primary">
                  <p className="text-xs text-muted-foreground">💭 Follow-up suggestion:</p>
                  <p className="text-sm mt-1">{message.metadata.followUp}</p>
                </div>
              )}
            </div>

            {!isAyn && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">
                  {userProfile?.contact_person?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};