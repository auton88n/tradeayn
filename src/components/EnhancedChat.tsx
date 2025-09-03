import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Copy, MessageSquareReply, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import { AYNResponseCard } from '@/components/ayn/AYNResponseCard';
import { BusinessPulseDisplay } from '@/components/ayn/BusinessPulseDisplay';
import { EnhancedMessage } from '@/types/ayn-response';

// Enhanced message interface moved to types file

interface EnhancedChatProps {
  messages: EnhancedMessage[];
  onReply?: (content: string) => void;
  onQuickAction?: (action: string, message: EnhancedMessage) => void;
  userProfile?: {
    id: string;
    company_name?: string;
    contact_person?: string;
    business_type?: string;
  };
}

export const EnhancedChat: React.FC<EnhancedChatProps> = ({
  messages,
  onReply,
  onQuickAction,
  userProfile
}) => {
  const { toast } = useToast();
  const [selectedText, setSelectedText] = useState<string>('');
  const [showQuickActions, setShowQuickActions] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    } else {
      setSelectedText('');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleReplyToSelected = (text: string) => {
    onReply?.(`Regarding "${text}" - `);
    setSelectedText('');
  };

  const handleSaveInsight = (message: EnhancedMessage) => {
    // This would typically save to a insights collection
    toast({
      title: "Insight saved",
      description: "Added to your saved insights",
    });
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
    const moods: Record<string, string> = {
      analytical: '🔍',
      excited: '🚀',
      concerned: '⚠️',
      realistic: '📊',
      supportive: '💪',
      focused: '🎯',
      direct: '⚡',
      challenging: '🔥',
      urgent: '🚨'
    };
    return moods[mood] || '🤖';
  };

  // Extract structured sections from markdown content (legacy support)
  const extractSections = (content: string) => {
    const sections: Record<string, string> = {};
    
    // Simple extraction logic for backward compatibility
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n');
        }
        currentSection = line.replace(/^#+\s*/, '').toLowerCase().replace(/\s+/g, '_');
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }
    
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n');
    }
    
    return Object.keys(sections).length > 0 ? sections : null;
  };

  // Quick action buttons component
  const QuickActionButtons: React.FC<{ message: EnhancedMessage }> = ({ message }) => {
    const quickActions = [
      { label: "Tell me more", action: "expand_on_this" },
      { label: "How do I implement this?", action: "implementation_guide" },
      { label: "What are the risks?", action: "risk_analysis" },
      { label: "Show me examples", action: "provide_examples" }
    ];

    return (
      <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border">
        {quickActions.map((action, index) => (
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
            
            {/* Enhanced AYN Response Display */}
            {isAyn ? (
              <div className="max-w-[85%] space-y-4">
                {/* Show enhanced response if available */}
                {message.aynResponse ? (
                  <AYNResponseCard 
                    response={message.aynResponse}
                    onActionClick={(actionId) => {
                      // Handle contextual action clicks
                      console.log('Action clicked:', actionId);
                      // You can implement specific actions here
                    }}
                  />
                ) : (
                  /* Fallback to legacy display */
                  <div className="bg-card rounded-lg p-4 shadow-sm border">
                    {message.metadata && (
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
                    
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>

                    {/* Legacy Action Items */}
                    {message.metadata?.actionItems && message.metadata.actionItems.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection(message.id, 'actionItems')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {expandedSections[`${message.id}-actionItems`] ? 'Hide' : 'Show'} Action Items
                        </Button>
                        {expandedSections[`${message.id}-actionItems`] && (
                          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                            {message.metadata.actionItems.map((item, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                <span className="text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      
                      {selectedText && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReplyToSelected(selectedText)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <MessageSquareReply className="w-3 h-3 mr-1" />
                          Reply to "{selectedText.substring(0, 20)}..."
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveInsight(message)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Bookmark className="w-3 h-3 mr-1" />
                        Save
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleQuickActions(message.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Quick Actions
                      </Button>
                    </div>

                    {/* Quick Actions */}
                    {showQuickActions[message.id] && (
                      <QuickActionButtons message={message} />
                    )}
                  </div>
                )}

                {/* Business Pulse Display */}
                {message.businessPulse && (
                  <BusinessPulseDisplay pulse={message.businessPulse} />
                )}
              </div>
            ) : (
              /* User Message */
              <div className="max-w-[70%] bg-primary text-primary-foreground rounded-lg p-4 shadow-sm border">
                <div className="prose prose-sm max-w-none prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            )}

            {!isAyn && userProfile && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">
                  {userProfile.contact_person?.split(' ').map(n => n[0]).join('') || 'U'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};